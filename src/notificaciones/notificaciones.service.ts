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
}
