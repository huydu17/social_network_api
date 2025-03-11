import { IUserDocument } from 'src/features/users/interfaces/user.interface';
import { redisCache } from './redis.cache';
import { BadRequestException, InternalException } from 'src/shared/middlewares/globalErrorHandle';
import { Helpers } from 'src/shared/utils/helpers';
import { IPostDocument, ISavePostToCache } from 'src/features/posts/interfaces/post.interface';
import { IReaction } from 'src/features/reactions/interfaces/reaction.interface';
import { userCache } from './user.cache';

class PostCache {
  public async savePostToCache(data: ISavePostToCache): Promise<void> {
    const { key, post } = data;
    const { _id, user, text, images, videos, gifUrl, feelings, privancy, commentsCount, reactions } = post;
    const dataToSave = {
      _id: `${_id}`,
      user: `${user}`,
      text: `${text}`,
      images: JSON.stringify(images),
      videos: JSON.stringify(videos),
      gifUrl: `${gifUrl}`,
      feelings: `${feelings}`,
      privancy: `${privancy}`,
      commentsCount: `${commentsCount}`,
      reactions: JSON.stringify(reactions)
    };
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      await redisCache.client.ZADD('posts', { score: Date.now(), value: `${key}` });
      await redisCache.client.HSET(`post:${key}`, dataToSave);
    } catch (error) {
      throw new InternalException(`Server error: ${error}`);
    }
  }
  public async getPostsFromCache(
    page: number = 1,
    limit: number = 10,
    usersToFetch: string[]
  ): Promise<IPostDocument[]> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      const reply: string[] = await redisCache.client.ZRANGE('posts', 0, -1, { REV: true });
      const multi: ReturnType<typeof redisCache.client.multi> = redisCache.client.multi();
      for (const value of reply) {
        multi.HGETALL(`post:${value}`);
      }
      const replies: any = await multi.exec();
      const normalizedPosts = replies.map((post: any) => Object.assign({}, post));
      const filteredPosts = normalizedPosts.filter((post: any) => {
        if (!post.user) {
          return false;
        }
        const user = Helpers.parseJson(post.user);
        if (!user || !user._id) {
          return false;
        }
        return usersToFetch.includes(user._id.toString());
      });
      const postsData = await Promise.all(
        filteredPosts.map(async (post: any) => ({
          ...post,
          commentsCount: post.commentsCount ? (Helpers.parseJson(`${post.commentsCount}`) as number) : 0,
          reactions: post.reactions ? (Helpers.parseJson(`${post.reactions}`) as IReaction) : {},
          images: post.images ? Helpers.parseJson(`${post.images}`) : [],
          videos: post.videos ? Helpers.parseJson(`${post.videos}`) : [],
          user: await userCache.getFormattedUserResponse(post.user)
        }))
      );
      const start = (page - 1) * limit;
      const end = start + limit;
      return postsData.slice(start, end);
    } catch (error) {
      throw new InternalException(`Server error: ${error}`);
    }
  }
  public async getUserPostsFromCache(page: number = 1, limit: number = 10, userId: string): Promise<IPostDocument[]> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      const reply: string[] = await redisCache.client.ZRANGE('posts', 0, -1, { REV: true });
      const multi: ReturnType<typeof redisCache.client.multi> = redisCache.client.multi();
      for (const value of reply) {
        multi.HGETALL(`post:${value}`);
      }
      const replies: any = await multi.exec();
      const normalizedPosts = replies.map((post: any) => Object.assign({}, post));
      const filteredPosts = normalizedPosts.filter((post: any) => post.user === userId);
      const postsData = await Promise.all(
        filteredPosts.map(async (post: any) => ({
          ...post,
          commentsCount: post.commentsCount ? (Helpers.parseJson(`${post.commentsCount}`) as number) : 0,
          reactions: post.reactions ? (Helpers.parseJson(`${post.reactions}`) as IReaction) : {},
          images: post.images ? Helpers.parseJson(`${post.images}`) : [],
          videos: post.videos ? Helpers.parseJson(`${post.videos}`) : [],
          user: await userCache.getFormattedUserResponse(post.user)
        }))
      );
      const start = (page - 1) * limit;
      const end = start + limit;
      return postsData.slice(start, end);
    } catch (error) {
      throw new InternalException(`Server error: ${error}`);
    }
  }
  public async deletePostFromCache(key: string): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      const postExists = await redisCache.client.EXISTS(`post:${key}`);
      if (!postExists) {
        throw new InternalException(`Post with ID ${key} not found in cache`);
      }
      const multi: ReturnType<typeof redisCache.client.multi> = redisCache.client.multi();
      multi.ZREM('posts', `${key}`);
      multi.DEL(`post:${key}`);
      multi.DEL(`comment:${key}`);
      multi.DEL(`reactions:${key}`);
      await multi.exec();
    } catch (error) {
      throw new InternalException(`Server error: ${error}`);
    }
  }
  public async updatePostFromCache(data: ISavePostToCache): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const { post } = data;
      const { _id, user, text, images, videos, gifUrl, feelings, privancy, commentsCount, reactions } = post;
      const dataToUpdate = {
        _id: `${_id}`,
        user: `${user}`,
        text: `${text}`,
        images: JSON.stringify(images),
        videos: JSON.stringify(videos),
        gifUrl: `${gifUrl}`,
        feelings: `${feelings}`,
        privancy: `${privancy}`,
        commentsCount: `${commentsCount}`,
        reactions: JSON.stringify(reactions)
      };
      const postExists = await redisCache.client.EXISTS(`post:${_id}`);
      if (!postExists) {
        throw new InternalException(`Post with ID ${_id} not found in cache`);
      }
      await redisCache.client.HSET(`post:${_id}`, dataToUpdate);
    } catch (error) {
      throw new InternalException(`Error updating post in cache: ${error}`);
    }
  }
}

export const postCache: PostCache = new PostCache();
