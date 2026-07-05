import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEnlaceEntity } from '../tickets/entities/ticket-enlace.entity';
import { NotificacionesService } from './notificaciones.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([TicketEnlaceEntity])],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
