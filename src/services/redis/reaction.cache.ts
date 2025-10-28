import { redisCache } from './redis.cache';
import { find } from 'lodash';
import { userCache } from './user.cache';
import { InternalException } from 'src/middlewares/globalErrorHandle';
import { IReaction, IReactionDocument } from 'src/interfaces/reaction.interface';
import { Helpers } from 'src/utils/helpers';

class ReactionCache {
  public async updatePostReactionsInCache(postId: string, postReactions: IReaction): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const postKey = `post:${postId}`;
      const postExists = await redisCache.client.EXISTS(postKey);
      if (!postExists) {
        console.log(`Post HASH ${postKey} không tồn tại khi cập nhật reactions.`);
        return;
      }
      await redisCache.client.HSET(postKey, 'reactions', JSON.stringify(postReactions));
    } catch (error: any) {
      console.log('Redis Failed', error);
    }
  }
}

export const reactionCache: ReactionCache = new ReactionCache();
