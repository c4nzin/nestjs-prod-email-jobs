import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailDelivery, EmailDeliveryStatus } from './email-delivery.schema';
import { MailJobResult } from '../jobs/mail-job.types';

export type DeliveryClaim =
  | { state: 'claimed' }
  | { state: 'busy' }
  | { state: 'already-accepted'; result: MailJobResult };

@Injectable()
export class EmailDeliveryService {
  constructor(
    @InjectModel(EmailDelivery.name)
    private readonly deliveries: Model<EmailDelivery>,
  ) {}

  async claim(deliveryKey: string, userId: string): Promise<DeliveryClaim> {
    await this.deliveries.updateOne(
      { deliveryKey },
      {
        $setOnInsert: {
          deliveryKey,
          userId,
          type: 'welcome-email',
          status: EmailDeliveryStatus.PENDING,
          attempts: 0,
        },
      },
      { upsert: true },
    );

    const stale = new Date(Date.now() - 5 * 60_000);
    const claimed = await this.deliveries.findOneAndUpdate(
      {
        deliveryKey,
        $or: [
          { status: EmailDeliveryStatus.PENDING },
          { status: EmailDeliveryStatus.FAILED },
          {
            status: EmailDeliveryStatus.PROCESSING,
            lockedAt: { $lt: stale },
          },
        ],
      },
      {
        $set: {
          status: EmailDeliveryStatus.PROCESSING,
          lockedAt: new Date(),
          lastError: null,
        },
        $inc: { attempts: 1 },
      },
      { returnDocument: 'after' },
    );
    if (claimed) return { state: 'claimed' };

    const existing = await this.deliveries.findOne({ deliveryKey }).lean();
    if (
      existing?.status === EmailDeliveryStatus.ACCEPTED ||
      existing?.status === EmailDeliveryStatus.DELIVERED
    ) {
      return {
        state: 'already-accepted',
        result: {
          providerMessageId: existing.providerMessageId ?? deliveryKey,
          accepted: [],
          rejected: [],
          sentAt: (existing.acceptedAt ?? new Date()).toISOString(),
        },
      };
    }
    return { state: 'busy' };
  }

  async accepted(deliveryKey: string, result: MailJobResult): Promise<void> {
    await this.deliveries.updateOne(
      { deliveryKey, status: EmailDeliveryStatus.PROCESSING },
      {
        $set: {
          status: EmailDeliveryStatus.ACCEPTED,
          acceptedAt: new Date(result.sentAt),
          providerMessageId: result.providerMessageId,
        },
        $unset: { lockedAt: 1, lastError: 1 },
      },
    );
  }

  async failed(deliveryKey: string, error: Error): Promise<void> {
    await this.deliveries.updateOne(
      { deliveryKey, status: EmailDeliveryStatus.PROCESSING },
      {
        $set: {
          status: EmailDeliveryStatus.FAILED,
          lastError: error.message.slice(0, 2_000),
        },
        $unset: { lockedAt: 1 },
      },
    );
  }
}
