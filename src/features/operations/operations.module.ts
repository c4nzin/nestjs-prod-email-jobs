import { Module } from '@nestjs/common';
import { MailQueueModule } from '../../modules/cache/mail/mail-queue.module';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({
  imports: [MailQueueModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
