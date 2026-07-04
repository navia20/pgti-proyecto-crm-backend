import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { CreateTicketExternoDto } from './dtos/create-ticket-externo.dto';
import { UpdateTicketDto } from './dtos/update-ticket.dto';

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly configService: ConfigService,
  ) {}

  private getApiKey(sistema: string): string {
    return (
      this.configService.get<string>(`${sistema.toUpperCase()}_API_KEY`) || ''
    );
  }

  @Post()
  async create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Post('externo')
  @HttpCode(201)
  async createExterno(
    @Body() dto: CreateTicketExternoDto,
    @Headers('x-api-key') apiKey: string,
  ) {
    const expectedKey = this.getApiKey(dto.sistema_origen);
    if (!expectedKey || apiKey !== expectedKey) {
      return { ok: false, message: 'API key inválida para este sistema' };
    }
    const ticket = await this.ticketsService.createExterno(dto);
    return { ok: true, ticket };
  }

  @Get()
  async findAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
    @Query('estado') estado?: string,
    @Query('prioridad') prioridad?: string,
    @Query('cliente_id') cliente_id?: number,
    @Query('canal') canal?: string,
    @Query('search') search?: string,
    @Query('referencia') referencia?: string,
    @Query('ordenar') ordenar?: string,
    @Query('direccion') direccion?: string,
  ) {
    return this.ticketsService.findAll(
      skip,
      take,
      estado,
      prioridad,
      cliente_id,
      canal,
      search,
      referencia,
      ordenar,
      direccion,
    );
  }

  @Get('client/:clienteId')
  async findByClientId(@Param('clienteId') clienteId: number) {
    return this.ticketsService.findByClientId(clienteId);
  }

  @Get('sla-status')
  async getTicketsBySlaStatus() {
    return this.ticketsService.getTicketsBySlaStatus();
  }

  @Get('externo/:id')
  async findExterno(
    @Param('id') id: string,
    @Query('api_key') apiKey: string,
  ) {
    if (!apiKey) {
      return { ok: false, message: 'api_key es requerida' };
    }

    const validKeys = [
      this.getApiKey('pedidos'),
      this.getApiKey('suscripciones'),
      this.getApiKey('salud'),
    ];

    if (!validKeys.includes(apiKey)) {
      return { ok: false, message: 'API key inválida' };
    }

    try {
      const ticket = await this.ticketsService.findById(id);
      return {
        ok: true,
        ticket: {
          id: ticket.id,
          asunto: ticket.asunto,
          estado: ticket.estado,
          prioridad: ticket.prioridad,
          canal: ticket.canal,
          cliente_nombre: ticket.cliente_nombre,
          fecha_vencimiento_sla: ticket.fecha_vencimiento_sla,
          creado_en: ticket.creado_en,
          actualizado_en: ticket.actualizado_en,
        },
      };
    } catch {
      return { ok: false, message: 'Ticket no encontrado' };
    }
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
