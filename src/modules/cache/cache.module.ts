import { Global, Module } from '@nestjs/common';
import {
  CacheModule as BaseCacheModule,
  CacheInterceptor,
} from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheConfigService } from './cache-config.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    BaseCacheModule.registerAsync({
      useClass: CacheConfigService,
      isGlobal: true,
      //   extraProviders: [
      //     { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
      //   ],
    }),
  ],
  providers: [CacheConfigService, CacheService],
  exports: [CacheService],
})
export class CacheModule {}
