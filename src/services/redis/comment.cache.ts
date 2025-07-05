import { InternalException } from 'src/middlewares/globalErrorHandle';
import { redisCache } from './redis.cache';
import { userCache } from './user.cache';
import { ICommentDocument } from 'src/interfaces/comment.interface';
import { Helpers } from 'src/utils/helpers';

class CommentCache {
  public async saveCommentToCache(postId: string, value: string): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      await redisCache.client.LPUSH(`comment:${postId}`, value);
      const commentsCount: string[] = await redisCache.client.HMGET(`post:${postId}`, 'commentsCount');
      let count: number = JSON.parse(commentsCount[0]) as number;
      count += 1;
      await redisCache.client.HSET(`post:${postId}`, 'commentsCount', `${count}`);
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
    }
  }
  public async getCommentsFromCache(postId: string): Promise<ICommentDocument[]> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      const response: string[] = await redisCache.client.LRANGE(`comment:${postId}`, 0, -1);
      const list: ICommentDocument[] = [];
      for (const item of response) {
        list.push(Helpers.parseJson(item) as ICommentDocument);
      }
      const commentsData: any = await Promise.all(
        list.map(async (comment: ICommentDocument) => {
          return { ...comment, user: await userCache.getFormattedUserResponse(`${comment.user}`) };
        })
      );
      return commentsData.length ? commentsData : [];
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
    }
  }
}

export const commentCache: CommentCache = new CommentCache();
