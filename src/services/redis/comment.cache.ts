// src/services/redis/comment.cache.ts
import { redisCache } from './redis.cache'; // Chỉ cần redisCache chung
import { InternalException } from 'src/middlewares/globalErrorHandle';
class CommentCache {
  public async incrementCommentCountInPostCache(postId: string): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const postKey = `post:${postId}`;
      await redisCache.client.HINCRBY(postKey, 'commentsCount', 1);
    } catch (error: any) {
      console.log('Redis Failed', error);
    }
  }

  public async decrementCommentCountInPostCache(postId: string): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const postKey = `post:${postId}`;
      await redisCache.client.HINCRBY(postKey, 'commentsCount', -1);
    } catch (error: any) {
      console.log('Redis Failed', error);
    }
  }
}
export const commentCache: CommentCache = new CommentCache();
