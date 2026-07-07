import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IncidentesService } from './incidentes.service';
import { IncidentesController } from './incidentes.controller';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [HttpModule, forwardRef(() => TicketsModule)],
  providers: [IncidentesService],
  controllers: [IncidentesController],
  exports: [IncidentesService],
})
export class IncidentesModule {}
