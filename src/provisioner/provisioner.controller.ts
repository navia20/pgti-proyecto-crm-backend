import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ProvisionerService } from './provisioner.service';

@Controller('api/v1/provision-user')
export class ProvisionerController {
  constructor(private readonly provisionerService: ProvisionerService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async provisionUser(
    @Body()
    body: {
      customerId: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
    },
  ) {
    return this.provisionerService.provisionUser(body);
  }
}
