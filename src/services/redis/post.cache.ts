import { IPostDocument, ISavePostToCache } from 'src/interfaces/post.interface';
import { redisCache } from './redis.cache';
import { userCache } from './user.cache';
import { InternalException } from 'src/middlewares/globalErrorHandle';
import { Helpers } from 'src/utils/helpers';
import { IReaction } from 'src/interfaces/reaction.interface';

class PostCache {
  public async savePostToCache(data: ISavePostToCache): Promise<void | null> {
    const { key, post } = data;
    const { _id, user, text, images, gifUrl, feelings, privacy, commentsCount, reactions, createdAt } = post;
    const dataToSave = {
      _id: `${_id}`,
      user: `${user}`,
      text: `${text}`,
      images: JSON.stringify(images),
      gifUrl: `${gifUrl}`,
      feelings: `${feelings}`,
      privacy: `${privacy}`,
      commentsCount: `${commentsCount}`,
      reactions: JSON.stringify(reactions),
      createdAt: `${createdAt}`
    };
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      await redisCache.client.HSET(`post:${key}`, dataToSave);
    } catch (error) {
      console.log('Redis failed:', error);
      return null;
    }
  }

  public async deletePostFromCache(key: string): Promise<void | null> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const postKey = `post:${key}`;
      const postExists = await redisCache.client.EXISTS(`post:${key}`);
      if (!postExists) {
        return null;
      }
      const multi: ReturnType<typeof redisCache.client.multi> = redisCache.client.multi();
      multi.DEL(postKey);
      await multi.exec();
    } catch (error) {
      console.log('Redis failed:', error);
    }
  }
  public async updatePostFromCache(data: any): Promise<void | null> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const { _id, user, text, images, gifUrl, feelings, privacy, commentsCount, reactions } = data;
      const postKey = `post:${_id}`;
      const postExists = await redisCache.client.EXISTS(postKey);
      if (!postExists) {
        return;
      }
      const dataToUpdate = {
        _id: `${_id}`,
        user: `${user}`,
        text: `${text}`,
        images: JSON.stringify(images),
        gifUrl: `${gifUrl}`,
        feelings: `${feelings}`,
        privacy: `${privacy}`,
        commentsCount: `${commentsCount}`,
        reactions: JSON.stringify(reactions)
      };
      await redisCache.client.HSET(`post:${_id}`, dataToUpdate);
    } catch (error) {
      console.log('Redis failed:', error);
    }
  }
}

export const postCache: PostCache = new PostCache();
