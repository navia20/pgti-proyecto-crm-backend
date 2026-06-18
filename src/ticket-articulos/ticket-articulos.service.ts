import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketArticuloEntity } from './entities/ticket-articulo.entity';
import { CreateTicketArticuloDto } from './dtos/create-ticket-articulo.dto';
import { TicketArticuloDto } from './dtos/ticket-articulo.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { ArticulosKbService } from '../articulos-kb/articulos-kb.service';

@Injectable()
export class TicketArticulosService {
  constructor(
    @InjectRepository(TicketArticuloEntity)
    private ticketArticuloRepository: Repository<TicketArticuloEntity>,
    private readonly analyticsService: AnalyticsService,
    private readonly articulosKbService: ArticulosKbService,
  ) {}

  async create(
    createTicketArticuloDto: CreateTicketArticuloDto,
  ): Promise<TicketArticuloDto> {
    const ticketArticulo = this.ticketArticuloRepository.create(
      createTicketArticuloDto,
    );
    const savedTicketArticulo =
      await this.ticketArticuloRepository.save(ticketArticulo);

    this.emitKbArticuloUsado(savedTicketArticulo).catch(() => {});

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

  private async emitKbArticuloUsado(
    ticketArticulo: TicketArticuloEntity,
  ): Promise<void> {
    let articuloTitulo = '';
    let articuloCategoria = '';

    try {
      const articulo = await this.articulosKbService.findById(
        ticketArticulo.articulo_id,
      );
      articuloTitulo = articulo.titulo;
      articuloCategoria = articulo.categoria;
    } catch {
      // Article not found, continue with empty values
    }

    await this.analyticsService.emit('kb.articulo.usado', {
      ticket_id: ticketArticulo.ticket_id,
      articulo_id: ticketArticulo.articulo_id,
      articulo_titulo: articuloTitulo,
      articulo_categoria: articuloCategoria,
      fue_enviado_al_cliente: ticketArticulo.fue_enviado_al_cliente,
      agente_id: ticketArticulo.agente_id,
      vinculado_en: ticketArticulo.vinculado_en.toISOString(),
    });
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
