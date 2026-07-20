import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MAIL_QUEUE } from './jobs/mail-job.constants';
import { MailJobProducer } from './jobs/mail-job.producer';
import { MailService } from './services/mail.service';
import { MailJobProcessor } from './jobs/mail-job.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MAIL_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
          jitter: 0.2,
        },

        removeOnComplete: {
          age: 24 * 60 * 60, // 1 day
          count: 1000,
        },

        removeOnFail: {
          age: 24 * 60 * 60 * 60,
          count: 1000,
        },

        stackTraceLimit: 10,
      },
    }),
  ],

  providers: [MailJobProducer, MailService, MailJobProcessor],
  exports: [BullModule, MailService, MailJobProducer, MailJobProcessor],
})
export class MailModule {}
