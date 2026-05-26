import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from '../tickets/entities/ticket.entity';
import { InteraccionEntity } from '../interacciones/entities/interaccion.entity';
import { ArticuloKbEntity } from '../articulos-kb/entities/articulo-kb.entity';
import { TicketArticuloEntity } from '../ticket-articulos/entities/ticket-articulo.entity';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketEntity, InteraccionEntity, ArticuloKbEntity, TicketArticuloEntity]),
  ],
  providers: [ReportesService],
  controllers: [ReportesController],
  exports: [ReportesService],
})
export class ReportesModule {}
