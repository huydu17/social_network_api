import { createClient, RedisClientType } from 'redis';
import { appConfig } from 'src/config/appConfig';

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
}

export const redisCache: RedisCache = new RedisCache();
