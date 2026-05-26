import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TicketEntity } from '../../tickets/entities/ticket.entity';
import { ArticuloKbEntity } from '../../articulos-kb/entities/articulo-kb.entity';

@Entity('ticket_articulos')
export class TicketArticuloEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  ticket_id: string;

  @Column('uuid')
  articulo_id: string;

  @Column({ type: 'boolean', default: false })
  fue_enviado_al_cliente: boolean;

  @Column('uuid', { nullable: true })
  agente_id: string;

  @CreateDateColumn()
  vinculado_en: Date;

  @ManyToOne(() => TicketEntity, (ticket) => ticket.articulos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket: TicketEntity;

  @ManyToOne(() => ArticuloKbEntity, (articulo) => articulo.tickets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'articulo_id' })
  articulo: ArticuloKbEntity;
}
