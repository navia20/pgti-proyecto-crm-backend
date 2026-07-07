import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { InteraccionesService } from './interacciones.service';
import { CreateInteraccionDto } from './dtos/create-interaccion.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1/interacciones')
export class InteraccionesController {
  constructor(private readonly interaccionesService: InteraccionesService) {}

  @Post()
  async create(@Body() createInteraccionDto: CreateInteraccionDto) {
    return this.interaccionesService.create(createInteraccionDto);
  }

  @Get('ticket/:ticketId')
  async findByTicketId(@Param('ticketId') ticketId: string) {
    return this.interaccionesService.findByTicketId(ticketId);
  }

  @Public()
  @Get('ticket/:ticketId/public')
  async findByTicketIdPublic(@Param('ticketId') ticketId: string) {
    return this.interaccionesService.findByTicketIdExcludingInternal(ticketId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.interaccionesService.findById(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.interaccionesService.delete(id);
  }
}
