import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketsService } from '../tickets/tickets.service';
import { AnalyticsService } from './analytics.service';

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(
    @Inject(forwardRef(() => TicketsService))
    private readonly ticketsService: TicketsService,
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('event')
  async recibirEvento(
    @Body() body: { event_type: string; payload: object },
    @Headers('x-api-key') headerKey: string,
    @Query('api_key') queryKey: string,
  ) {
    const apiKey = headerKey || queryKey;
    if (!apiKey) {
      return { ok: false, message: 'api_key es requerida' };
    }

    const expectedKey = this.configService.get<string>('ANALYTICS_API_KEY');
    if (!expectedKey || apiKey !== expectedKey) {
      return { ok: false, message: 'API key inválida' };
    }

    if (!body.event_type || !body.payload) {
      return { ok: false, message: 'event_type y payload son requeridos' };
    }

    await this.analyticsService.emit(body.event_type, body.payload);
    return { ok: true, message: 'Evento recibido y enviado a analítica' };
  }

  @Get('estado-ticket/:id')
  async obtenerEstadoTicket(
    @Param('id') id: string,
    @Query('api_key') apiKey: string,
  ) {
    if (!apiKey) {
      return { ok: false, message: 'api_key es requerida' };
    }

    const expectedKey = this.configService.get<string>('ANALYTICS_API_KEY');
    if (!expectedKey || apiKey !== expectedKey) {
      return { ok: false, message: 'API key inválida' };
    }

    try {
      const estado = await this.ticketsService.obtenerEstadoTicket(id);
      if (!estado) {
        return { ok: false, message: 'Ticket no encontrado' };
      }
      return { ok: true, ticket: estado };
    } catch {
      return { ok: false, message: 'Ticket no encontrado' };
    }
  }
}
