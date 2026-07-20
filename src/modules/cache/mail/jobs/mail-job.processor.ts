import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { MAIL_JOB_NAMES, MAIL_QUEUE, MailJobName } from './mail-job.constants';
import { Job, UnrecoverableError } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from '../services/mail.service';
import { MailJobResult, SendWelcomeEmailJobData } from './mail-job.types';
import { EmailDeliveryService } from '../delivery/email-delivery.service';

@Processor(MAIL_QUEUE, {
  concurrency: 5,
  limiter: {
    max: 20,
    duration: 1000,
  },
})
export class MailJobProcessor extends WorkerHost {
  private readonly logger = new Logger(MailJobProcessor.name);

  constructor(
    private readonly mailService: MailService,
    private readonly deliveryService: EmailDeliveryService,
  ) {
    super();
  }

  public async process(
    job: Job<SendWelcomeEmailJobData, MailJobResult, MailJobName>,
  ): Promise<MailJobResult> {
    switch (job.name) {
      case MAIL_JOB_NAMES.SEND_WELCOME_EMAIL:
        return this.processWelcomeEmail(job);
      default:
        throw new UnrecoverableError(`Unknown mail job name: ${job.name}`);
    }
  }

  private async processWelcomeEmail(
    job: Job<SendWelcomeEmailJobData, MailJobResult, MailJobName>,
  ): Promise<MailJobResult> {
    const { data } = job;

    if (data.schemaVersion !== 1) {
      throw new UnrecoverableError(
        `Unsupported schema version: ${data.schemaVersion}`,
      );
    }

    await job.updateProgress({
      stage: 'pending',
      percentage: 20,
    });

    const deliveryKey = `welcome-${data.userId}`;
    const claim = await this.deliveryService.claim(deliveryKey, data.userId);
    if (claim.state === 'already-accepted') return claim.result;
    if (claim.state === 'busy') {
      throw new Error(`Delivery is already being processed: ${deliveryKey}`);
    }

    let result;
    try {
      result = await this.mailService.sendWelcomeEmail({
        userId: data.userId,
        email: data.email,
        name: data.name,
        deliveryKey,
      });
    } catch (error) {
      const mailError =
        error instanceof Error ? error : new Error(String(error));
      await this.deliveryService.failed(deliveryKey, mailError);

      throw mailError;
    }

    await job.updateProgress({
      stage: 'completed',
      percentage: 100,
    });

    const jobResult: MailJobResult = {
      providerMessageId: result.messageId,
      accepted: Array.isArray(result.accepted)
        ? result.accepted.map(String)
        : [],

      rejected: Array.isArray(result.rejected)
        ? result.rejected.map(String)
        : [],

      sentAt: new Date().toISOString(),
    };
    await this.deliveryService.accepted(deliveryKey, jobResult);
    return jobResult;
  }

  @OnWorkerEvent('active')
  onActive(job: Job<SendWelcomeEmailJobData>): void {
    this.logger.log({
      event: 'mail_job.active',
      queue: MAIL_QUEUE,
      jobId: job.id,
      jobName: job.name,
      userId: job.data.userId,
      correlationId: job.data.correlationId,
      attemptsMade: job.attemptsMade,
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<SendWelcomeEmailJobData>): void {
    this.logger.log({
      event: 'mail_job.completed',
      queue: MAIL_QUEUE,
      jobId: job.id,
      jobName: job.name,
      userId: job.data.userId,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SendWelcomeEmailJobData> | undefined, error: Error): void {
    this.logger.error({
      event: 'mail_job.failed',
      queue: MAIL_QUEUE,
      jobId: job?.id,
      jobName: job?.name,
      userId: job?.data.userId,
      attemptsMade: job?.attemptsMade,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    });
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn({ event: 'mail_job.stalled', queue: MAIL_QUEUE, jobId });
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error({
      event: 'mail_worker.error',
      queue: MAIL_QUEUE,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    });
  }
}
