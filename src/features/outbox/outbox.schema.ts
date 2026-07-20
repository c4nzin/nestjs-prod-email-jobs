import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'outbox_events', timestamps: true, versionKey: false })
export class OutboxEvent {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true, enum: ['pending', 'processing', 'published'] })
  status!: string;

  @Prop({ required: true, type: Object })
  payload!: Record<string, unknown>;

  @Prop()
  lockedAt?: Date;
  @Prop()
  publishedAt?: Date;
  @Prop()
  lastError?: string;
}

export const OutboxEventSchema = SchemaFactory.createForClass(OutboxEvent);
OutboxEventSchema.index({ status: 1, createdAt: 1 });
