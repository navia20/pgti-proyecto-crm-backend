import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketSolicitudEntity } from './entities/ticket-solicitud.entity';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { TicketsModule } from '../tickets/tickets.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ClientesModule } from '../clientes/clientes.module';
import { InteraccionesModule } from '../interacciones/interacciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketSolicitudEntity]),
    TicketsModule,
    NotificacionesModule,
    ClientesModule,
    InteraccionesModule,
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
