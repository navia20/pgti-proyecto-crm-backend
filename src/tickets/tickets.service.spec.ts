import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketEntity } from './entities/ticket.entity';
import { ClientesService } from '../clientes/clientes.service';
import { InteraccionesService } from '../interacciones/interacciones.service';

const mockTicket: Partial<TicketEntity> = {
  id: 'uuid-test-001',
  asunto: 'Problema con autenticación',
  estado: 'abierto',
  prioridad: 'alta',
  canal: 'email',
  cliente_id: 1,
  agente_id: undefined,
  fecha_vencimiento_sla: new Date('2026-07-10T10:00:00Z'),
  pedido_id_ref: undefined,
  suscripcion_id_ref: undefined,
  creado_en: new Date('2026-07-04T09:00:00Z'),
  actualizado_en: new Date('2026-07-04T09:00:00Z'),
  interacciones: [],
  articulos: [],
};

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([mockTicket]),
  getManyAndCount: jest.fn().mockResolvedValue([[mockTicket], 1]),
};

const mockTicketRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

// Mocks de servicios inyectados por TicketsService.
// Firmas tomadas del código real: getClientNames -> clientesService.findByIds(),
// createExterno -> findByEmailOrTelefono() / create(), interaccionesService.create().
const mockClientesService = {
  findByIds: jest.fn().mockResolvedValue([]),
  findByEmailOrTelefono: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ id: 1 }),
};

