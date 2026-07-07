import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClienteEntity } from './entities/cliente.entity';

// Base de cliente para clonar en cada test. Campos tomados de la entity real.
const baseCliente: ClienteEntity = {
  id: 1,
  nombre_completo: 'Juan Pérez',
  email: 'juan@example.com',
  telefono: '+56912345678',
  documento_identidad: '12345678-9',
  empresa: 'Acme',
  direccion: 'Calle Falsa 123',
  ciudad: 'Coquimbo',
  pais: 'Chile',
  fecha_ultima_compra: new Date('2026-01-01T00:00:00Z'),
  total_gastado: 1000,
  pedidos_totales: 5,
  activo: true,
  es_duplicado: false,
  fusionado_en_id: undefined as any,
  fusionado_en: undefined as any,
  eliminado_en: undefined as any,
  creado_en: new Date('2026-01-01T00:00:00Z'),
  actualizado_en: new Date('2026-01-01T00:00:00Z'),
};

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
};

const mockClientesRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('ClientesService', () => {
  let service: ClientesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: getRepositoryToken(ClienteEntity),
          useValue: mockClientesRepository,
        },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
    jest.clearAllMocks();

    mockClientesRepository.create.mockImplementation((data) => ({
      ...baseCliente,
      ...data,
    }));
    mockClientesRepository.save.mockImplementation((data) =>
      Promise.resolve({ ...baseCliente, ...data }),
    );
    mockClientesRepository.find.mockResolvedValue([{ ...baseCliente }]);
    mockClientesRepository.findOne.mockResolvedValue({ ...baseCliente });
    mockClientesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.getMany.mockResolvedValue([]);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // create
  // ============================================

  describe('create', () => {
    it('debería crear un cliente correctamente', async () => {
      const result = await service.create({
        nombre_completo: 'Nuevo Cliente',
        email: 'nuevo@example.com',
      } as any);
      expect(result).toBeDefined();
      expect(mockClientesRepository.save).toHaveBeenCalled();
    });

    it('debería aplicar defaults de total_gastado, pedidos_totales y activo', async () => {
      await service.create({
        nombre_completo: 'Sin Defaults',
        email: 'sin@example.com',
      } as any);
      expect(mockClientesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          total_gastado: 0,
          pedidos_totales: 0,
          activo: true,
        }),
      );
    });
  });

  // ============================================
  // findOne
  // ============================================

  describe('findOne', () => {
    it('debería retornar un cliente por su id', async () => {
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('debería lanzar NotFoundException si el cliente no existe', async () => {
      mockClientesRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // remove (soft delete)
  // ============================================

  describe('remove', () => {
    it('debería marcar eliminado_en al eliminar (soft delete)', async () => {
      const cliente = { ...baseCliente };
      mockClientesRepository.findOne.mockResolvedValueOnce(cliente);
      await service.remove(1);
      expect(cliente.eliminado_en).toBeInstanceOf(Date);
      expect(mockClientesRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el cliente no existe', async () => {
      mockClientesRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // compareClients (scoring de duplicados)
  // ============================================

  describe('compareClients', () => {
    it('debería dar score alto y matchear email + nombre en clientes idénticos', async () => {
      const clienteA = { ...baseCliente, id: 1 };
      const clienteB = { ...baseCliente, id: 2 }; // mismo email y nombre
      mockClientesRepository.findOne
        .mockResolvedValueOnce(clienteA)
        .mockResolvedValueOnce(clienteB);

      const result = await service.compareClients({
        cliente_a_id: 1,
        cliente_b_id: 2,
      } as any);

      // email (+80) + telefono (+25) + documento (+20) + nombre (+10) = 135 → cap 100
      expect(result.similarity_score).toBe(100);
      expect(result.matched_fields).toEqual(
        expect.arrayContaining([
          'email',
          'telefono',
          'documento_identidad',
          'nombre_completo',
        ]),
      );
    });

    it('debería dar score 0 en clientes totalmente distintos', async () => {
      const clienteA = { ...baseCliente, id: 1 };
      const clienteB = {
        ...baseCliente,
        id: 2,
        nombre_completo: 'María González',
        email: 'maria@otrodominio.com',
        telefono: '+56999999999',
        documento_identidad: '98765432-1',
        empresa: 'Otra Empresa',
        direccion: 'Avenida Siempre Viva 742',
        ciudad: 'Santiago',
        pais: 'Argentina',
      };
      mockClientesRepository.findOne
        .mockResolvedValueOnce(clienteA)
        .mockResolvedValueOnce(clienteB);

      const result = await service.compareClients({
        cliente_a_id: 1,
        cliente_b_id: 2,
      } as any);

      expect(result.similarity_score).toBe(0);
      expect(result.matched_fields).toHaveLength(0);
    });

    it('debería matchear solo email cuando el resto difiere', async () => {
      const clienteA = { ...baseCliente, id: 1 };
      const clienteB = {
        ...baseCliente,
        id: 2,
        nombre_completo: 'María González',
        telefono: '+56999999999',
        documento_identidad: '98765432-1',
        empresa: 'Otra',
        direccion: 'Otra dir',
        ciudad: 'Santiago',
        pais: 'Argentina',
        // email se mantiene igual al de baseCliente
      };
      mockClientesRepository.findOne
        .mockResolvedValueOnce(clienteA)
        .mockResolvedValueOnce(clienteB);

      const result = await service.compareClients({
        cliente_a_id: 1,
        cliente_b_id: 2,
      } as any);

      expect(result.similarity_score).toBe(80);
      expect(result.matched_fields).toEqual(['email']);
    });
  });

  // ============================================
  // mergeClients
  // ============================================

  describe('mergeClients', () => {
    it('debería lanzar BadRequestException si los ids son iguales', async () => {
      await expect(
        service.mergeClients({
          cliente_principal_id: 1,
          cliente_secundario_id: 1,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería marcar el secundario como duplicado y desactivarlo', async () => {
      const principal = { ...baseCliente, id: 1 };
      const secundario = { ...baseCliente, id: 2 };
      mockClientesRepository.findOne
        .mockResolvedValueOnce(principal)
        .mockResolvedValueOnce(secundario);

      await service.mergeClients({
        cliente_principal_id: 1,
        cliente_secundario_id: 2,
        campos_a_conservar: [],
      } as any);

      expect(secundario.activo).toBe(false);
      expect(secundario.es_duplicado).toBe(true);
      expect(secundario.fusionado_en_id).toBe(1);
      expect(mockClientesRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
