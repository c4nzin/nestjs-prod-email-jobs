import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectConnection } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { Connection } from 'mongoose';
import { MAIL_QUEUE } from '../../modules/cache/mail/jobs/mail-job.constants';

@Injectable()
export class OperationsService {
  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async health() {
    const redis = await this.mailQueue.client;
    const redisReply = await (
      redis as unknown as { ping(): Promise<string> }
    ).ping();
    return {
      status:
        this.connection.readyState === 1 && redisReply === 'PONG'
          ? 'ok'
          : 'degraded',
      mongo: this.connection.readyState === 1 ? 'up' : 'down',
      redis: redisReply === 'PONG' ? 'up' : 'down',
    };
  }

  async metrics() {
    const [
      queue,
      outboxPending,
      outboxProcessing,
      deliveryFailed,
      deliveryProcessing,
    ] = await Promise.all([
      this.mailQueue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused',
      ),
      this.connection
        .collection('outbox_events')
        .countDocuments({ status: 'pending' }),
      this.connection
        .collection('outbox_events')
        .countDocuments({ status: 'processing' }),
      this.connection
        .collection('email_deliveries')
        .countDocuments({ status: 'failed' }),
      this.connection
        .collection('email_deliveries')
        .countDocuments({ status: 'processing' }),
    ]);
    return {
      queue,
      outbox: { pending: outboxPending, processing: outboxProcessing },
      deliveries: { failed: deliveryFailed, processing: deliveryProcessing },
    };
  }

  async getJob(jobId: string) {
    const job = await this.mailQueue.getJob(jobId);
    if (!job) return null;
    return {
      id: job.id,
      name: job.name,
      state: await job.getState(),
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason || null,
      result: job.returnvalue ?? null,
      createdAt: new Date(job.timestamp).toISOString(),
      processedAt: job.processedOn
        ? new Date(job.processedOn).toISOString()
        : null,
      finishedAt: job.finishedOn
        ? new Date(job.finishedOn).toISOString()
        : null,
    };
  }

  async getDelivery(deliveryKey: string) {
    return this.connection.collection('email_deliveries').findOne(
      { deliveryKey },
      {
        projection: {
          _id: 0,
          deliveryKey: 1,
          userId: 1,
          type: 1,
          status: 1,
          attempts: 1,
          providerMessageId: 1,
          acceptedAt: 1,
          lastError: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    );
  }
}
