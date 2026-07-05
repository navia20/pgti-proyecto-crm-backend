export interface NotificacionEmailBody {
  email: string;
  sms?: string;
}

export interface NotificacionSmsBody {
  sms: string;
}

export interface NotificacionPayload {
  channel: 'email' | 'sms';
  recipient: {
    email?: string;
    telefono?: string;
  };
  subject?: string;
  body: NotificacionEmailBody | NotificacionSmsBody;
}

export interface NotificacionResponse {
  ok: boolean;
  message?: string;
}
