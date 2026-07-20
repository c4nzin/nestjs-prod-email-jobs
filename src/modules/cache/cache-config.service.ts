import { Injectable } from '@nestjs/common';
import { CacheOptionsFactory, CacheOptions } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  async createCacheOptions(): Promise<CacheOptions> {
    return {
      ttl: 120,
      nonBlocking: true,
      stores: [
        new KeyvRedis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
      ],
    };
  }
}
