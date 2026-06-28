import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEntity, TicketPriority } from './entities/ticket.entity';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import {
  CreateTicketExternoDto,
  TicketSourceEnum,
} from './dtos/create-ticket-externo.dto';
import { TicketPriorityEnum } from './dtos/create-ticket.dto';
import { UpdateTicketDto } from './dtos/update-ticket.dto';
import { TicketDto } from './dtos/ticket.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { IncidentesService } from '../incidentes/incidentes.service';
import { ClientesService } from '../clientes/clientes.service';
import { InteraccionesService } from '../interacciones/interacciones.service';
import { AuthorTypeEnum } from '../interacciones/dtos/create-interaccion.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketEntity)
    private ticketRepository: Repository<TicketEntity>,
    private readonly analyticsService: AnalyticsService,
    private readonly incidentesService: IncidentesService,
    private readonly clientesService: ClientesService,
    private readonly interaccionesService: InteraccionesService,
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

    this.emitTicketCreado(savedTicket).catch(() => {});

    if (createTicketDto.prioridad === TicketPriorityEnum.CRITICA) {
      const dto = this.mapToDto(savedTicket);
      this.incidentesService.enviarAlerta(dto).catch(() => {});
    }

    return this.mapToDto(savedTicket);
  }

  async createExterno(dto: CreateTicketExternoDto): Promise<TicketDto> {
    const ticket = this.ticketRepository.create({
      asunto: dto.asunto,
      canal: 'email',
      prioridad: dto.prioridad,
      cliente_id: dto.cliente_id,
      pedido_id_ref: dto.pedido_id_ref,
      suscripcion_id_ref: dto.suscripcion_id_ref,
      pago_id_ref: dto.pago_id_ref,
      salud_ref: dto.salud_ref,
      estado: 'abierto',
      fecha_vencimiento_sla: this.calculateSlaExpiration(dto.prioridad),
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    this.emitTicketCreado(savedTicket).catch(() => {});

    if (dto.descripcion) {
      let autorId = '00000000-0000-0000-0000-000000000001';
      if (
        dto.sistema_origen === TicketSourceEnum.PEDIDOS &&
        dto.pedido_id_ref
      ) {
        autorId = dto.pedido_id_ref;
      } else if (
        dto.sistema_origen === TicketSourceEnum.SUSCRIPCIONES &&
        dto.suscripcion_id_ref
      ) {
        autorId = dto.suscripcion_id_ref;
      } else if (
        dto.sistema_origen === TicketSourceEnum.PAGOS &&
        dto.pago_id_ref
      ) {
        autorId = dto.pago_id_ref;
      } else if (
        dto.sistema_origen === TicketSourceEnum.SALUD &&
        dto.salud_ref
      ) {
        autorId = dto.salud_ref;
      }

      this.interaccionesService
        .create({
          ticket_id: savedTicket.id,
          autor_tipo: AuthorTypeEnum.SISTEMA,
          autor_id: autorId,
          contenido: dto.descripcion,
          es_nota_interna: false,
        })
        .catch(() => {});
    }

    if (dto.prioridad === TicketPriorityEnum.CRITICA) {
      const dtoMapped = this.mapToDto(savedTicket);
      this.incidentesService.enviarAlerta(dtoMapped).catch(() => {});
    }

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

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<TicketDto> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} no encontrado`);
    }

    const previousAgenteId = ticket.agente_id;
    const previousEstado = ticket.estado;

    if (updateTicketDto.prioridad) {
      updateTicketDto['fecha_vencimiento_sla'] = this.calculateSlaExpiration(
        updateTicketDto.prioridad,
      );
    }

    Object.assign(ticket, updateTicketDto);
    const updatedTicket = await this.ticketRepository.save(ticket);

    this.emitUpdateEvents(
      updatedTicket,
      previousAgenteId,
      previousEstado,
    ).catch(() => {});

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

  private async emitTicketCreado(ticket: TicketEntity): Promise<void> {
    let clienteIdentidadId: string | null = null;
    let email: string | null = null;
    let telefono: string | null = null;

    if (ticket.cliente_id) {
      try {
        const cliente = await this.clientesService.findOne(ticket.cliente_id);
        clienteIdentidadId = `usr-${cliente.id}`;
        email = cliente.email;
        telefono = cliente.telefono ?? null;
      } catch {
        // Cliente not found, continue with null values
      }
    }

    await this.analyticsService.emit('ticket.creado', {
      ticket_id: ticket.id,
      asunto: ticket.asunto,
      estado: this.analyticsService.mapEstado(ticket.estado),
      prioridad: this.analyticsService.mapPrioridad(ticket.prioridad),
      canal: this.analyticsService.mapCanal(ticket.canal),
      source_project: ticket.pedido_id_ref,
      cliente_identidad_id: clienteIdentidadId,
      email,
      telefono,
      agente_id: ticket.agente_id,
      pedido_id_ref: ticket.pedido_id_ref,
      suscripcion_id_red: ticket.suscripcion_id_ref,
      fecha_vencimiento_sla: ticket.fecha_vencimiento_sla.toISOString(),
    });
  }

  private async emitUpdateEvents(
    ticket: TicketEntity,
    previousAgenteId: string | null,
    previousEstado: string,
  ): Promise<void> {
    if (!previousAgenteId && ticket.agente_id) {
      await this.analyticsService.emit('ticket.asignado', {
        ticket_id: ticket.id,
        agente_id: ticket.agente_id,
        estado: this.analyticsService.mapEstado(ticket.estado),
      });
    }

    if (previousEstado !== 'resuelto' && ticket.estado === 'resuelto') {
      const now = new Date();
      const resolutionTimeHours =
        (now.getTime() - ticket.creado_en.getTime()) / (1000 * 60 * 60);
      const withinSla = now <= ticket.fecha_vencimiento_sla;

      await this.analyticsService.emit('ticket.resuelto', {
        ticket_id: ticket.id,
        resolved_at: now.toISOString(),
        resolution_time_hours: Math.round(resolutionTimeHours * 10) / 10,
        within_sla: withinSla,
        agente_id: ticket.agente_id,
        prioridad: this.analyticsService.mapPrioridad(ticket.prioridad),
      });
    }

    if (previousEstado !== 'cerrado' && ticket.estado === 'cerrado') {
      await this.analyticsService.emit('ticket.cerrado', {
        ticket_id: ticket.id,
        closed_at: new Date().toISOString(),
        csat_score: null,
      });
    }
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
