import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TicketArticulosService } from './ticket-articulos.service';
import { CreateTicketArticuloDto } from './dtos/create-ticket-articulo.dto';

@Controller('api/v1/ticket-articulos')
export class TicketArticulosController {
  constructor(private readonly ticketArticulosService: TicketArticulosService) {}

  @Post()
  async create(@Body() createTicketArticuloDto: CreateTicketArticuloDto) {
    return this.ticketArticulosService.create(createTicketArticuloDto);
  }

  @Get('ticket/:ticketId')
  async findByTicketId(@Param('ticketId') ticketId: string) {
    return this.ticketArticulosService.findByTicketId(ticketId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ticketArticulosService.findById(id);
  }

  @Put(':id/send-to-client')
  async markAsSentToClient(@Param('id') id: string) {
    return this.ticketArticulosService.markAsSentToClient(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.ticketArticulosService.delete(id);
  }
}
