import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TicketSolicitudEntity } from './entities/ticket-solicitud.entity';
import { CrearSolicitudDto } from './dtos/crear-solicitud.dto';
import {
  AprobarSolicitudDto,
  RechazarSolicitudDto,
} from './dtos/aprobar-solicitud.dto';
import { TicketsService } from '../tickets/tickets.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { ClientesService } from '../clientes/clientes.service';
import { InteraccionesService } from '../interacciones/interacciones.service';
import { AuthorTypeEnum } from '../interacciones/dtos/create-interaccion.dto';
import {
  TicketChannelEnum,
  TicketPriorityEnum,
} from '../tickets/dtos/create-ticket.dto';

@Injectable()
export class SolicitudesService {
  private readonly logger = new Logger(SolicitudesService.name);

  constructor(
    @InjectRepository(TicketSolicitudEntity)
    private readonly solicitudRepository: Repository<TicketSolicitudEntity>,
    private readonly ticketsService: TicketsService,
    private readonly notificacionesService: NotificacionesService,
    private readonly clientesService: ClientesService,
    private readonly interaccionesService: InteraccionesService,
  ) {}

  async crear(dto: CrearSolicitudDto): Promise<TicketSolicitudEntity> {
    const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
    const solicitudesRecientes = await this.solicitudRepository.count({
      where: {
        email: dto.email,
        creado_en: MoreThan(unaHoraAtras),
      },
    });

    if (solicitudesRecientes >= 3) {
      throw new BadRequestException(
        'Has enviado demasiadas solicitudes. Intenta de nuevo en una hora.',
      );
    }

    const solicitud = this.solicitudRepository.create(dto);
    return this.solicitudRepository.save(solicitud);
  }

  async findAll(estado?: string): Promise<TicketSolicitudEntity[]> {
    const where = estado
      ? { estado: estado as 'pendiente' | 'aprobada' | 'rechazada' }
      : {};
    return this.solicitudRepository.find({
      where,
      order: { creado_en: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TicketSolicitudEntity> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id },
    });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud ${id} no encontrada`);
    }
    return solicitud;
  }

  async aprobar(
    id: string,
    dto: AprobarSolicitudDto,
  ): Promise<{ solicitud: TicketSolicitudEntity; ticketId: string }> {
    const solicitud = await this.findOne(id);

    if (solicitud.estado !== 'pendiente') {
      throw new BadRequestException('Esta solicitud ya fue procesada');
    }

    let cliente = await this.clientesService.findByEmailOrTelefono(
      solicitud.email,
      solicitud.telefono,
    );

    if (!cliente) {
      cliente = await this.clientesService.create({
        nombre_completo: solicitud.nombre,
        email: solicitud.email,
        telefono: solicitud.telefono,
      });
    }

    const ticket = await this.ticketsService.create({
      asunto: dto.asunto || solicitud.asunto,
      canal: (dto.canal || 'email') as TicketChannelEnum,
      prioridad: (dto.prioridad || 'media') as TicketPriorityEnum,
      cliente_id: cliente.id,
    });

    const contenidoInteraccion = dto.descripcion || solicitud.descripcion;

    if (contenidoInteraccion) {
      await this.interaccionesService.create({
        ticket_id: ticket.id,
        autor_tipo: AuthorTypeEnum.SISTEMA,
        autor_id: 'sistema-solicitudes',
        contenido: contenidoInteraccion,
        es_nota_interna: false,
      });
    }

    solicitud.estado = 'aprobada';
    await this.solicitudRepository.save(solicitud);

    this.logger.log(`Solicitud ${id} aprobada. Ticket creado: ${ticket.id}`);

    return { solicitud, ticketId: ticket.id };
  }

  async rechazar(
    id: string,
    dto: RechazarSolicitudDto,
  ): Promise<TicketSolicitudEntity> {
    const solicitud = await this.findOne(id);

    if (solicitud.estado !== 'pendiente') {
      throw new BadRequestException('Esta solicitud ya fue procesada');
    }

    solicitud.estado = 'rechazada';
    solicitud.motivo_rechazo = dto.motivo;
    return this.solicitudRepository.save(solicitud);
  }

  async contarPendientes(): Promise<number> {
    return this.solicitudRepository.count({
      where: { estado: 'pendiente' },
    });
  }
}
