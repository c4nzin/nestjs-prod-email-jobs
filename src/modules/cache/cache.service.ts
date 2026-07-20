import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (ttl !== undefined) {
      await this.cacheManager.set(key, value, ttl);
    }

    await this.cacheManager.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async multiGet<T>(keys: string[]): Promise<(T | undefined)[]> {
    return this.cacheManager.mget<T>(keys);
  }
  async multiDel(keys: string[]): Promise<void> {
    await this.cacheManager.mdel(keys);
  }
}
