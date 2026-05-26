import { Controller, Get, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';

@Controller('api/v1/reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get()
  async obtenerReporteGeneral(@Query('dias') dias?: string) {
    return this.reportesService.obtenerReporteGeneral(dias ? Number(dias) : 30);
  }

  @Get('metricas/tickets')
  async metricsTickets() {
    return this.reportesService.obtenerMetricasTickets();
  }

  @Get('metricas/prioridad')
  async metricsPriority() {
    return this.reportesService.obtenerMetricasPrioridad();
  }

  @Get('metricas/sla')
  async metricsSLA() {
    return this.reportesService.obtenerMetricasSLA();
  }

  @Get('metricas/kb')
  async metricsKB() {
    return this.reportesService.obtenerMetricasKB();
  }

  @Get('metricas/interacciones')
  async metricsInteractions(@Query('dias') dias?: string) {
    return this.reportesService.obtenerMetricasInteracciones(dias ? Number(dias) : 30);
  }
}
