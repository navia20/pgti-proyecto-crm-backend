import { Controller, Get, Post, Param, Body, HttpCode } from '@nestjs/common';
import { EnlacesService } from './enlaces.service';
import { CrearEnlaceDto } from './dtos/crear-enlace.dto';
import { ResponderEnlaceDto } from './dtos/responder-enlace.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1')
export class EnlacesController {
  constructor(private readonly enlacesService: EnlacesService) {}

  @Post('tickets/:id/enlace')
  @HttpCode(201)
  async crear(@Param('id') ticketId: string, @Body() body: CrearEnlaceDto) {
    return this.enlacesService.crear(ticketId, body);
  }

  @Public()
  @Get('enlace/:token')
  async obtenerPorToken(@Param('token') token: string) {
    return this.enlacesService.obtenerPorToken(token);
  }

  @Public()
  @Post('enlace/:token/interacciones')
  @HttpCode(201)
  async responder(
    @Param('token') token: string,
    @Body() dto: ResponderEnlaceDto,
  ) {
    return this.enlacesService.responder(token, dto);
  }
}
