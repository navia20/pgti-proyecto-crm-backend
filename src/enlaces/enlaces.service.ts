import {
  Injectable,
  NotFoundException,
  GoneException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { TicketEnlaceEntity } from '../tickets/entities/ticket-enlace.entity';
import { CrearEnlaceDto } from './dtos/crear-enlace.dto';
import { ResponderEnlaceDto } from './dtos/responder-enlace.dto';
import { InteraccionesService } from '../interacciones/interacciones.service';
import { TicketsService } from '../tickets/tickets.service';
import { ClientesService } from '../clientes/clientes.service';
import { AuthorTypeEnum } from '../interacciones/dtos/create-interaccion.dto';

@Injectable()
export class EnlacesService {
  private readonly logger = new Logger(EnlacesService.name);

  constructor(
    @InjectRepository(TicketEnlaceEntity)
    private enlaceRepository: Repository<TicketEnlaceEntity>,
    private readonly interaccionesService: InteraccionesService,
    private readonly ticketsService: TicketsService,
    private readonly clientesService: ClientesService,
  ) {}

  async crear(
    ticketId: string,
    dto: CrearEnlaceDto,
  ): Promise<{ token: string; url: string }> {
    await this.ticketsService.findById(ticketId);

    const token = randomUUID();
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7);

    const enlace = this.enlaceRepository.create({
      ticket_id: ticketId,
      token,
      canal_notificacion: dto.canal_notificacion || 'otro',
      expira_en: expiraEn,
      activo: true,
    });

    await this.enlaceRepository.save(enlace);

    this.logger.log(`Enlace creado para ticket ${ticketId}: ${token}`);

    return {
      token,
      url: `/cliente/enlace/${token}`,
    };
  }

  async obtenerPorToken(token: string) {
    const enlace = await this.enlaceRepository.findOne({
      where: { token, activo: true },
      relations: ['ticket'],
    });

    if (!enlace) {
      throw new NotFoundException('Enlace no encontrado');
    }

    if (new Date() > enlace.expira_en) {
      throw new GoneException('Este enlace ha expirado');
    }

    const interacciones =
      await this.interaccionesService.findByTicketIdExcludingInternal(
        enlace.ticket_id,
      );

    let cliente_nombre = `Cliente ${enlace.ticket.cliente_id}`;
    if (enlace.ticket.cliente_id) {
      try {
        const cliente = await this.clientesService.findOne(
          enlace.ticket.cliente_id,
        );
        cliente_nombre = cliente.nombre_completo;
      } catch {
        // Cliente no encontrado, usar nombre por defecto
      }
    }

    return {
      ticket: {
        id: enlace.ticket.id,
        asunto: enlace.ticket.asunto,
        estado: enlace.ticket.estado,
        prioridad: enlace.ticket.prioridad,
        canal: enlace.ticket.canal,
        cliente_nombre,
        resolucion: enlace.ticket.resolucion,
        creado_en: enlace.ticket.creado_en,
      },
      interacciones,
      expira_en: enlace.expira_en,
    };
  }

  async responder(token: string, dto: ResponderEnlaceDto) {
    const enlace = await this.enlaceRepository.findOne({
      where: { token, activo: true },
    });

    if (!enlace) {
      throw new NotFoundException('Enlace no encontrado');
    }

    if (new Date() > enlace.expira_en) {
      throw new GoneException('Este enlace ha expirado');
    }

    const interaccion = await this.interaccionesService.create({
      ticket_id: enlace.ticket_id,
      autor_tipo: AuthorTypeEnum.CLIENTE,
      autor_id: `enlace-${token.substring(0, 8)}`,
      contenido: dto.contenido,
      es_nota_interna: false,
    });

    this.logger.log(
      `Respuesta creada via enlace para ticket ${enlace.ticket_id}`,
    );

    return interaccion;
  }
}
