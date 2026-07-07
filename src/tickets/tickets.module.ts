import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from './entities/ticket.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { IncidentesModule } from '../incidentes/incidentes.module';
import { ClientesModule } from '../clientes/clientes.module';
import { InteraccionesModule } from '../interacciones/interacciones.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketEntity]),
    forwardRef(() => AnalyticsModule),
    forwardRef(() => IncidentesModule),
    ClientesModule,
    InteraccionesModule,
    NotificacionesModule,
  ],
  providers: [TicketsService],
  controllers: [TicketsController],
  exports: [TicketsService],
})
export class TicketsModule {}
