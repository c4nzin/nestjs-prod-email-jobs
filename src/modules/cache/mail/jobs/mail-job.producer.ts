import { Injectable } from '@nestjs/common';

import { MAIL_JOB_NAMES, MAIL_QUEUE, MailJobName } from './mail-job.constants';
import { MailJobResult, SendWelcomeEmailJobData } from './mail-job.types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

@Injectable()
export class MailJobProducer {
  constructor(
    @InjectQueue(MAIL_QUEUE)
    private readonly mailQueue: Queue<
      SendWelcomeEmailJobData,
      MailJobResult,
      MailJobName
    >,
  ) {}

  public async enqueueWelcomeEmail(
    data: SendWelcomeEmailJobData,
  ): Promise<Job<SendWelcomeEmailJobData, MailJobResult, MailJobName>> {
    return this.mailQueue.add(MAIL_JOB_NAMES.SEND_WELCOME_EMAIL, data, {
      jobId: `welcome-${data.eventId}`,
    });
  }
}
