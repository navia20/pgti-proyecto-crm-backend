import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoSalienteEntity } from './entities/evento-saliente.entity';
import { EventosSalientesService } from './eventos-salientes.service';
import { EventosSalientesController } from './eventos-salientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventoSalienteEntity])],
  providers: [EventosSalientesService],
  controllers: [EventosSalientesController],
  exports: [EventosSalientesService],
})
export class EventosSalientesModule {}
