import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from './modules/cache/queue/queue.module';
import { MailWorkerModule } from './modules/cache/mail/mail-worker.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { validateWorkerEnvironment } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      validate: validateWorkerEnvironment,
    }),
    DatabaseModule,
    QueueModule,
    MailWorkerModule,
  ],
})
export class WorkerAppModule {}
