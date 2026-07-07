import { Controller, Get, Param, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketsService } from '../tickets/tickets.service';

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly configService: ConfigService,
  ) {}

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
