import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEntity, TicketPriority } from './entities/ticket.entity';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { UpdateTicketDto } from './dtos/update-ticket.dto';
import { TicketDto } from './dtos/ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketEntity)
    private ticketRepository: Repository<TicketEntity>,
  ) {}

  private calculateSlaExpiration(prioridad: TicketPriority): Date {
    const now = new Date();
    const slaHours: Record<TicketPriority, number> = {
      critica: 8,
      alta: 24,
      media: 48,
      baja: 72,
    };

    const hoursToAdd = slaHours[prioridad];
    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  async create(createTicketDto: CreateTicketDto): Promise<TicketDto> {
    if (!createTicketDto.cliente_id && !createTicketDto.canal) {
      throw new BadRequestException('Cliente o canal son requeridos');
    }

    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      estado: 'abierto',
      fecha_vencimiento_sla: this.calculateSlaExpiration(
        createTicketDto.prioridad,
      ),
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    return this.mapToDto(savedTicket);
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    estado?: string,
    prioridad?: string,
    cliente_id?: number,
  ): Promise<{ data: TicketDto[]; total: number }> {
    const query = this.ticketRepository.createQueryBuilder('ticket');

    if (estado) {
      query.andWhere('ticket.estado = :estado', { estado });
    }

    if (prioridad) {
      query.andWhere('ticket.prioridad = :prioridad', { prioridad });
    }

    if (cliente_id) {
      query.andWhere('ticket.cliente_id = :cliente_id', { cliente_id });
    }

    const [tickets, total] = await query
      .orderBy('ticket.creado_en', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data: tickets.map((t) => this.mapToDto(t)),
      total,
    };
  }

  async findById(id: string): Promise<TicketDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['interacciones', 'articulos'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} no encontrado`);
    }

    return this.mapToDto(ticket);
  }

  async findByClientId(clienteId: number): Promise<TicketDto[]> {
    const tickets = await this.ticketRepository.find({
      where: { cliente_id: clienteId },
      order: { creado_en: 'DESC' },
    });

    return tickets.map((t) => this.mapToDto(t));
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<TicketDto> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} no encontrado`);
    }

    if (updateTicketDto.prioridad) {
      updateTicketDto['fecha_vencimiento_sla'] = this.calculateSlaExpiration(
        updateTicketDto.prioridad,
      );
    }

    Object.assign(ticket, updateTicketDto);
    const updatedTicket = await this.ticketRepository.save(ticket);

    return this.mapToDto(updatedTicket);
  }

  async delete(id: string): Promise<void> {
    const result = await this.ticketRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Ticket ${id} no encontrado`);
    }
  }

  async getTicketsBySlaStatus(): Promise<{
    ok: TicketDto[];
    warning: TicketDto[];
    critical: TicketDto[];
  }> {
    const tickets = await this.ticketRepository.find({
      where: { estado: 'abierto' },
    });

    const now = new Date();
    const ok: TicketDto[] = [];
    const warning: TicketDto[] = [];
    const critical: TicketDto[] = [];

    tickets.forEach((ticket) => {
      const timeRemaining =
        ticket.fecha_vencimiento_sla.getTime() - now.getTime();
      const totalSla =
        ticket.fecha_vencimiento_sla.getTime() - ticket.creado_en.getTime();
      const percentageRemaining = (timeRemaining / totalSla) * 100;

      if (percentageRemaining > 25) {
        ok.push(this.mapToDto(ticket));
      } else if (percentageRemaining > 0) {
        warning.push(this.mapToDto(ticket));
      } else {
        critical.push(this.mapToDto(ticket));
      }
    });

    return { ok, warning, critical };
  }

  private mapToDto(ticket: TicketEntity): TicketDto {
    return {
      id: ticket.id,
      asunto: ticket.asunto,
      estado: ticket.estado,
      prioridad: ticket.prioridad,
      canal: ticket.canal,
      cliente_id: ticket.cliente_id,
      agente_id: ticket.agente_id,
      fecha_vencimiento_sla: ticket.fecha_vencimiento_sla,
      pedido_id_ref: ticket.pedido_id_ref,
      suscripcion_id_ref: ticket.suscripcion_id_ref,
      creado_en: ticket.creado_en,
      actualizado_en: ticket.actualizado_en,
    };
  }
}
