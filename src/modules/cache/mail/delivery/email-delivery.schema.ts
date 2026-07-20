import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum EmailDeliveryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  ACCEPTED = 'accepted',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  FAILED = 'failed',
}

@Schema({ collection: 'email_deliveries', timestamps: true, versionKey: false })
export class EmailDelivery {
  @Prop({ required: true, unique: true })
  deliveryKey!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({
    required: true,
    enum: Object.values(EmailDeliveryStatus),
    index: true,
  })
  status!: EmailDeliveryStatus;

  @Prop() lockedAt?: Date;
  @Prop() acceptedAt?: Date;
  @Prop() providerMessageId?: string;
  @Prop() lastError?: string;
  @Prop({ default: 0 }) attempts!: number;
}

export const EmailDeliverySchema = SchemaFactory.createForClass(EmailDelivery);
