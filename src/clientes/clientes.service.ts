import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteEntity } from './entities/cliente.entity';
import { CreateClienteDto } from './dtos/create-cliente.dto';
import { UpdateClienteDto } from './dtos/update-cliente.dto';
import { ClienteDto } from './dtos/cliente.dto';
import { CompareClientesDto } from './dtos/compare-clientes.dto';
import { MergeClientesDto } from './dtos/merge-clientes.dto';
import {
  DuplicateGroupDto,
  DuplicateMatchDto,
} from './dtos/duplicate-group.dto';

const MERGEABLE_FIELDS = [
  'nombre_completo',
  'email',
  'telefono',
  'documento_identidad',
  'empresa',
  'direccion',
  'ciudad',
  'pais',
  'fecha_ultima_compra',
  'total_gastado',
  'pedidos_totales',
] as const;

type MergeableField = (typeof MERGEABLE_FIELDS)[number];

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(ClienteEntity)
    private readonly clientesRepository: Repository<ClienteEntity>,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<ClienteDto> {
    const cliente = this.clientesRepository.create({
      ...createClienteDto,
      fecha_ultima_compra: createClienteDto.fecha_ultima_compra
        ? new Date(createClienteDto.fecha_ultima_compra)
        : undefined,
      total_gastado: createClienteDto.total_gastado ?? 0,
      pedidos_totales: createClienteDto.pedidos_totales ?? 0,
      activo: createClienteDto.activo ?? true,
    });

    const savedCliente = await this.clientesRepository.save(cliente);
    return this.mapToDto(savedCliente);
  }

  async findAll(): Promise<ClienteDto[]> {
    const clientes = await this.clientesRepository.find({
      order: { creado_en: 'DESC' },
    });

    return clientes.map((cliente) => this.mapToDto(cliente));
  }

  async findOne(id: number): Promise<ClienteDto> {
    const cliente = await this.clientesRepository.findOne({ where: { id } });

    if (!cliente) {
      throw new NotFoundException(`Cliente ${id} no encontrado`);
    }

    return this.mapToDto(cliente);
  }

  async update(
    id: number,
    updateClienteDto: UpdateClienteDto,
  ): Promise<ClienteDto> {
    const cliente = await this.clientesRepository.findOne({ where: { id } });

    if (!cliente) {
      throw new NotFoundException(`Cliente ${id} no encontrado`);
    }

    Object.assign(cliente, {
      ...updateClienteDto,
      fecha_ultima_compra: updateClienteDto.fecha_ultima_compra
        ? new Date(updateClienteDto.fecha_ultima_compra)
        : cliente.fecha_ultima_compra,
    });

    const updatedCliente = await this.clientesRepository.save(cliente);
    return this.mapToDto(updatedCliente);
  }

  async remove(id: number): Promise<void> {
    const result = await this.clientesRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Cliente ${id} no encontrado`);
    }
  }

  async compareClients(
    compareClientesDto: CompareClientesDto,
  ): Promise<DuplicateMatchDto> {
    const clienteA = await this.getClientOrFail(
      compareClientesDto.cliente_a_id,
    );
    const clienteB = await this.getClientOrFail(
      compareClientesDto.cliente_b_id,
    );

    return this.buildDuplicateMatch(clienteA, clienteB);
  }

  async findPotentialDuplicates(threshold = 80): Promise<DuplicateGroupDto[]> {
    const clientes = await this.clientesRepository.find({
      where: { activo: true },
      order: { creado_en: 'DESC' },
    });

    const groups: DuplicateGroupDto[] = [];

    for (let index = 0; index < clientes.length; index += 1) {
      for (
        let compareIndex = index + 1;
        compareIndex < clientes.length;
        compareIndex += 1
      ) {
        const match = this.buildDuplicateMatch(
          clientes[index],
          clientes[compareIndex],
        );

        if (match.similarity_score >= threshold) {
          groups.push({
            id: `dup-${clientes[index].id}-${clientes[compareIndex].id}`,
            similarity_score: match.similarity_score,
            matched_fields: match.matched_fields,
            records: [match.cliente_a, match.cliente_b],
          });
        }
      }
    }

    return groups.sort((a, b) => b.similarity_score - a.similarity_score);
  }

  async mergeClients(mergeClientesDto: MergeClientesDto): Promise<ClienteDto> {
    if (
      mergeClientesDto.cliente_principal_id ===
      mergeClientesDto.cliente_secundario_id
    ) {
      throw new BadRequestException(
        'Los clientes a fusionar deben ser distintos',
      );
    }

    const principal = await this.getClientOrFail(
      mergeClientesDto.cliente_principal_id,
    );
    const secundario = await this.getClientOrFail(
      mergeClientesDto.cliente_secundario_id,
    );

    const fieldsToKeep = new Set<MergeableField>(
      (mergeClientesDto.campos_a_conservar ?? []) as MergeableField[],
    );

    const principalRecord = principal as unknown as Record<string, unknown>;
    const secondaryRecord = secundario as unknown as Record<string, unknown>;

    for (const field of MERGEABLE_FIELDS) {
      if (fieldsToKeep.has(field)) {
        principalRecord[field] = secondaryRecord[field];
      }
    }

    principal.activo = true;
    principal.es_duplicado = false;

    const savedPrincipal = await this.clientesRepository.save(principal);

    secundario.activo = false;
    secundario.es_duplicado = true;
    secundario.fusionado_en_id = savedPrincipal.id;
    secundario.fusionado_en = new Date();
    await this.clientesRepository.save(secundario);

    return this.mapToDto(savedPrincipal);
  }

  private async getClientOrFail(id: number): Promise<ClienteEntity> {
    const cliente = await this.clientesRepository.findOne({ where: { id } });

    if (!cliente) {
      throw new NotFoundException(`Cliente ${id} no encontrado`);
    }

    return cliente;
  }

  private buildDuplicateMatch(
    clienteA: ClienteEntity,
    clienteB: ClienteEntity,
  ): DuplicateMatchDto {
    const matchedFields: string[] = [];
    let score = 0;

    const emailA = this.normalizeEmail(clienteA.email);
    const emailB = this.normalizeEmail(clienteB.email);
    if (emailA && emailA === emailB) {
      score += 35;
      matchedFields.push('email');
    }

    const phoneA = this.normalizePhone(clienteA.telefono);
    const phoneB = this.normalizePhone(clienteB.telefono);
    if (phoneA && phoneA === phoneB) {
      score += 25;
      matchedFields.push('telefono');
    }

    const documentA = this.normalizeDocument(clienteA.documento_identidad);
    const documentB = this.normalizeDocument(clienteB.documento_identidad);
    if (documentA && documentA === documentB) {
      score += 20;
      matchedFields.push('documento_identidad');
    }

    const nameSimilarity = this.stringSimilarity(
      clienteA.nombre_completo,
      clienteB.nombre_completo,
    );
    if (nameSimilarity >= 0.6) {
      score += Math.round(nameSimilarity * 10);
      matchedFields.push('nombre_completo');
    }

    const companySimilarity = this.stringSimilarity(
      clienteA.empresa,
      clienteB.empresa,
    );
    if (companySimilarity >= 0.6) {
      score += Math.round(companySimilarity * 5);
      matchedFields.push('empresa');
    }

    const addressSimilarity = this.stringSimilarity(
      clienteA.direccion,
      clienteB.direccion,
    );
    if (addressSimilarity >= 0.6) {
      score += Math.round(addressSimilarity * 5);
      matchedFields.push('direccion');
    }

    const cityA = this.normalizeText(clienteA.ciudad);
    const cityB = this.normalizeText(clienteB.ciudad);
    if (cityA && cityA === cityB) {
      score += 3;
      matchedFields.push('ciudad');
    }

    const countryA = this.normalizeText(clienteA.pais);
    const countryB = this.normalizeText(clienteB.pais);
    if (countryA && countryA === countryB) {
      score += 2;
      matchedFields.push('pais');
    }

    return {
      cliente_a: this.mapToDto(clienteA),
      cliente_b: this.mapToDto(clienteB),
      similarity_score: Math.min(100, score),
      matched_fields: [...new Set(matchedFields)],
    };
  }

  private stringSimilarity(
    valueA?: string | null,
    valueB?: string | null,
  ): number {
    const normalizedA = this.normalizeText(valueA);
    const normalizedB = this.normalizeText(valueB);

    if (!normalizedA || !normalizedB) {
      return 0;
    }

    if (normalizedA === normalizedB) {
      return 1;
    }

    const tokensA = new Set(normalizedA.split(' ').filter(Boolean));
    const tokensB = new Set(normalizedB.split(' ').filter(Boolean));

    if (tokensA.size === 0 || tokensB.size === 0) {
      return 0;
    }

    let sharedTokens = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) {
        sharedTokens += 1;
      }
    }

    const tokenScore = sharedTokens / Math.max(tokensA.size, tokensB.size);
    const containsScore =
      normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)
        ? 0.85
        : 0;

    return Math.max(tokenScore, containsScore);
  }

  private normalizeText(value?: string | null): string {
    return (value ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeEmail(value?: string | null): string {
    return (value ?? '').trim().toLowerCase();
  }

  private normalizePhone(value?: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  private normalizeDocument(value?: string | null): string {
    return this.normalizeText(value).replace(/\s+/g, '');
  }

  private mapToDto(cliente: ClienteEntity): ClienteDto {
    return {
      id: cliente.id,
      nombre_completo: cliente.nombre_completo,
      email: cliente.email,
      telefono: cliente.telefono,
      documento_identidad: cliente.documento_identidad,
      empresa: cliente.empresa,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      pais: cliente.pais,
      fecha_ultima_compra: cliente.fecha_ultima_compra,
      total_gastado: Number(cliente.total_gastado ?? 0),
      pedidos_totales: Number(cliente.pedidos_totales ?? 0),
      activo: cliente.activo,
      es_duplicado: cliente.es_duplicado,
      fusionado_en_id: cliente.fusionado_en_id,
      fusionado_en: cliente.fusionado_en,
      creado_en: cliente.creado_en,
      actualizado_en: cliente.actualizado_en,
    };
  }
}
