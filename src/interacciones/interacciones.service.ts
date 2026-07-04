import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteraccionEntity } from './entities/interaccion.entity';
import { CreateInteraccionDto } from './dtos/create-interaccion.dto';
import { InteraccionDto } from './dtos/interaccion.dto';
import { TicketEntity } from '../tickets/entities/ticket.entity';
// import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class InteraccionesService {
  constructor(
    @InjectRepository(InteraccionEntity)
    private interaccionRepository: Repository<InteraccionEntity>,
    @InjectRepository(TicketEntity)
    private ticketRepository: Repository<TicketEntity>,
    // private readonly analyticsService: AnalyticsService,
  ) {}

  async create(
    createInteraccionDto: CreateInteraccionDto,
  ): Promise<InteraccionDto> {
    const interaccion = this.interaccionRepository.create(createInteraccionDto);
    const savedInteraccion = await this.interaccionRepository.save(interaccion);

    if (createInteraccionDto.autor_tipo === 'agente') {
      const ticket = await this.ticketRepository.findOne({
        where: { id: createInteraccionDto.ticket_id },
      });
      if (ticket && ticket.estado === 'abierto') {
        ticket.estado = 'progreso';
        await this.ticketRepository.save(ticket);
      }
    }

    return this.mapToDto(savedInteraccion);
  }

  async findByTicketId(ticketId: string): Promise<InteraccionDto[]> {
    const interacciones = await this.interaccionRepository.find({
      where: { ticket_id: ticketId },
      order: { creado_en: 'ASC' },
    });

    return interacciones.map((i) => this.mapToDto(i));
  }

  async findById(id: string): Promise<InteraccionDto> {
    const interaccion = await this.interaccionRepository.findOne({
      where: { id },
    });

    if (!interaccion) {
      throw new NotFoundException(`Interacción ${id} no encontrada`);
    }

    return this.mapToDto(interaccion);
  }

  async findByTicketIdExcludingInternal(
    ticketId: string,
  ): Promise<InteraccionDto[]> {
    const interacciones = await this.interaccionRepository.find({
      where: {
        ticket_id: ticketId,
        es_nota_interna: false,
      },
      order: { creado_en: 'ASC' },
    });

    return interacciones.map((i) => this.mapToDto(i));
  }

  async delete(id: string): Promise<void> {
    const result = await this.interaccionRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Interacción ${id} no encontrada`);
    }
  }

  private mapToDto(interaccion: InteraccionEntity): InteraccionDto {
    return {
      id: interaccion.id,
      ticket_id: interaccion.ticket_id,
      autor_tipo: interaccion.autor_tipo,
      autor_id: interaccion.autor_id,
      contenido: interaccion.contenido,
      es_nota_interna: interaccion.es_nota_interna,
      creado_en: interaccion.creado_en,
    };
  }
}
