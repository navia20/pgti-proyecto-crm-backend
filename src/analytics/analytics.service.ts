import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

const ESTADO_MAP: Record<string, string> = {
  abierto: 'Abierto',
  progreso: 'Progreso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

const PRIORIDAD_MAP: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

const CANAL_MAP: Record<string, string> = {
  chat: 'Chat',
  email: 'Email',
  telefono: 'Teléfono',
  app: 'App',
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly analyticsUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const baseUrl =
      this.configService.get<string>('ANALYTICS_SERVICE_URL') || '';
    this.analyticsUrl = baseUrl ? `${baseUrl}/v1/events` : '';
  }

  async emit(eventType: string, payload: object): Promise<void> {
    if (!this.analyticsUrl) {
      this.logger.warn(
        `Analytics deshabilitado: ANALYTICS_SERVICE_URL no configurado, evento ignorado: ${eventType}`,
      );
      return;
    }

    const event = {
      source: 'crm' as const,
      event_type: eventType,
      payload,
    };

    try {
      await firstValueFrom(this.httpService.post(this.analyticsUrl, event));
      this.logger.log(`Evento analytics enviado: ${eventType}`);
    } catch (error) {
      this.logger.error(
        `Error al enviar evento analytics: ${eventType}`,
        error,
      );
    }
  }

  mapEstado(estado: string): string {
    return ESTADO_MAP[estado] || estado;
  }

  mapPrioridad(prioridad: string): string {
    return PRIORIDAD_MAP[prioridad] || prioridad;
  }

  mapCanal(canal: string): string {
    return CANAL_MAP[canal] || canal;
  }
}
