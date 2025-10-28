import { createClient, RedisClientType } from 'redis';
import { appConfig } from 'src/config/appConfig';

interface ISetOptions {
  EX?: number;
}

export class RedisCache {
  public client: RedisClientType;
  constructor() {
    this.client = createClient({ url: appConfig.REDIS_HOST });
    this.cacheError();
  }
  private cacheError() {
    this.client.on('error', (err: any) => {
      console.log('Lỗi Redis Client:', err);
    });
  }
  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Kết nối Redis thành công');
    } catch (error) {
      console.log('Lỗi khi kết nối với Redis:', error);
    }
  }
  public async set(key: string, value: any, options: ISetOptions): Promise<void> {
    try {
      const jsonData = JSON.stringify(value);
      if (options) {
        await this.client.SET(key, jsonData, options);
      } else {
        await this.client.SET(key, jsonData);
      }
    } catch (error) {
      console.log('Redis Failded:', error);
    }
  }
  public async get<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await this.client.GET(key);
      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }
      return null;
    } catch (error) {
      console.warn('Redis Failed', error);
      return null;
    }
  }
  public async del(keyOrKeys: string | string[]): Promise<void> {
    try {
      await this.client.DEL(keyOrKeys);
    } catch (error) {
      console.warn(`Redis DEL failed for key(s) ${keyOrKeys}:`, error);
    }
  }
}

export const redisCache: RedisCache = new RedisCache();
