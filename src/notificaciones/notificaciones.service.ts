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
  private readonly adminEmail: string;

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
    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL') || '';
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

  private generarUrlAdmin(): string {
    return `${this.frontendUrl}/pages/tickets`;
  }

  async notificarTicketCreado(
    ticketId: string,
    asunto: string,
    prioridad: string,
    canal: string,
    clienteEmail?: string,
    clienteTelefono?: string,
    clienteNombre?: string,
  ): Promise<boolean> {
    const nombre = clienteNombre || 'Cliente';
    const url = await this.generarUrlEnlace(ticketId);
    const shortId = ticketId.substring(0, 8);

    if (!clienteEmail) return false;

    const payload: NotificacionPayload = {
      channel: 'email',
      recipient: { email: clienteEmail },
      subject: `Ticket #${shortId} creado - ${asunto}`,
      body: {
        email: `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background: #2563eb; padding: 20px 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 18px;">Tu ticket ha sido creado</h1>
  </div>
  <div style="padding: 24px;">
    <p style="color: #333; font-size: 15px; margin: 0 0 16px;">Hola <strong>${nombre}</strong>, recibimos tu solicitud y ya est&aacute; en nuestro sistema.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 10px 12px; background: #f9fafb; border-radius: 6px 0 0 6px; font-weight: bold; color: #555; font-size: 13px;">Ticket</td>
        <td style="padding: 10px 12px; background: #f9fafb; border-radius: 0 6px 6px 0; color: #2563eb; font-size: 13px;">#${shortId}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Asunto</td>
        <td style="padding: 10px 12px; color: #333; font-size: 13px;">${asunto}</td>
      </tr>
    </table>
    <a href="${url}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: 8px;">Entrar al chat</a>
    <p style="color: #999; font-size: 12px; margin: 20px 0 0;">Este enlace vence en 7 d&iacute;as.</p>
  </div>
</div>`,
      },
    };
    return this.enviar(payload);
  }

  async notificarTicketCerrado(
    ticketId: string,
    asunto: string,
    resolucion: string,
    canal: string,
    clienteEmail?: string,
    clienteTelefono?: string,
    clienteNombre?: string,
  ): Promise<boolean> {
    const nombre = clienteNombre || 'Cliente';
    const url = await this.generarUrlEnlace(ticketId);
    const shortId = ticketId.substring(0, 8);

    if (!clienteEmail) return false;

    const payload: NotificacionPayload = {
      channel: 'email',
      recipient: { email: clienteEmail },
      subject: `Tu ticket #${shortId} ha sido cerrado`,
      body: {
        email: `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background: #2563eb; padding: 20px 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 18px;">Ticket cerrado</h1>
  </div>
  <div style="padding: 24px;">
    <p style="color: #333; font-size: 15px; margin: 0 0 16px;">Hola <strong>${nombre}</strong>, tu ticket ha sido resuelto y cerrado.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 10px 12px; background: #f9fafb; border-radius: 6px 0 0 6px; font-weight: bold; color: #555; font-size: 13px;">Ticket</td>
        <td style="padding: 10px 12px; background: #f9fafb; border-radius: 0 6px 6px 0; color: #2563eb; font-size: 13px;">#${shortId}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Resoluci&oacute;n</td>
        <td style="padding: 10px 12px; background: #f9fafb; border-radius: 0 6px 6px 0; color: #333; font-size: 13px;">${resolucion}</td>
      </tr>
    </table>
    <a href="${url}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: 8px;">Ver detalle</a>
  </div>
</div>`,
      },
    };
    return this.enviar(payload);
  }

  async notificarTicketCriticoAdmin(
    ticketId: string,
    asunto: string,
    prioridad: string,
    canal: string,
    origen: string,
    clienteNombre?: string,
    fechaVencimientoSla?: Date,
    creadoEn?: Date,
  ): Promise<boolean> {
    if (!this.adminEmail) return false;

    const url = this.generarUrlAdmin();
    const shortId = ticketId.substring(0, 8);
    let slaRestante = 'N/A';
    if (fechaVencimientoSla && creadoEn) {
      const remaining = fechaVencimientoSla.getTime() - Date.now();
      const hours = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
      const minutes = Math.max(
        0,
        Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
      );
      slaRestante = `${hours}h ${minutes}m`;
    }

    const payload: NotificacionPayload = {
      channel: 'email',
      recipient: { email: this.adminEmail },
      subject: `🚨 Ticket crítico #${shortId} - ${asunto}`,
      body: {
        email: `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background: #dc2626; padding: 20px 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 18px;">🚨 Ticket crítico creado</h1>
  </div>
  <div style="padding: 24px;">
    <p style="color: #333; font-size: 15px; margin: 0 0 16px;">Se ha creado un nuevo ticket con prioridad <strong>crítica</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 10px 12px; background: #fef2f2; border-radius: 6px 0 0 6px; font-weight: bold; color: #555; font-size: 13px;">Ticket</td>
        <td style="padding: 10px 12px; background: #fef2f2; border-radius: 0 6px 6px 0; color: #dc2626; font-size: 13px;">#${shortId}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Asunto</td>
        <td style="padding: 10px 12px; color: #333; font-size: 13px;">${asunto}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; background: #fef2f2; font-weight: bold; color: #555; font-size: 13px;">Canal</td>
        <td style="padding: 10px 12px; background: #fef2f2; color: #333; font-size: 13px;">${canal}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Origen</td>
        <td style="padding: 10px 12px; color: #333; font-size: 13px;">${origen}</td>
      </tr>
      ${
        clienteNombre
          ? `<tr>
        <td style="padding: 10px 12px; background: #fef2f2; font-weight: bold; color: #555; font-size: 13px;">Cliente</td>
        <td style="padding: 10px 12px; background: #fef2f2; color: #333; font-size: 13px;">${clienteNombre}</td>
      </tr>`
          : ''
      }
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">SLA restante</td>
        <td style="padding: 10px 12px; color: #dc2626; font-size: 13px; font-weight: bold;">${slaRestante}</td>
      </tr>
    </table>
    <a href="${url}" style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: 8px;">Ver ticket</a>
  </div>
</div>`,
      },
    };
    return this.enviar(payload);
  }

  async notificarAsignacionAgente(
    ticketId: string,
    asunto: string,
    agenteId: string,
    anteriorAgenteId?: string,
  ): Promise<boolean> {
    if (!this.adminEmail) return false;

    const url = this.generarUrlAdmin();
    const shortId = ticketId.substring(0, 8);

    const payload: NotificacionPayload = {
      channel: 'email',
      recipient: { email: this.adminEmail },
      subject: `📋 Ticket #${shortId} asignado a ${agenteId}`,
      body: {
        email: `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background: #2563eb; padding: 20px 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 18px;">📋 Ticket asignado</h1>
  </div>
  <div style="padding: 24px;">
    <p style="color: #333; font-size: 15px; margin: 0 0 16px;">Se ha asignado un agente al siguiente ticket.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 10px 12px; background: #f0f7ff; border-radius: 6px 0 0 6px; font-weight: bold; color: #555; font-size: 13px;">Ticket</td>
        <td style="padding: 10px 12px; background: #f0f7ff; border-radius: 0 6px 6px 0; color: #2563eb; font-size: 13px;">#${shortId}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Asunto</td>
        <td style="padding: 10px 12px; color: #333; font-size: 13px;">${asunto}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; background: #f0f7ff; font-weight: bold; color: #555; font-size: 13px;">Agente asignado</td>
        <td style="padding: 10px 12px; background: #f0f7ff; color: #2563eb; font-size: 13px; font-weight: bold;">${agenteId}</td>
      </tr>
      ${
        anteriorAgenteId
          ? `<tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Agente anterior</td>
        <td style="padding: 10px 12px; color: #999; font-size: 13px;">${anteriorAgenteId}</td>
      </tr>`
          : ''
      }
    </table>
    <a href="${url}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: 8px;">Ver ticket</a>
  </div>
</div>`,
      },
    };
    return this.enviar(payload);
  }

  async notificarInteraccionClienteCritico(
    ticketId: string,
    asunto: string,
    clienteNombre: string,
    contenido: string,
  ): Promise<boolean> {
    if (!this.adminEmail) return false;

    const url = this.generarUrlAdmin();
    const shortId = ticketId.substring(0, 8);
    const contenidoTruncado =
      contenido.length > 200 ? contenido.substring(0, 200) + '...' : contenido;

    const payload: NotificacionPayload = {
      channel: 'email',
      recipient: { email: this.adminEmail },
      subject: `💬 Nuevo mensaje en ticket crítico #${shortId}`,
      body: {
        email: `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background: #ea580c; padding: 20px 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 18px;">💬 Nuevo mensaje del cliente</h1>
  </div>
  <div style="padding: 24px;">
    <p style="color: #333; font-size: 15px; margin: 0 0 16px;"><strong>${clienteNombre}</strong> ha enviado un mensaje en un ticket <strong>crítico</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 10px 12px; background: #fff7ed; border-radius: 6px 0 0 6px; font-weight: bold; color: #555; font-size: 13px;">Ticket</td>
        <td style="padding: 10px 12px; background: #fff7ed; border-radius: 0 6px 6px 0; color: #ea580c; font-size: 13px;">#${shortId}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Asunto</td>
        <td style="padding: 10px 12px; color: #333; font-size: 13px;">${asunto}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; background: #fff7ed; font-weight: bold; color: #555; font-size: 13px;">Cliente</td>
        <td style="padding: 10px 12px; background: #fff7ed; color: #333; font-size: 13px;">${clienteNombre}</td>
      </tr>
    </table>
    <div style="background: #f9fafb; border-left: 4px solid #ea580c; padding: 12px 16px; margin: 16px 0; border-radius: 0 6px 6px 0;">
      <p style="color: #333; font-size: 14px; margin: 0; font-style: italic;">"${contenidoTruncado}"</p>
    </div>
    <a href="${url}" style="display: inline-block; background: #ea580c; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: 8px;">Responder</a>
  </div>
</div>`,
      },
    };
    return this.enviar(payload);
  }

  async notificarSlaWarning(
    ticketId: string,
    asunto: string,
    prioridad: string,
    porcentajeRestante: number,
  ): Promise<boolean> {
    if (!this.adminEmail) return false;

    const url = this.generarUrlAdmin();
    const shortId = ticketId.substring(0, 8);

    const payload: NotificacionPayload = {
      channel: 'email',
      recipient: { email: this.adminEmail },
      subject: `⏰ SLA al ${Math.round(porcentajeRestante)}% - Ticket #${shortId}`,
      body: {
        email: `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background: #ca8a04; padding: 20px 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 18px;">⏰ Alerta de SLA</h1>
  </div>
  <div style="padding: 24px;">
    <p style="color: #333; font-size: 15px; margin: 0 0 16px;">El tiempo de SLA de un ticket <strong>crítico</strong> está por agotarse.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 10px 12px; background: #fefce8; border-radius: 6px 0 0 6px; font-weight: bold; color: #555; font-size: 13px;">Ticket</td>
        <td style="padding: 10px 12px; background: #fefce8; border-radius: 0 6px 6px 0; color: #ca8a04; font-size: 13px;">#${shortId}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Asunto</td>
        <td style="padding: 10px 12px; color: #333; font-size: 13px;">${asunto}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; background: #fefce8; font-weight: bold; color: #555; font-size: 13px;">Prioridad</td>
        <td style="padding: 10px 12px; background: #fefce8; color: #ca8a04; font-size: 13px; font-weight: bold;">${prioridad}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">SLA restante</td>
        <td style="padding: 10px 12px; color: #ca8a04; font-size: 13px; font-weight: bold;">${Math.round(porcentajeRestante)}%</td>
      </tr>
    </table>
    <a href="${url}" style="display: inline-block; background: #ca8a04; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: 8px;">Ver ticket</a>
  </div>
</div>`,
      },
    };
    return this.enviar(payload);
  }

  async notificarTicketCriticoResuelto(
    ticketId: string,
    asunto: string,
    resolucion: string,
    agenteId?: string,
    creadoEn?: Date,
  ): Promise<boolean> {
    if (!this.adminEmail) return false;

    const url = this.generarUrlAdmin();
    const shortId = ticketId.substring(0, 8);
    let tiempoResolucion = 'N/A';
    if (creadoEn) {
      const diff = Date.now() - creadoEn.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      tiempoResolucion = `${hours}h ${minutes}m`;
    }

    const payload: NotificacionPayload = {
      channel: 'email',
      recipient: { email: this.adminEmail },
      subject: `✅ Ticket crítico #${shortId} resuelto`,
      body: {
        email: `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background: #16a34a; padding: 20px 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 18px;">✅ Ticket crítico resuelto</h1>
  </div>
  <div style="padding: 24px;">
    <p style="color: #333; font-size: 15px; margin: 0 0 16px;">Un ticket crítico ha sido resuelto y cerrado.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 10px 12px; background: #f0fdf4; border-radius: 6px 0 0 6px; font-weight: bold; color: #555; font-size: 13px;">Ticket</td>
        <td style="padding: 10px 12px; background: #f0fdf4; border-radius: 0 6px 6px 0; color: #16a34a; font-size: 13px;">#${shortId}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Asunto</td>
        <td style="padding: 10px 12px; color: #333; font-size: 13px;">${asunto}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; background: #f0fdf4; font-weight: bold; color: #555; font-size: 13px;">Resolución</td>
        <td style="padding: 10px 12px; background: #f0fdf4; color: #333; font-size: 13px;">${resolucion}</td>
      </tr>
      ${
        agenteId
          ? `<tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #555; font-size: 13px;">Agente</td>
        <td style="padding: 10px 12px; color: #333; font-size: 13px;">${agenteId}</td>
      </tr>`
          : ''
      }
      <tr>
        <td style="padding: 10px 12px; background: #f0fdf4; font-weight: bold; color: #555; font-size: 13px;">Tiempo de resolución</td>
        <td style="padding: 10px 12px; background: #f0fdf4; color: #16a34a; font-size: 13px; font-weight: bold;">${tiempoResolucion}</td>
      </tr>
    </table>
    <a href="${url}" style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: 8px;">Ver detalle</a>
  </div>
</div>`,
      },
    };
    return this.enviar(payload);
  }
}
