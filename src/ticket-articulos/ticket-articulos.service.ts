import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketArticuloEntity } from './entities/ticket-articulo.entity';
import { CreateTicketArticuloDto } from './dtos/create-ticket-articulo.dto';
import { TicketArticuloDto } from './dtos/ticket-articulo.dto';

@Injectable()
export class TicketArticulosService {
  constructor(
    @InjectRepository(TicketArticuloEntity)
    private ticketArticuloRepository: Repository<TicketArticuloEntity>,
  ) {}

  async create(
    createTicketArticuloDto: CreateTicketArticuloDto,
  ): Promise<TicketArticuloDto> {
    const ticketArticulo = this.ticketArticuloRepository.create(
      createTicketArticuloDto,
    );
    const savedTicketArticulo =
      await this.ticketArticuloRepository.save(ticketArticulo);
    return this.mapToDto(savedTicketArticulo);
  }

  async findByTicketId(ticketId: string): Promise<TicketArticuloDto[]> {
    const ticketArticulos = await this.ticketArticuloRepository.find({
      where: { ticket_id: ticketId },
      relations: ['articulo'],
      order: { vinculado_en: 'DESC' },
    });

    return ticketArticulos.map((ta) => this.mapToDto(ta));
  }

  async findById(id: string): Promise<TicketArticuloDto> {
    const ticketArticulo = await this.ticketArticuloRepository.findOne({
      where: { id },
      relations: ['articulo'],
    });

    if (!ticketArticulo) {
      throw new NotFoundException(`Asociación no encontrada`);
    }

    return this.mapToDto(ticketArticulo);
  }

  async markAsSentToClient(id: string): Promise<TicketArticuloDto> {
    const ticketArticulo = await this.ticketArticuloRepository.findOne({
      where: { id },
    });

    if (!ticketArticulo) {
      throw new NotFoundException(`Asociación no encontrada`);
    }

    ticketArticulo.fue_enviado_al_cliente = true;
    const updated = await this.ticketArticuloRepository.save(ticketArticulo);

    return this.mapToDto(updated);
  }

  async delete(id: string): Promise<void> {
    const result = await this.ticketArticuloRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Asociación no encontrada`);
    }
  }

  private mapToDto(ticketArticulo: TicketArticuloEntity): TicketArticuloDto {
    return {
      id: ticketArticulo.id,
      ticket_id: ticketArticulo.ticket_id,
      articulo_id: ticketArticulo.articulo_id,
      fue_enviado_al_cliente: ticketArticulo.fue_enviado_al_cliente,
      agente_id: ticketArticulo.agente_id,
      vinculado_en: ticketArticulo.vinculado_en,
    };
  }
}
