import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProvisionerService } from './provisioner.service';
import { ProvisionerController } from './provisioner.controller';

@Module({
  imports: [HttpModule],
  providers: [ProvisionerService],
  controllers: [ProvisionerController],
})
export class ProvisionerModule {}
