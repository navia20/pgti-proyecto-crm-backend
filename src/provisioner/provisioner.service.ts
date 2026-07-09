import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ProvisionUserPayload {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ProvisionUserResponse {
  userId: string;
  [key: string]: unknown;
}

@Injectable()
export class ProvisionerService {
  private readonly logger = new Logger(ProvisionerService.name);
  private readonly provisionerUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.provisionerUrl =
      this.configService.get<string>('PROVISIONER_URL') || '';
    this.apiKey = this.configService.get<string>('PROVISIONER_API_KEY') || '';
  }

  async provisionUser(
    payload: ProvisionUserPayload,
  ): Promise<ProvisionUserResponse> {
    const response = await firstValueFrom(
      this.httpService.post(this.provisionerUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        timeout: 15000,
      }),
    );
    return response.data as ProvisionUserResponse;
  }
}
