import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteraccionEntity } from './entities/interaccion.entity';
import { InteraccionesService } from './interacciones.service';
import { InteraccionesController } from './interacciones.controller';
import { TicketEntity } from '../tickets/entities/ticket.entity';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ClientesModule } from '../clientes/clientes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InteraccionEntity, TicketEntity]),
    NotificacionesModule,
    ClientesModule,
  ],
  providers: [InteraccionesService],
  controllers: [InteraccionesController],
  exports: [InteraccionesService],
})
export class InteraccionesModule {}
