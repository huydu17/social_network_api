import { IUserDocument, IUserSummary, UserReadStatusCache } from 'src/interfaces/user.interface';
import { redisCache } from './redis.cache';
import { BadRequestException, InternalException } from 'src/middlewares/globalErrorHandle';
import { Helpers } from 'src/utils/helpers';

class UserCache {
  public async saveUserToCache(key: string, createdUser: IUserDocument): Promise<void> {
    const {
      _id,
      firstName,
      lastName,
      userName,
      email,
      password,
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
      password: `${password}`,
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
        redisCache.connect();
      }
      await redisCache.client.ZADD('users', { score: Date.now(), value: `${key}` });
      await redisCache.client.HSET(`user:${key}`, dataToSave);
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
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
      let relations = fieldData ? JSON.parse(fieldData) : [];
      if (action === 'add') {
        relations = [...new Set([...relations, targetUserId])];
      } else if (action === 'remove') {
        relations = relations.filter((id: string) => id !== targetUserId);
      }
      await redisCache.client.HSET(userKey, field, JSON.stringify(relations));
    } catch (error) {
      throw new InternalException(`Lỗi cập nhật Redis: ${error}`);
    }
  }

  public async getUserFromCache(key: string) {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
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
      return parsedUser;
    } catch (error) {
      throw new InternalException('Lỗi máy chủ. Vui lòng thử lại');
    }
  }

  public async getAllUsersFromCache(
    page: number = 1,
    limit: number = 10,
    type: string,
    userId: string
  ): Promise<IUserDocument[]> {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      const reply: string[] = await redisCache.client.ZRANGE('users', 0, -1, { REV: true });
      const multi: ReturnType<typeof redisCache.client.multi> = redisCache.client.multi();
      for (const value of reply) {
        multi.HGETALL(`user:${value}`);
      }
      const replies: any = await multi.exec();
      if (!replies) {
        return [];
      }
      const normalizedUsers = replies.map((user: any) => Object.assign({}, user));
      let userList: IUserDocument[] = [];
      let totalUsers = 0;
      const userFound = normalizedUsers.find((user: any) => user._id === userId);
      if (userFound) {
        const userIds = Helpers.parseJson(userFound[type]);
        const usersData = await Promise.all(
          userIds.map(async (value: string) => {
            const user: any = await this.getUserFromCache(value);
            return {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar,
              following: user.following,
              follower: user.follower
            };
          })
        );
        userList = usersData;
        totalUsers = usersData.length;
      }
      const start = (page - 1) * limit;
      const end = start + limit;
      const data: any = {
        userList: userList.slice(start, end),
        totalUsers
      };
      return data;
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
    }
  }

  public async getFormattedUserResponse(userId: string): Promise<IUserSummary> {
    const user = await userCache.getUserFromCache(userId);
    if (!user) {
      throw new BadRequestException(`Không tìm thấy người dùng`);
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
        redisCache.connect();
      }
      await redisCache.client.LPUSH(`status-message:${userId}`, JSON.stringify(data));
      await redisCache.client.LTRIM(`status-message:${userId}`, 0, 0);
      return await this.getStatusFromCache(userId, 'message');
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
    }
  }

  public async updateNotificationStatusFromCache(userId: string, hasViewed: boolean) {
    const data: UserReadStatusCache = {
      userId: userId,
      hasViewed: hasViewed
    } as UserReadStatusCache;
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      await redisCache.client.LPUSH(`status-notification:${userId}`, JSON.stringify(data));
      await redisCache.client.LTRIM(`status-notification:${userId}`, 0, 0);
      return await this.getStatusFromCache(userId, 'notification');
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
    }
  }

  public async getStatusFromCache(key: string, type: string) {
    try {
      if (!redisCache.client.isOpen) {
        redisCache.connect();
      }
      const cachedData = await redisCache.client.LRANGE(`status-${type}:${key}`, 0, 0);
      if (!cachedData || cachedData.length === 0) {
        return null;
      }
      const parseData = JSON.parse(cachedData[0]);
      return parseData as UserReadStatusCache;
    } catch (error) {
      throw new InternalException(`Lỗi máy chủ: ${error}`);
    }
  }
}

export const userCache: UserCache = new UserCache();
