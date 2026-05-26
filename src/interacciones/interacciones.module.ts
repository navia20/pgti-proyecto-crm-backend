import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteraccionEntity } from './entities/interaccion.entity';
import { InteraccionesService } from './interacciones.service';
import { InteraccionesController } from './interacciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InteraccionEntity])],
  providers: [InteraccionesService],
  controllers: [InteraccionesController],
  exports: [InteraccionesService],
})
export class InteraccionesModule {}
