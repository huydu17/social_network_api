import { createClient, RedisClientType } from 'redis';
import { appConfig } from 'src/shared/config/appConfig';

export class RedisCache {
  public client: RedisClientType;
  constructor() {
    this.client = createClient({ url: appConfig.REDIS_HOST });
    this.cacheError();
  }
  private cacheError() {
    this.client.on('error', (err: any) => {
      console.log('Redis Client Error', err);
    });
  }
  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.log('Error connecting to Redis:', error);
    }
  }
}

export const redisCache: RedisCache = new RedisCache();
