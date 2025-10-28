import { IUserDocument, IUserSummary, UserReadStatusCache } from 'src/interfaces/user.interface';
import { redisCache } from './redis.cache';
import { BadRequestException, InternalException } from 'src/middlewares/globalErrorHandle';
import { Helpers } from 'src/utils/helpers';

class UserCache {
  public async saveUserToCache(key: string, createdUser: IUserDocument): Promise<void | null> {
    const {
      _id,
      firstName,
      lastName,
      userName,
      email,
      avatar,
      bYear,
      bMonth,
      bDay,
      gender,
      verified,
      bgImage,
      friends,
      following,
      follower,
      requests,
      notifications,
      searchHistory,
      details,
      createdAt
    } = createdUser;
    const dataToSave = {
      _id: `${_id}`,
      firstName: `${firstName}`,
      lastName: `${lastName}`,
      userName: `${userName}`,
      email: `${email}`,
      avatar: `${avatar}`,
      bYear: `${bYear}`,
      bMonth: `${bMonth}`,
      bDay: `${bDay}`,
      gender: `${gender}`,
      verified: `${verified}`,
      bgImage: `${bgImage}`,
      friends: `${JSON.stringify(friends)}`,
      following: `${JSON.stringify(following)}`,
      follower: `${JSON.stringify(follower)}`,
      requests: `${JSON.stringify(requests)}`,
      notifications: `${JSON.stringify(notifications)}`,
      searchHistory: `${JSON.stringify(searchHistory)}`,
      details: `${JSON.stringify(details)}`,
      createdAt: `${createdAt}`
    };
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      await redisCache.client.HSET(`user:${key}`, dataToSave);
    } catch (error) {
      console.log('Redis failed:', error);
      return null;
    }
  }
  public async updateRelationsUserCache(
    userId: string,
    field: string,
    action: 'add' | 'remove' | 'update',
    targetUserId: string
  ) {
    try {
      const userKey = `user:${userId}`;
      const fieldData = await redisCache.client.HGET(userKey, field);
      if (fieldData === null) {
        return null;
      }
      let relations = fieldData ? JSON.parse(fieldData) : [];
      if (action === 'add') {
        relations = [...new Set([...relations, targetUserId])];
      } else if (action === 'remove') {
        relations = relations.filter((id: string) => id !== targetUserId);
      }
      await redisCache.client.HSET(userKey, field, JSON.stringify(relations));
    } catch (error) {
      console.warn('Redis failed:', error);
      return null;
    }
  }
  public async getUserFromCache(key: string) {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const userCache: IUserDocument = (await redisCache.client.HGETALL(`user:${key}`)) as unknown as IUserDocument;
      if (!userCache || Object.keys(userCache).length === 0) {
        return null;
      }
      const parsedUser: IUserDocument = {
        ...userCache,
        _id: userCache._id,
        friends: Helpers.parseJson(`${userCache.friends}`),
        following: Helpers.parseJson(`${userCache.following}`),
        follower: Helpers.parseJson(`${userCache.follower}`),
        requests: Helpers.parseJson(`${userCache.requests}`),
        notifications: Helpers.parseJson(`${userCache.notifications}`),
        searchHistory: Helpers.parseJson(`${userCache.searchHistory}`),
        details: Helpers.parseJson(`${userCache.details}`),
        createdAt: new Date(Helpers.parseJson(`${userCache.createdAt}`)) as Date
      } as IUserDocument;
      delete (parsedUser as any).password;
      return parsedUser;
    } catch (error) {
      console.log('Redis failed:', error);
      return null;
    }
  }

  public async getFormattedUserResponse(userId: string): Promise<IUserSummary | null> {
    const user = await userCache.getUserFromCache(userId);
    if (!user) {
      return null;
    }
    return {
      _id: `${user._id}`,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar
    };
  }

  public async updateMessageStatusFromCache(userId: string, hasViewed: boolean) {
    const data: UserReadStatusCache = {
      userId: userId,
      hasViewed: hasViewed
    } as UserReadStatusCache;
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      await redisCache.client.LPUSH(`status-message:${userId}`, JSON.stringify(data));
      await redisCache.client.LTRIM(`status-message:${userId}`, 0, 0);
      return await this.getStatusFromCache(userId, 'message');
    } catch (error) {
      console.log('Redis failed:', error);
      return null;
    }
  }

  public async updateNotificationStatusFromCache(userId: string, hasViewed: boolean) {
    const data: UserReadStatusCache = {
      userId: userId,
      hasViewed: hasViewed
    } as UserReadStatusCache;
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      await redisCache.client.LPUSH(`status-notification:${userId}`, JSON.stringify(data));
      await redisCache.client.LTRIM(`status-notification:${userId}`, 0, 0);
      return await this.getStatusFromCache(userId, 'notification');
    } catch (error) {
      console.log('Redis failed:', error);
      return null;
    }
  }

  public async getStatusFromCache(key: string, type: string) {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const cachedData = await redisCache.client.LRANGE(`status-${type}:${key}`, 0, 0);
      if (!cachedData || cachedData.length === 0) {
        return null;
      }
      const parseData = JSON.parse(cachedData[0]);
      return parseData as UserReadStatusCache;
    } catch (error) {
      console.log('Redis failed:', error);
      return null;
    }
  }
}

export const userCache: UserCache = new UserCache();
