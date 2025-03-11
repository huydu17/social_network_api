import { IUserDocument, IUserSummary } from 'src/features/users/interfaces/user.interface';
import { redisCache } from './redis.cache';
import { BadRequestException, InternalException } from 'src/shared/middlewares/globalErrorHandle';
import { Helpers } from 'src/shared/utils/helpers';

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
      bYeard: `${bYear}`,
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
      throw new InternalException(`Server error: ${error}`);
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
      throw new InternalException('Server error. Try again');
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
              avatar: user.avatar
            };
          })
        );
        userList = usersData;
      }
      const start = (page - 1) * limit;
      const end = start + limit;
      return userList.slice(start, end);
    } catch (error) {
      throw new InternalException(`Server error: ${error}`);
    }
  }
  public async getFormattedUserResponse(userId: string): Promise<IUserSummary> {
    const user = await userCache.getUserFromCache(userId);
    if (!user) {
      throw new BadRequestException(`User not found)`);
    }
    return {
      _id: `${user._id}`,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar
    };
  }
}

export const userCache: UserCache = new UserCache();
