import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailQueueModule } from '../../modules/cache/mail/mail-queue.module';
import { OutboxEvent, OutboxEventSchema } from './outbox.schema';
import { OutboxPublisher } from './outbox.publisher';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OutboxEvent.name, schema: OutboxEventSchema },
    ]),
    MailQueueModule,
  ],
  providers: [OutboxPublisher],
})
export class OutboxModule {}
