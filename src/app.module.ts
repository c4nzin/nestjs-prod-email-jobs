import { Module } from '@nestjs/common';
import { QueueModule } from './modules/cache/queue/queue.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersModule } from './features/users/users.module';
import { MailQueueModule } from './modules/cache/mail/mail-queue.module';
import { OutboxModule } from './features/outbox/outbox.module';
import { ScheduleModule } from '@nestjs/schedule';
import { validateApiEnvironment } from './config/environment';
import { OperationsModule } from './features/operations/operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      validate: validateApiEnvironment,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    QueueModule,
    MailQueueModule,
    UsersModule,
    OutboxModule,
    OperationsModule,
  ],
})
export class AppModule {}
