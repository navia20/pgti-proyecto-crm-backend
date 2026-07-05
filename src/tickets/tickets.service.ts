import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEntity, TicketPriority } from './entities/ticket.entity';
import { CreateTicketDto, TicketPriorityEnum } from './dtos/create-ticket.dto';
import {
  CreateTicketExternoDto,
  TicketSourceEnum,
} from './dtos/create-ticket-externo.dto';
import { UpdateTicketDto } from './dtos/update-ticket.dto';
import { TicketDto } from './dtos/ticket.dto';
// import { AnalyticsService } from '../analytics/analytics.service';
import { IncidentesService } from '../incidentes/incidentes.service';
import { ClientesService } from '../clientes/clientes.service';
import { InteraccionesService } from '../interacciones/interacciones.service';
import { AuthorTypeEnum } from '../interacciones/dtos/create-interaccion.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(TicketEntity)
    private ticketRepository: Repository<TicketEntity>,
    // private readonly analyticsService: AnalyticsService,
    private readonly incidentesService: IncidentesService,
    private readonly clientesService: ClientesService,
    private readonly interaccionesService: InteraccionesService,
    private readonly notificacionesService: NotificacionesService,
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

    if (savedTicket.cliente_id) {
      this.enviarNotificacionCreacion(savedTicket).catch(() => {});
    }

    if (createTicketDto.prioridad === TicketPriorityEnum.CRITICA) {
      const dtoMapped = this.mapToDto(savedTicket);
      this.incidentesService
        .enviarAlerta(dtoMapped, createTicketDto.descripcion)
        .catch(() => {});
    }

    return this.mapToDto(savedTicket);
  }

  async createExterno(dto: CreateTicketExternoDto): Promise<TicketDto> {
    let clienteId = dto.cliente_id;

    if (!clienteId && (dto.cliente_email || dto.cliente_telefono)) {
      const existing = await this.clientesService.findByEmailOrTelefono(
        dto.cliente_email,
        dto.cliente_telefono,
      );

      if (existing) {
        clienteId = existing.id;
      } else if (
        dto.cliente_nombre &&
        (dto.cliente_email || dto.cliente_telefono)
      ) {
        const nuevoCliente = await this.clientesService.create({
          nombre_completo: dto.cliente_nombre,
          email:
            dto.cliente_email ||
            `${dto.cliente_nombre.toLowerCase().replace(/\s/g, '.')}@temp.local`,
          telefono: dto.cliente_telefono,
        });
        clienteId = nuevoCliente.id;
      }
    }

    const ticket = this.ticketRepository.create({
      asunto: dto.asunto,
      canal: 'email',
      prioridad: dto.prioridad,
      cliente_id: clienteId,
      pedido_id_ref: dto.pedido_id_ref,
      suscripcion_id_ref: dto.suscripcion_id_ref,
      pago_id_ref: dto.pago_id_ref,
      salud_ref: dto.salud_ref,
      sistema_id: dto.sistema_id,
      estado: 'abierto',
      fecha_vencimiento_sla: this.calculateSlaExpiration(dto.prioridad),
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    if (savedTicket.cliente_id) {
      this.enviarNotificacionCreacion(savedTicket).catch(() => {});
    }

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
      this.incidentesService
        .enviarAlerta(dtoMapped, dto.descripcion)
        .catch(() => {});
    }

    return this.mapToDto(savedTicket);
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    estado?: string,
    prioridad?: string,
    cliente_id?: number,
    canal?: string,
    search?: string,
    referencia?: string,
    agente_id?: string,
    ordenar?: string,
    direccion?: string,
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

    if (canal) {
      query.andWhere('ticket.canal = :canal', { canal });
    }

    if (search) {
      query.andWhere('ticket.asunto ILIKE :search', { search: `%${search}%` });
    }

    if (agente_id) {
      query.andWhere('ticket.agente_id = :agente_id', { agente_id });
    }

    if (referencia) {
      switch (referencia) {
        case 'pedido':
          query.andWhere('ticket.pedido_id_ref IS NOT NULL');
          break;
        case 'suscripcion':
          query.andWhere('ticket.suscripcion_id_ref IS NOT NULL');
          break;
        case 'salud':
          query.andWhere('ticket.salud_ref IS NOT NULL');
          break;
        case 'pago':
          query.andWhere('ticket.pago_id_ref IS NOT NULL');
          break;
        case 'ninguna':
          query.andWhere('ticket.pedido_id_ref IS NULL');
          query.andWhere('ticket.suscripcion_id_ref IS NULL');
          query.andWhere('ticket.salud_ref IS NULL');
          query.andWhere('ticket.pago_id_ref IS NULL');
          break;
      }
    }

    const sortField =
      ordenar === 'fecha_vencimiento_sla'
        ? 'ticket.fecha_vencimiento_sla'
        : ordenar === 'prioridad'
          ? 'ticket.prioridad'
          : 'ticket.creado_en';
    const sortDir = direccion === 'ASC' ? 'ASC' : 'DESC';

    const [tickets, total] = await query
      .orderBy(sortField, sortDir)
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const clienteNames = await this.getClientNames(tickets);

    return {
      data: tickets.map((t) =>
        this.mapToDto(t, clienteNames.get(t.cliente_id)),
      ),
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

    const clienteNames = ticket.cliente_id
      ? await this.getClientNames([ticket])
      : new Map();

    return this.mapToDto(
      ticket,
      clienteNames.get(ticket.cliente_id) as string | undefined,
    );
  }

  async findByClientId(clienteId: number): Promise<TicketDto[]> {
    const tickets = await this.ticketRepository.find({
      where: { cliente_id: clienteId },
      order: { creado_en: 'DESC' },
    });

    const clienteNames = await this.getClientNames(tickets);

    return tickets.map((t) => this.mapToDto(t, clienteNames.get(t.cliente_id)));
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<TicketDto> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} no encontrado`);
    }

    const previousEstado = ticket.estado;

    if (updateTicketDto.prioridad) {
      updateTicketDto['fecha_vencimiento_sla'] = this.calculateSlaExpiration(
        updateTicketDto.prioridad,
      );
    }

    Object.assign(ticket, updateTicketDto);
    const updatedTicket = await this.ticketRepository.save(ticket);

    if (
      previousEstado !== 'resuelto' &&
      previousEstado !== 'cerrado' &&
      (updatedTicket.estado === 'resuelto' ||
        updatedTicket.estado === 'cerrado')
    ) {
      this.enviarNotificacionCierre(updatedTicket).catch(() => {});
    }

    return this.mapToDto(updatedTicket);
  }

  async delete(id: string): Promise<void> {
    const result = await this.ticketRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Ticket ${id} no encontrado`);
    }
  }

  async obtenerEstadoTicket(ticketId: string): Promise<TicketDto | null> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['interacciones', 'articulos'],
    });

    if (!ticket) {
      return null;
    }

    const clienteNames = ticket.cliente_id
      ? await this.getClientNames([ticket])
      : new Map();

    return this.mapToDto(ticket, clienteNames.get(ticket.cliente_id));
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

  private async enviarNotificacionCreacion(
    ticket: TicketEntity,
  ): Promise<void> {
    try {
      this.logger.log(
        `[Notificación] Preparando notificación de creación para ticket ${ticket.id}, canal=${ticket.canal}`,
      );
      const cliente = await this.clientesService.findOne(ticket.cliente_id);
      this.logger.log(
        `[Notificación] Cliente: ${cliente.nombre_completo}, email=${cliente.email}, telefono=${cliente.telefono}`,
      );
      const resultado = await this.notificacionesService.notificarTicketCreado(
        ticket.id,
        ticket.asunto,
        ticket.prioridad,
        ticket.canal,
        cliente.email,
        cliente.telefono,
        cliente.nombre_completo,
      );
      this.logger.log(
        `[Notificación] Resultado notificación ticket ${ticket.id}: ${resultado}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Notificación] Error al enviar notificación de creación para ticket ${ticket.id}: ${message}`,
      );
    }
  }

  private async enviarNotificacionCierre(ticket: TicketEntity): Promise<void> {
    try {
      const cliente = await this.clientesService.findOne(ticket.cliente_id);
      await this.notificacionesService.notificarTicketCerrado(
        ticket.id,
        ticket.asunto || 'Sin asunto',
        ticket.resolucion || 'Sin resolución especificada',
        ticket.canal,
        cliente.email,
        cliente.telefono,
        cliente.nombre_completo,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error al enviar notificación de cierre para ticket ${ticket.id}: ${message}`,
      );
    }
  }

  private async getClientNames(
    tickets: TicketEntity[],
  ): Promise<Map<number, string>> {
    const clienteIds = [
      ...new Set(tickets.map((t) => t.cliente_id).filter(Boolean)),
    ] as number[];
    const names = new Map<number, string>();

    if (clienteIds.length === 0) return names;

    try {
      const clientes = await this.clientesService.findByIds(clienteIds);
      for (const c of clientes) {
        names.set(c.id, c.nombre_completo);
      }
    } catch {
      // Si falla, usamos el fallback
    }

    return names;
  }

  private mapToDto(ticket: TicketEntity, clienteNombre?: string): TicketDto {
    return {
      id: ticket.id,
      asunto: ticket.asunto,
      estado: ticket.estado,
      prioridad: ticket.prioridad,
      canal: ticket.canal,
      cliente_id: ticket.cliente_id,
      cliente_nombre: clienteNombre ?? `Cliente ${ticket.cliente_id}`,
      agente_id: ticket.agente_id,
      fecha_vencimiento_sla: ticket.fecha_vencimiento_sla,
      pedido_id_ref: ticket.pedido_id_ref,
      suscripcion_id_ref: ticket.suscripcion_id_ref,
      pago_id_ref: ticket.pago_id_ref,
      salud_ref: ticket.salud_ref,
      resolucion: ticket.resolucion,
      creado_en: ticket.creado_en,
      actualizado_en: ticket.actualizado_en,
    };
  }
}
