import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          prefix: configService.get('BULL_PREFIX'),

          connection: {
            host: configService.getOrThrow('REDIS_HOST'),
            username: configService.get('REDIS_USERNAME') || undefined,
            password: configService.get('REDIS_PASSWORD') || undefined,
            port: Number(configService.getOrThrow('REDIS_PORT')),
            tls: configService.get('REDIS_TLS') === 'true' ? {} : undefined,
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
