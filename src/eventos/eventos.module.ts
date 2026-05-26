import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoInternoEntity } from './entities/evento-interno.entity';
import { EventosService } from './eventos.service';
import { EventosController } from './eventos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventoInternoEntity])],
  providers: [EventosService],
  controllers: [EventosController],
  exports: [EventosService],
})
export class EventosModule {}
