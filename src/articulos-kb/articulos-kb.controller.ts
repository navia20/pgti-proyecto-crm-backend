import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ArticulosKbService } from './articulos-kb.service';
import { CreateArticuloKbDto } from './dtos/create-articulo-kb.dto';
import { UpdateArticuloKbDto } from './dtos/update-articulo-kb.dto';

@Controller('api/v1/articulos-kb')
export class ArticulosKbController {
  constructor(private readonly articulosKbService: ArticulosKbService) {}

  @Post()
  async create(@Body() createArticuloKbDto: CreateArticuloKbDto) {
    return this.articulosKbService.create(createArticuloKbDto);
  }

  @Get()
  async findAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
    @Query('categoria') categoria?: string,
    @Query('search') search?: string,
  ) {
    return this.articulosKbService.findAll(skip, take, categoria, search);
  }

  @Get('categoria/:categoria')
  async searchByCategory(@Param('categoria') categoria: string) {
    return this.articulosKbService.searchByCategory(categoria);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.articulosKbService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateArticuloKbDto: UpdateArticuloKbDto,
  ) {
    return this.articulosKbService.update(id, updateArticuloKbDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.articulosKbService.delete(id);
  }
}
