import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { CreateEventoInternoDto } from './dtos/evento-interno.dto';

@Controller('api/v1/eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Post()
  async create(@Body() createEventoDto: CreateEventoInternoDto) {
    return this.eventosService.registrar(createEventoDto);
  }

  @Get()
  async findAll(@Query('estado') estado?: string) {
    return this.eventosService.findAll(estado);
  }

  @Get('pendientes')
  async findPending() {
    return this.eventosService.findPending();
  }

  @Post(':id/procesar')
  async markProcessed(@Param('id') id: string) {
    return this.eventosService.marcarProcesado(id);
  }

  @Post(':id/error')
  async markError(@Param('id') id: string, @Body() body: { error: string }) {
    return this.eventosService.marcarError(id, body.error);
  }
}
