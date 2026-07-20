import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from './modules/cache/queue/queue.module';
import { MailWorkerModule } from './modules/cache/mail/mail-worker.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { workerConfigOptions } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot(workerConfigOptions),
    DatabaseModule,
    QueueModule,
    MailWorkerModule,
  ],
})
export class WorkerAppModule {}
