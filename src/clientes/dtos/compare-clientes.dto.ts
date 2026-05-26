import { IsNumber } from 'class-validator';

export class CompareClientesDto {
  @IsNumber()
  cliente_a_id: number;

  @IsNumber()
  cliente_b_id: number;
}