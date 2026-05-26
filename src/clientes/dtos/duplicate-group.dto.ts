import { ClienteDto } from './cliente.dto';

export class DuplicateMatchDto {
  cliente_a: ClienteDto;
  cliente_b: ClienteDto;
  similarity_score: number;
  matched_fields: string[];
}

export class DuplicateGroupDto {
  id: string;
  similarity_score: number;
  matched_fields: string[];
  records: ClienteDto[];
}
