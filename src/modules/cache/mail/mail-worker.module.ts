import { Module } from '@nestjs/common';
import { MailQueueModule } from './mail-queue.module';
import { MailJobProcessor } from './jobs/mail-job.processor';
import { MailService } from './services/mail.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmailDelivery,
  EmailDeliverySchema,
} from './delivery/email-delivery.schema';
import { EmailDeliveryService } from './delivery/email-delivery.service';

@Module({
  imports: [
    MailQueueModule,
    MongooseModule.forFeature([
      { name: EmailDelivery.name, schema: EmailDeliverySchema },
    ]),
  ],
  providers: [MailJobProcessor, MailService, EmailDeliveryService],
})
export class MailWorkerModule {}
