import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clientes')
export class ClienteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre_completo: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  documento_identidad: string;

  @Column({ nullable: true })
  empresa: string;

  @Column({ nullable: true })
  direccion: string;

  @Column({ nullable: true })
  ciudad: string;

  @Column({ nullable: true })
  pais: string;

  @Column({ type: 'timestamp', nullable: true })
  fecha_ultima_compra: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_gastado: number;

  @Column({ type: 'integer', default: 0 })
  pedidos_totales: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_duplicado: boolean;

  @Column({ type: 'integer', nullable: true })
  fusionado_en_id: number;

  @Column({ type: 'timestamp', nullable: true })
  fusionado_en: Date;

  @Column({ type: 'timestamp', nullable: true })
  eliminado_en: Date;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}
