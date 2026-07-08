import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ClientesModule } from './clientes/clientes.module';
import { TicketsModule } from './tickets/tickets.module';
import { InteraccionesModule } from './interacciones/interacciones.module';
import { ArticulosKbModule } from './articulos-kb/articulos-kb.module';
import { TicketArticulosModule } from './ticket-articulos/ticket-articulos.module';
import { EventosModule } from './eventos/eventos.module';
import { ReportesModule } from './reportes/reportes.module';
import { EventosSalientesModule } from './eventos-salientes/eventos-salientes.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { IncidentesModule } from './incidentes/incidentes.module';
import { EnlacesModule } from './enlaces/enlaces.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: +(configService.get<number>('DB_PORT') ?? 5432),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        ssl: false,

        extra: {
          max: 1,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),
    AuthModule,
    ClientesModule,
    TicketsModule,
    InteraccionesModule,
    ArticulosKbModule,
    TicketArticulosModule,
    EventosModule,
    ReportesModule,
    EventosSalientesModule,
    AnalyticsModule,
    IncidentesModule,
    EnlacesModule,
    NotificacionesModule,
    SolicitudesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
