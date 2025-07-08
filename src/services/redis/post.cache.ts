import { IPostDocument, ISavePostToCache } from 'src/interfaces/post.interface';
import { redisCache } from './redis.cache';
import { userCache } from './user.cache';
import { InternalException } from 'src/middlewares/globalErrorHandle';
import { Helpers } from 'src/utils/helpers';
import { IReaction } from 'src/interfaces/reaction.interface';

class PostCache {
  public async savePostToCache(data: ISavePostToCache): Promise<void> {
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
        redisCache.connect();
      }
      await redisCache.client.ZADD('posts', { score: Date.now(), value: `${key}` });
      await redisCache.client.HSET(`post:${key}`, dataToSave);
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
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
        if (!user) {
          return false;
        }
        return usersToFetch.includes(user.toString());
      });
      const postsData: any = await Promise.all(
        filteredPosts.map(async (post: any) => ({
          ...post,
          commentsCount: post.commentsCount ? (Helpers.parseJson(`${post.commentsCount}`) as number) : 0,
          reactions: post.reactions ? (Helpers.parseJson(`${post.reactions}`) as IReaction) : {},
          images: post.images ? Helpers.parseJson(`${post.images}`) : [],
          videos: post.videos ? Helpers.parseJson(`${post.videos}`) : [],
          user: await userCache.getFormattedUserResponse(post.user),
          createdAt: new Date(Helpers.parseJson(`${post.createdAt}`)) as Date
        }))
      );
      const start = (page - 1) * limit;
      const end = start + limit;
      const posts = postsData.slice(start, end);
      const response: any = {
        posts: posts,
        totalPosts: postsData.length
      };
      return response;
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
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
          user: await userCache.getFormattedUserResponse(post.user),
          createdAt: new Date(Helpers.parseJson(`${post.createdAt}`)) as Date
        }))
      );
      const start = (page - 1) * limit;
      const end = start + limit;
      const posts = postsData.slice(start, end);
      const response: any = {
        posts: posts,
        totalPosts: postsData.length
      };
      return response;
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
    }
  }
  public async deletePostFromCache(key: string): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      const postExists = await redisCache.client.EXISTS(`post:${key}`);
      if (!postExists) {
        throw new InternalException(`Không tìm thấy bài viết với ID ${key} trong bộ nhớ cache`);
      }
      const multi: ReturnType<typeof redisCache.client.multi> = redisCache.client.multi();
      multi.ZREM('posts', `${key}`);
      multi.DEL(`post:${key}`);
      multi.DEL(`comment:${key}`);
      multi.DEL(`reactions:${key}`);
      await multi.exec();
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
    }
  }
  public async updatePostFromCache(data: any): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const { _id, user, text, images, gifUrl, feelings, privacy, commentsCount, reactions } = data;
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
      const postExists = await redisCache.client.EXISTS(`post:${_id.toString()}`);
      if (!postExists) {
        throw new InternalException(`Không tìm thấy bài viết với ID ${_id} trong bộ nhớ cache`);
      }
      await redisCache.client.HSET(`post:${_id}`, dataToUpdate);
    } catch (error) {
      throw new InternalException(`Lỗi khi cập nhật bài viết trong bộ nhớ cache: ${error}`);
    }
  }
}

export const postCache: PostCache = new PostCache();
