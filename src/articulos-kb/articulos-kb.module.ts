import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticuloKbEntity } from './entities/articulo-kb.entity';
import { ArticulosKbService } from './articulos-kb.service';
import { ArticulosKbController } from './articulos-kb.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArticuloKbEntity])],
  providers: [ArticulosKbService],
  controllers: [ArticulosKbController],
  exports: [ArticulosKbService],
})
export class ArticulosKbModule {}