const mockInteraccionesService = {
  create: jest.fn().mockResolvedValue({}),
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(TicketEntity),
          useValue: mockTicketRepository,
        },
        {
          provide: ClientesService,
          useValue: mockClientesService,
        },
        {
          provide: InteraccionesService,
          useValue: mockInteraccionesService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    jest.clearAllMocks();

    mockTicketRepository.find.mockResolvedValue([mockTicket]);
    mockTicketRepository.findOne.mockResolvedValue(mockTicket);
    mockTicketRepository.save.mockResolvedValue(mockTicket);
    mockTicketRepository.delete.mockResolvedValue({ affected: 1 });
    mockTicketRepository.remove.mockResolvedValue(mockTicket);
    mockTicketRepository.count.mockResolvedValue(1);
    mockTicketRepository.create.mockImplementation((data) => ({ ...mockTicket, ...data }));
    mockTicketRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.getMany.mockResolvedValue([mockTicket]);
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockTicket], 1]);
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();

    mockClientesService.findByIds.mockResolvedValue([]);
    mockClientesService.findByEmailOrTelefono.mockResolvedValue(null);
    mockClientesService.create.mockResolvedValue({ id: 1 });
    mockInteraccionesService.create.mockResolvedValue({});
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // findAll  (realineado al query builder real)
  // ============================================

  describe('findAll', () => {
    it('debería retornar lista de tickets con total', async () => {
      const result = await service.findAll(0, 10);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('debería retornar total desde getManyAndCount', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([[mockTicket], 5]);
      const result = await service.findAll(0, 10);
      expect(result.total).toBe(5);
    });

    it('debería usar el query builder del repositorio', async () => {
      await service.findAll(0, 10);
      expect(mockTicketRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
    });

    it('debería retornar lista vacía cuando no hay tickets', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([[], 0]);
      const result = await service.findAll(0, 10);
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('debería incluir estado en el andWhere cuando se proporciona', async () => {
      await service.findAll(0, 10, 'abierto');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.estado = :estado',
        { estado: 'abierto' },
      );
    });

    it('debería incluir prioridad en el andWhere cuando se proporciona', async () => {
      await service.findAll(0, 10, undefined, 'alta');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.prioridad = :prioridad',
        { prioridad: 'alta' },
      );
    });

    it('debería incluir cliente_id en el andWhere cuando se proporciona', async () => {
      await service.findAll(0, 10, undefined, undefined, 1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.cliente_id = :cliente_id',
        { cliente_id: 1 },
      );
    });

    it('debería aplicar paginación con skip y take', async () => {
      await service.findAll(5, 20);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  // ============================================
  // findAll — filtro por referencia
  // ============================================

  describe('findAll — filtro por referencia', () => {
    it('debería filtrar por pedido (pedido_id_ref IS NOT NULL)', async () => {
      await service.findAll(0, 10, undefined, undefined, undefined, undefined, undefined, 'pedido');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.pedido_id_ref IS NOT NULL',
      );
    });

    it('debería filtrar por suscripcion (suscripcion_id_ref IS NOT NULL)', async () => {
      await service.findAll(0, 10, undefined, undefined, undefined, undefined, undefined, 'suscripcion');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.suscripcion_id_ref IS NOT NULL',
      );
    });

    it('debería filtrar por salud (salud_ref IS NOT NULL)', async () => {
      await service.findAll(0, 10, undefined, undefined, undefined, undefined, undefined, 'salud');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.salud_ref IS NOT NULL',
      );
    });

    it('debería filtrar por pago (pago_id_ref IS NOT NULL)', async () => {
      await service.findAll(0, 10, undefined, undefined, undefined, undefined, undefined, 'pago');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.pago_id_ref IS NOT NULL',
      );
    });

    it('debería filtrar por ninguna (todas las referencias IS NULL)', async () => {
      await service.findAll(0, 10, undefined, undefined, undefined, undefined, undefined, 'ninguna');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.pedido_id_ref IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.suscripcion_id_ref IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.salud_ref IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.pago_id_ref IS NULL',
      );
    });
  });

  // ============================================
  // findById
  // ============================================

  describe('findById', () => {
    it('debería retornar un ticket por su ID', async () => {
      const result = await service.findById('uuid-test-001');
      expect(result).toBeDefined();
      expect(result?.id).toBe('uuid-test-001');
    });

    it('debería llamar al repositorio con el ID correcto', async () => {
      await service.findById('uuid-test-001');
      expect(mockTicketRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'uuid-test-001' } })
      );
    });

    it('debería lanzar NotFoundException cuando el ticket no existe', async () => {
      mockTicketRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findById('uuid-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // create
  // ============================================

  describe('create', () => {
    const createDto = {
      asunto: 'Nuevo ticket de prueba',
      canal: 'email' as any,
      prioridad: 'media' as any,
      cliente_id: 1,
    };

    it('debería crear un ticket correctamente', async () => {
      const result = await service.create(createDto);
      expect(result).toBeDefined();
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });

    it('debería llamar create y save del repositorio', async () => {
      await service.create(createDto);
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });

    it('debería asignar estado "abierto" por defecto', async () => {
      await service.create(createDto);
      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'abierto' })
      );
    });

    it('debería calcular fecha de vencimiento SLA al crear', async () => {
      await service.create(createDto);
      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fecha_vencimiento_sla: expect.any(Date),
        })
      );
    });

    it('debería pasar canal correcto al create', async () => {
      await service.create({ ...createDto, canal: 'chat' as any });
      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ canal: 'chat' })
      );
    });

    it('debería pasar prioridad correcta al create', async () => {
      await service.create({ ...createDto, prioridad: 'critica' as any });
      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ prioridad: 'critica' })
      );
    });
  });

  // ============================================
  // create — validación
  // ============================================

  describe('create — validación', () => {
    it('debería lanzar BadRequestException si faltan cliente_id y canal', async () => {
      await expect(
        service.create({
          asunto: 'Ticket sin cliente ni canal',
          prioridad: 'media' as any,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('no debería lanzar si viene canal aunque falte cliente_id', async () => {
      await expect(
        service.create({
          asunto: 'Ticket solo con canal',
          canal: 'email' as any,
          prioridad: 'media' as any,
        } as any),
      ).resolves.toBeDefined();
    });
  });

  // ============================================
  // createExterno
  // ============================================

  describe('createExterno', () => {
    // Helper para dejar correr microtasks pendientes (fire-and-forget sin await).
    const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

    const baseDto = {
      asunto: 'Ticket externo de prueba',
      prioridad: 'media' as any,
      sistema_origen: 'pedidos' as any,
      sistema_id: 'sys-001',
    };

    it('debería crear un ticket externo correctamente', async () => {
      const result = await service.createExterno(baseDto as any);
      expect(result).toBeDefined();
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });

    it('debería forzar canal "email" en tickets externos', async () => {
      await service.createExterno(baseDto as any);
      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ canal: 'email' }),
      );
    });

    it('debería usar cliente_id directo si viene en el dto', async () => {
      await service.createExterno({ ...baseDto, cliente_id: 7 } as any);
      expect(mockClientesService.findByEmailOrTelefono).not.toHaveBeenCalled();
      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ cliente_id: 7 }),
      );
    });

    it('debería reutilizar cliente existente encontrado por email', async () => {
      mockClientesService.findByEmailOrTelefono.mockResolvedValueOnce({ id: 42 } as any);
      await service.createExterno({
        ...baseDto,
        cliente_email: 'juan@example.com',
      } as any);
      expect(mockClientesService.findByEmailOrTelefono).toHaveBeenCalled();
      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ cliente_id: 42 }),
      );
    });

    it('debería crear cliente nuevo si no existe y hay nombre + email', async () => {
      mockClientesService.findByEmailOrTelefono.mockResolvedValueOnce(null);
      mockClientesService.create.mockResolvedValueOnce({ id: 99 } as any);
      await service.createExterno({
        ...baseDto,
        cliente_nombre: 'Nuevo Cliente',
        cliente_email: 'nuevo@example.com',
      } as any);
      expect(mockClientesService.create).toHaveBeenCalled();
      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ cliente_id: 99 }),
      );
    });

    it('debería crear una interacción si viene descripción', async () => {
      await service.createExterno({
        ...baseDto,
        descripcion: 'Detalle del problema',
      } as any);
      await flushPromises();
      expect(mockInteraccionesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contenido: 'Detalle del problema',
          autor_tipo: 'sistema',
          es_nota_interna: false,
        }),
      );
    });

    it('no debería crear interacción si no viene descripción', async () => {
      await service.createExterno(baseDto as any);
      await flushPromises();
      expect(mockInteraccionesService.create).not.toHaveBeenCalled();
    });

    it('debería usar pedido_id_ref como autor_id cuando el origen es pedidos', async () => {
      await service.createExterno({
        ...baseDto,
        sistema_origen: 'pedidos' as any,
        pedido_id_ref: 'pedido-123',
        descripcion: 'Problema con el pedido',
      } as any);
      await flushPromises();
      expect(mockInteraccionesService.create).toHaveBeenCalledWith(
        expect.objectContaining({ autor_id: 'pedido-123' }),
      );
    });
  });

  // ============================================
  // update
  // ============================================

  describe('update', () => {
    it('debería actualizar el estado de un ticket', async () => {
      const ticketActualizado = { ...mockTicket, estado: 'progreso' };
      mockTicketRepository.findOne.mockResolvedValueOnce(mockTicket);
      mockTicketRepository.save.mockResolvedValueOnce(ticketActualizado);

      const result = await service.update('uuid-test-001', { estado: 'progreso' as any });
      expect(result.estado).toBe('progreso');
    });

    it('debería actualizar el agente asignado', async () => {
      const agenteId = 'uuid-agente-001';
      const ticketActualizado = { ...mockTicket, agente_id: agenteId };
      mockTicketRepository.findOne.mockResolvedValueOnce(mockTicket);
      mockTicketRepository.save.mockResolvedValueOnce(ticketActualizado);

      const result = await service.update('uuid-test-001', { agente_id: agenteId });
      expect(result.agente_id).toBe(agenteId);
    });

    it('debería llamar findOne y save al actualizar', async () => {
      await service.update('uuid-test-001', { estado: 'resuelto' as any });
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar error si el ticket no existe', async () => {
      mockTicketRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        service.update('uuid-inexistente', { estado: 'resuelto' as any })
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // delete
  // ============================================

  describe('delete', () => {
    it('debería eliminar un ticket sin lanzar error', async () => {
      await expect(service.delete('uuid-test-001')).resolves.not.toThrow();
    });

    it('debería llamar remove del repositorio', async () => {
      await service.delete('uuid-test-001');
      expect(mockTicketRepository.delete).toHaveBeenCalled();
    });

    it('debería lanzar error si el ticket no existe', async () => {
      mockTicketRepository.delete.mockResolvedValueOnce({ affected: 0 });
      await expect(service.delete('uuid-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // findByClientId
  // ============================================

  describe('findByClientId', () => {
    it('debería retornar tickets de un cliente específico', async () => {
      const result = await service.findByClientId(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it('debería retornar lista vacía si el cliente no tiene tickets', async () => {
      mockTicketRepository.find.mockResolvedValueOnce([]);
      const result = await service.findByClientId(999);
      expect(result).toHaveLength(0);
    });

    it('debería llamar al repositorio con el cliente_id correcto', async () => {
      await service.findByClientId(1);
      expect(mockTicketRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cliente_id: 1 } })
      );
    });
  });

  // ============================================
  // getTicketsBySlaStatus
  // ============================================

  describe('getTicketsBySlaStatus', () => {
    it('debería retornar estructura con ok, warning y critical', async () => {
      const result = await service.getTicketsBySlaStatus();
      expect(result).toHaveProperty('ok');
      expect(result).toHaveProperty('warning');
      expect(result).toHaveProperty('critical');
    });

    it('debería llamar find del repositorio con estado abierto', async () => {
      await service.getTicketsBySlaStatus();
      expect(mockTicketRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { estado: 'abierto' } })
      );
    });

    it('debería clasificar ticket como critical si el SLA venció', async () => {
      const ahora = new Date();
      const creado = new Date(ahora.getTime() - 24 * 60 * 60 * 1000); // hace 24h
      const vencido = new Date(ahora.getTime() - 1 * 60 * 60 * 1000); // venció hace 1h

      mockTicketRepository.find.mockResolvedValueOnce([
        { ...mockTicket, creado_en: creado, fecha_vencimiento_sla: vencido },
      ]);

      const result = await service.getTicketsBySlaStatus();

      expect(result.critical.length).toBeGreaterThan(0);
      expect(result.ok.length).toBe(0);
    });

    it('debería clasificar ticket como ok si tiene más del 25% de SLA restante', async () => {
      const ahora = new Date();
      const creado = new Date(ahora.getTime() - 1 * 60 * 60 * 1000);    // hace 1h
      const vencimiento = new Date(ahora.getTime() + 10 * 60 * 60 * 1000); // vence en 10h

      mockTicketRepository.find.mockResolvedValueOnce([
        { ...mockTicket, creado_en: creado, fecha_vencimiento_sla: vencimiento },
      ]);

      const result = await service.getTicketsBySlaStatus();

      expect(result.ok.length).toBeGreaterThan(0);
      expect(result.critical.length).toBe(0);
    });
  });
});