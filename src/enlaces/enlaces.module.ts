import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEnlaceEntity } from '../tickets/entities/ticket-enlace.entity';
import { EnlacesService } from './enlaces.service';
import { EnlacesController } from './enlaces.controller';
import { InteraccionesModule } from '../interacciones/interacciones.module';
import { TicketsModule } from '../tickets/tickets.module';
import { ClientesModule } from '../clientes/clientes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketEnlaceEntity]),
    InteraccionesModule,
    TicketsModule,
    ClientesModule,
  ],
  providers: [EnlacesService],
  controllers: [EnlacesController],
  exports: [EnlacesService],
})
export class EnlacesModule {}
