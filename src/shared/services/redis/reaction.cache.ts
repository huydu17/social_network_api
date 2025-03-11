import { IReactionDocument, IReaction } from 'src/features/reactions/interfaces/reaction.interface';
import { redisCache } from './redis.cache';
import { BadRequestException, InternalException } from 'src/shared/middlewares/globalErrorHandle';
import { Helpers } from 'src/shared/utils/helpers';
import { find } from 'lodash';
import { userCache } from './user.cache';

class ReactionCache {
  public async savePostReactionToCache(
    key: string,
    reaction: IReactionDocument,
    postReaction: IReaction,
    typeReaction: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      if (previousReaction) {
        this.removePostReactionFromCache(key, `${reaction.user}`, postReaction);
      }
      if (typeReaction) {
        await redisCache.client.LPUSH(`reaction:${key}`, JSON.stringify(reaction));
        await redisCache.client.HSET(`post:${key}`, 'reactions', JSON.stringify(postReaction));
      }
    } catch (error) {
      throw new InternalException(`Server error: ${error}`);
    }
  }
  public async removePostReactionFromCache(key: string, userId: string, postReaction: IReaction): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      const response = await redisCache.client.LRANGE(`reaction:${key}`, 0, -1);
      const multi: ReturnType<typeof redisCache.client.multi> = redisCache.client.multi();
      const userPreviousReaction = await this.getPreviousReactionsFromCache(response, userId);
      if (userPreviousReaction) {
        multi.LREM(`reaction:${key}`, 1, JSON.stringify(userPreviousReaction));
      }
      await multi.exec();
      await redisCache.client.HSET(`post:${key}`, 'reactions', JSON.stringify(postReaction));
    } catch (error) {
      throw new InternalException(`Server error: ${error}`);
    }
  }
  public async getReactionsFromCache(postId: string): Promise<[IReactionDocument[], number]> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      const reactionsCount: number = await redisCache.client.LLEN(`reaction:${postId}`);
      const response: string[] = await redisCache.client.LRANGE(`reaction:${postId}`, 0, -1);
      const list: IReactionDocument[] = [];
      for (const item of response) {
        list.push(Helpers.parseJson(item) as IReactionDocument);
      }
      const reactionsData: any = await Promise.all(
        list.map(async (comment: IReactionDocument) => {
          return { ...comment, user: await userCache.getFormattedUserResponse(`${comment.user}`) };
        })
      );
      return reactionsData.length ? [reactionsData, reactionsCount] : [[], 0];
    } catch (error) {
      throw new InternalException(`Server error: ${error}`);
    }
  }
  private async getPreviousReactionsFromCache(
    response: string[],
    userId: string
  ): Promise<IReactionDocument | undefined> {
    for (const item of response) {
      const reaction = Helpers.parseJson(item) as IReactionDocument;
      if (reaction.user === userId) {
        return reaction;
      }
    }
    return undefined;
  }
}

export const reactionCache: ReactionCache = new ReactionCache();
