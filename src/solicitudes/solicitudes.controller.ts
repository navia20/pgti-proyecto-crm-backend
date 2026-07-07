import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SolicitudesService } from './solicitudes.service';
import { CrearSolicitudDto } from './dtos/crear-solicitud.dto';
import {
  AprobarSolicitudDto,
  RechazarSolicitudDto,
} from './dtos/aprobar-solicitud.dto';

@Controller('api/v1/solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearSolicitudDto) {
    const solicitud = await this.solicitudesService.crear(dto);
    return {
      ok: true,
      mensaje: 'Solicitud enviada. Recibirás un correo cuando sea revisada.',
      id: solicitud.id,
    };
  }

  @Get()
  async findAll(@Query('estado') estado?: string) {
    const solicitudes = await this.solicitudesService.findAll(estado);
    return { data: solicitudes, total: solicitudes.length };
  }

  @Get('pendientes/count')
  async contarPendientes() {
    const total = await this.solicitudesService.contarPendientes();
    return { total };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.solicitudesService.findOne(id);
  }

  @Put(':id/aprobar')
  async aprobar(@Param('id') id: string, @Body() dto: AprobarSolicitudDto) {
    return this.solicitudesService.aprobar(id, dto);
  }

  @Put(':id/rechazar')
  async rechazar(@Param('id') id: string, @Body() dto: RechazarSolicitudDto) {
    return this.solicitudesService.rechazar(id, dto);
  }
}
