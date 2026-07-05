import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [HttpModule, TicketsModule],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
