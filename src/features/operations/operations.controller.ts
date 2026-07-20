import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { OperationsService } from './operations.service';

@Controller()
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('health/ready')
  health() {
    return this.operations.health();
  }

  @Get('operations/metrics')
  metrics() {
    return this.operations.metrics();
  }

  @Get('mail/jobs/:jobId')
  async job(@Param('jobId') jobId: string) {
    const job = await this.operations.getJob(jobId);
    if (!job) throw new NotFoundException('Job bulunamadı.');
    return job;
  }

  @Get('mail/deliveries/:deliveryKey')
  async delivery(@Param('deliveryKey') deliveryKey: string) {
    const delivery = await this.operations.getDelivery(deliveryKey);
    if (!delivery) throw new NotFoundException('Delivery bulunamadı.');
    return delivery;
  }
}
