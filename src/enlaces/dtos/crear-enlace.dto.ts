import { IsOptional, IsEnum } from 'class-validator';

export enum CanalNotificacionEnum {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  OTRO = 'otro',
}

export class CrearEnlaceDto {
  @IsOptional()
  @IsEnum(CanalNotificacionEnum)
  canal_notificacion?: CanalNotificacionEnum;
}
