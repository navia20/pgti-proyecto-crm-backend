import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketArticuloEntity } from './entities/ticket-articulo.entity';
import { TicketArticulosService } from './ticket-articulos.service';
import { TicketArticulosController } from './ticket-articulos.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ArticulosKbModule } from '../articulos-kb/articulos-kb.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketArticuloEntity]),
    AnalyticsModule,
    ArticulosKbModule,
  ],
  providers: [TicketArticulosService],
  controllers: [TicketArticulosController],
  exports: [TicketArticulosService],
})
export class TicketArticulosModule {}
