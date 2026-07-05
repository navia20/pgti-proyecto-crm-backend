import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { TicketEnlaceEntity } from '../tickets/entities/ticket-enlace.entity';
import { NotificacionPayload } from './dto/notificacion.dto';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(TicketEnlaceEntity)
    private readonly enlaceRepository: Repository<TicketEnlaceEntity>,
  ) {
    this.apiUrl =
      this.configService.get<string>('NOTIFICACIONES_API_URL') || '';
    this.apiKey =
      this.configService.get<string>('NOTIFICACIONES_API_KEY') || '';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
  }

  private async enviar(payload: NotificacionPayload): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ ok: boolean }>(this.apiUrl, payload, {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data?.ok !== false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al enviar notificación: ${message}`);
      return false;
    }
  }

  private async crearEnlace(ticketId: string): Promise<string> {
    const token = randomUUID();
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7);

    const enlace = this.enlaceRepository.create({
      ticket_id: ticketId,
      token,
      canal_notificacion: 'email',
      expira_en: expiraEn,
      activo: true,
    });

    await this.enlaceRepository.save(enlace);
    return token;
  }

  private async obtenerEnlace(ticketId: string): Promise<string | null> {
    const enlace = await this.enlaceRepository.findOne({
      where: { ticket_id: ticketId, activo: true },
      order: { creado_en: 'DESC' },
    });
    return enlace?.token ?? null;
  }

  private async generarUrlEnlace(ticketId: string): Promise<string> {
    let token = await this.obtenerEnlace(ticketId);
    if (!token) {
      token = await this.crearEnlace(ticketId);
    }
    return `${this.frontendUrl}/cliente/enlace/${token}`;
  }

  async notificarTicketCreado(
    ticketId: string,
    asunto: string,
    prioridad: string,
    clienteEmail?: string,
    clienteTelefono?: string,
    clienteNombre?: string,
  ): Promise<boolean> {
    if (!clienteEmail && !clienteTelefono) return false;

    const nombre = clienteNombre || 'Cliente';
    const url = await this.generarUrlEnlace(ticketId);
    const hasEmail = !!clienteEmail;
    const hasSms = !!clienteTelefono;

    if (hasEmail) {
      const payload: NotificacionPayload = {
        channel: 'email',
        recipient: {
          email: clienteEmail,
          ...(hasSms ? { telefono: clienteTelefono } : {}),
        },
        subject: `Ticket #${ticketId.substring(0, 8)} creado - ${asunto}`,
        body: {
          email: `<p>Hola <strong>${nombre}</strong>, se ha creado tu ticket.</p><p><strong>Asunto:</strong> ${asunto}</p><p><strong>Prioridad:</strong> ${prioridad}</p><p><a href="${url}">Haz clic aqu&iacute; para responder</a></p>`,
          ...(hasSms
            ? {
                sms: `Tu ticket #${ticketId.substring(0, 8)} fue creado: ${asunto}. Responde: ${url}`,
              }
            : {}),
        },
      };
      return this.enviar(payload);
    }

    if (hasSms) {
      const payload: NotificacionPayload = {
        channel: 'sms',
        recipient: { telefono: clienteTelefono },
        body: {
          sms: `Tu ticket #${ticketId.substring(0, 8)} fue creado: ${asunto}. Responde: ${url}`,
        },
      };
      return this.enviar(payload);
    }

    return false;
  }

  async notificarTicketCerrado(
    ticketId: string,
    asunto: string,
    resolucion: string,
    clienteEmail?: string,
    clienteTelefono?: string,
    clienteNombre?: string,
  ): Promise<boolean> {
    if (!clienteEmail && !clienteTelefono) return false;

    const nombre = clienteNombre || 'Cliente';
    const url = await this.generarUrlEnlace(ticketId);
    const hasEmail = !!clienteEmail;
    const hasSms = !!clienteTelefono;

    if (hasEmail) {
      const payload: NotificacionPayload = {
        channel: 'email',
        recipient: {
          email: clienteEmail,
          ...(hasSms ? { telefono: clienteTelefono } : {}),
        },
        subject: `Tu ticket #${ticketId.substring(0, 8)} ha sido cerrado`,
        body: {
          email: `<p>Hola <strong>${nombre}</strong>, tu ticket ha sido cerrado.</p><p><strong>Resoluci&oacute;n:</strong> ${resolucion}</p><p>Si necesitas ayuda adicional, h&aacute;blanos desde el enlace de tu ticket.</p>`,
          ...(hasSms
            ? {
                sms: `Tu ticket #${ticketId.substring(0, 8)} fue cerrado: ${resolucion}. Si necesitas m&aacute;s ayuda: ${url}`,
              }
            : {}),
        },
      };
      return this.enviar(payload);
    }

    if (hasSms) {
      const payload: NotificacionPayload = {
        channel: 'sms',
        recipient: { telefono: clienteTelefono },
        body: {
          sms: `Tu ticket #${ticketId.substring(0, 8)} fue cerrado: ${resolucion}. Si necesitas m&aacute;s ayuda: ${url}`,
        },
      };
      return this.enviar(payload);
    }

    return false;
  }
}
