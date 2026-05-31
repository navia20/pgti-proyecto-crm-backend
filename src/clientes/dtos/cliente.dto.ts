export class ClienteDto {
  id!: number;
  nombre_completo!: string;
  email!: string;
  telefono?: string;
  documento_identidad?: string;
  empresa?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  fecha_ultima_compra?: Date;
  total_gastado?: number;
  pedidos_totales?: number;
  activo!: boolean;
  es_duplicado!: boolean;
  fusionado_en_id?: number;
  fusionado_en?: Date;
  creado_en!: Date;
  actualizado_en!: Date;
}