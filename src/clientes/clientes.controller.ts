import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dtos/create-cliente.dto';
import { UpdateClienteDto } from './dtos/update-cliente.dto';
import { CompareClientesDto } from './dtos/compare-clientes.dto';
import { MergeClientesDto } from './dtos/merge-clientes.dto';

@Controller('api/v1/clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  async create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  async findAll() {
    return this.clientesService.findAll();
  }

  @Get('duplicados')
  async findPotentialDuplicates(@Query('threshold') threshold?: string) {
    return this.clientesService.findPotentialDuplicates(
      threshold ? Number(threshold) : 80,
    );
  }

  @Post('duplicados/compare')
  async compareClients(@Body() compareClientesDto: CompareClientesDto) {
    return this.clientesService.compareClients(compareClientesDto);
  }

  @Post('duplicados/merge')
  async mergeClients(@Body() mergeClientesDto: MergeClientesDto) {
    return this.clientesService.mergeClients(mergeClientesDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(id);
  }
}