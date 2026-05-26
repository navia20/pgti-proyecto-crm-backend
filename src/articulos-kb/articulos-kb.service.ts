import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticuloKbEntity } from './entities/articulo-kb.entity';
import { CreateArticuloKbDto } from './dtos/create-articulo-kb.dto';
import { UpdateArticuloKbDto } from './dtos/update-articulo-kb.dto';
import { ArticuloKbDto } from './dtos/articulo-kb.dto';

@Injectable()
export class ArticulosKbService {
  constructor(
    @InjectRepository(ArticuloKbEntity)
    private articuloRepository: Repository<ArticuloKbEntity>,
  ) {}

  async create(
    createArticuloKbDto: CreateArticuloKbDto,
  ): Promise<ArticuloKbDto> {
    const articulo = this.articuloRepository.create(createArticuloKbDto);
    const savedArticulo = await this.articuloRepository.save(articulo);
    return this.mapToDto(savedArticulo);
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    categoria?: string,
    search?: string,
  ): Promise<{ data: ArticuloKbDto[]; total: number }> {
    const query = this.articuloRepository.createQueryBuilder('articulo');

    if (categoria) {
      query.andWhere('articulo.categoria = :categoria', { categoria });
    }

    if (search) {
      query.andWhere(
        '(articulo.titulo ILIKE :search OR articulo.contenido ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [articulos, total] = await query
      .orderBy('articulo.creado_en', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data: articulos.map((a) => this.mapToDto(a)),
      total,
    };
  }

  async findById(id: string): Promise<ArticuloKbDto> {
    const articulo = await this.articuloRepository.findOne({ where: { id } });

    if (!articulo) {
      throw new NotFoundException(`Artículo ${id} no encontrado`);
    }

    return this.mapToDto(articulo);
  }

  async searchByCategory(categoria: string): Promise<ArticuloKbDto[]> {
    const articulos = await this.articuloRepository.find({
      where: { categoria },
      order: { creado_en: 'DESC' },
    });

    return articulos.map((a) => this.mapToDto(a));
  }

  async searchByKeywords(keywords: string[]): Promise<ArticuloKbDto[]> {
    const articulos = await this.articuloRepository
      .createQueryBuilder('articulo')
      .where(
        keywords
          .map((_, index) => `articulo.titulo ILIKE :keyword${index}`)
          .join(' OR '),
        keywords.reduce((acc, keyword, index) => {
          acc[`keyword${index}`] = `%${keyword}%`;
          return acc;
        }, {}),
      )
      .orderBy('articulo.creado_en', 'DESC')
      .getMany();

    return articulos.map((a) => this.mapToDto(a));
  }

  async update(
    id: string,
    updateArticuloKbDto: UpdateArticuloKbDto,
  ): Promise<ArticuloKbDto> {
    const articulo = await this.articuloRepository.findOne({ where: { id } });

    if (!articulo) {
      throw new NotFoundException(`Artículo ${id} no encontrado`);
    }

    Object.assign(articulo, updateArticuloKbDto);
    const updatedArticulo = await this.articuloRepository.save(articulo);

    return this.mapToDto(updatedArticulo);
  }

  async delete(id: string): Promise<void> {
    const result = await this.articuloRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Artículo ${id} no encontrado`);
    }
  }

  private mapToDto(articulo: ArticuloKbEntity): ArticuloKbDto {
    return {
      id: articulo.id,
      titulo: articulo.titulo,
      contenido: articulo.contenido,
      categoria: articulo.categoria,
      creado_en: articulo.creado_en,
      actualizado_en: articulo.actualizado_en,
    };
  }
}
