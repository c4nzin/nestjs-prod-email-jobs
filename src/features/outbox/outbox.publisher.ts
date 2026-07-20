import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { MailJobProducer } from '../../modules/cache/mail/jobs/mail-job.producer';
import { SendWelcomeEmailJobData } from '../../modules/cache/mail/jobs/mail-job.types';
import { OutboxEvent } from './outbox.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OutboxPublisher {
  private readonly logger = new Logger(OutboxPublisher.name);
  private running = false;

  constructor(
    @InjectModel(OutboxEvent.name) private readonly outbox: Model<OutboxEvent>,
    private readonly producer: MailJobProducer,
    private readonly config: ConfigService,
  ) {}

  @Cron('*/5 * * * * *')
  async publish(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      for (let count = 0; count < 100; count++) {
        const stale = new Date(Date.now() - 5 * 60_000);
        const event = await this.outbox
          .findOneAndUpdate(
            {
              $or: [
                { status: 'pending' },
                { status: 'processing', lockedAt: { $lt: stale } },
              ],
            },
            {
              $set: {
                status: 'processing',
                lockedAt: new Date(),
                lastError: null,
              },
            },
            { sort: { createdAt: 1 }, returnDocument: 'after' },
          )
          .lean();
        if (!event) break;
        try {
          await this.producer.enqueueWelcomeEmail(
            event.payload as unknown as SendWelcomeEmailJobData,
          );
          await this.outbox.updateOne(
            { _id: event._id },
            { $set: { status: 'published', publishedAt: new Date() } },
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          await this.outbox.updateOne(
            { _id: event._id },
            {
              $set: { status: 'pending', lastError: message },
              $unset: { lockedAt: 1 },
            },
          );
          this.logger.error({
            event: 'outbox.publish_failed',
            eventId: event.eventId,
            error: message,
          });
          break;
        }
      }
    } finally {
      this.running = false;
    }
  }

  @Cron('0 0 3 * * *', { timeZone: 'UTC' })
  async cleanup(): Promise<void> {
    const retentionDays = Number(
      this.config.get('OUTBOX_RETENTION_DAYS') ?? 30,
    );
    const threshold = new Date(Date.now() - retentionDays * 24 * 60 * 60_000);
    await this.outbox.deleteMany({
      status: 'published',
      publishedAt: { $lt: threshold },
    });
  }
}
