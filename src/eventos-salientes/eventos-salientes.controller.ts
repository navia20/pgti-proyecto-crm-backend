import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { EventosSalientesService } from './eventos-salientes.service';
import { CreateEventoSalienteDto } from './dtos/evento-saliente.dto';

@Controller('api/v1/eventos-salientes')
export class EventosSalientesController {
  constructor(private readonly eventosSalientesService: EventosSalientesService) {}

  @Post()
  async create(@Body() createEventoDto: CreateEventoSalienteDto) {
    return this.eventosSalientesService.registrar(createEventoDto);
  }

  @Get()
  async findAll(@Query('estado') estado?: string) {
    return this.eventosSalientesService.findAll(estado);
  }

  @Get('pendientes')
  async findPending() {
    return this.eventosSalientesService.obtenerEventosPendientes();
  }

  @Post(':id/enviado')
  async markSent(@Param('id') id: string) {
    return this.eventosSalientesService.marcarEnviado(id);
  }

  @Post(':id/fallo')
  async markFailed(@Param('id') id: string, @Body() body: { error: string; segundos_reintentar?: number }) {
    return this.eventosSalientesService.marcarFallo(id, body.error, body.segundos_reintentar || 3600);
  }

  @Post(':id/cancelar')
  async markCanceled(@Param('id') id: string) {
    return this.eventosSalientesService.marcarCancelado(id);
  }
}
