import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class MergeClientesDto {
  @IsNumber()
  cliente_principal_id: number;

  @IsNumber()
  cliente_secundario_id: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  campos_a_conservar?: string[];
}
