import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import {
  ProvisionerService,
  ProvisionUserPayload,
  ProvisionUserResponse,
} from './provisioner.service';

@Controller('api/v1/provision-user')
export class ProvisionerController {
  constructor(private readonly provisionerService: ProvisionerService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async provisionUser(
    @Body() body: ProvisionUserPayload,
  ): Promise<ProvisionUserResponse> {
    return this.provisionerService.provisionUser(body);
  }
}
