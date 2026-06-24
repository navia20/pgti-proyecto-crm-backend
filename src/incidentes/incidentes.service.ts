import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TicketDto } from '../tickets/dtos/ticket.dto';

@Injectable()
export class IncidentesService {
  private readonly logger = new Logger(IncidentesService.name);
  private readonly incidentesUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.incidentesUrl =
      this.configService.get<string>('INCIDENTES_SERVICE_URL') || '';
    this.apiKey = this.configService.get<string>('INCIDENTES_API_KEY') || '';
  }

  async enviarAlerta(ticket: TicketDto): Promise<void> {
    if (!this.incidentesUrl) {
      this.logger.warn('INCIDENTES_SERVICE_URL no configurada, saltando envío');
      return;
    }

    const body = {
      sistema_id: 'P07',
      creado_en: new Date().toISOString(),
      payload: {
        id: ticket.id,
        asunto: ticket.asunto,
        estado: ticket.estado,
        prioridad: ticket.prioridad,
        canal: ticket.canal,
        cliente_id: ticket.cliente_id ?? null,
        agente_id: ticket.agente_id ?? null,
        fecha_vencimiento_sla: ticket.fecha_vencimiento_sla.toISOString(),
        pedido_id_ref: ticket.pedido_id_ref ?? null,
        suscripcion_id_ref: ticket.suscripcion_id_ref ?? null,
        creado_en: ticket.creado_en.toISOString(),
        actualizado_en: ticket.actualizado_en.toISOString(),
      },
    };

    try {
      await firstValueFrom(
        this.httpService.post(`${this.incidentesUrl}/api/v1/alertas`, body, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          timeout: 5000,
        }),
      );
      this.logger.log(`Alerta de incidente enviada: ticket ${ticket.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Error enviando alerta de incidente ${ticket.id}: ${message}`,
      );
    }
  }
}
