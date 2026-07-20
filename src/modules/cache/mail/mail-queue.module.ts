import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MAIL_QUEUE } from './jobs/mail-job.constants';
import { MailJobProducer } from './jobs/mail-job.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MAIL_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2_000, jitter: 0.2 },
        removeOnComplete: { age: 86_400, count: 10_000 },
        removeOnFail: { age: 604_800, count: 50_000 },
        stackTraceLimit: 10,
      },
    }),
  ],
  providers: [MailJobProducer],
  exports: [MailJobProducer, BullModule],
})
export class MailQueueModule {}
