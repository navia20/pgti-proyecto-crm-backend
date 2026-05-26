import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { UpdateTicketDto } from './dtos/update-ticket.dto';

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  async findAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
    @Query('estado') estado?: string,
    @Query('prioridad') prioridad?: string,
    @Query('cliente_id') cliente_id?: number,
  ) {
    return this.ticketsService.findAll(skip, take, estado, prioridad, cliente_id);
  }

  @Get('client/:clienteId')
  async findByClientId(@Param('clienteId') clienteId: number) {
    return this.ticketsService.findByClientId(clienteId);
  }

  @Get('sla-status')
  async getTicketsBySlaStatus() {
    return this.ticketsService.getTicketsBySlaStatus();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ticketsService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.ticketsService.delete(id);
  }
}
