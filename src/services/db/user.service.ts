import { userCache } from '../redis/user.cache';
import { UserPayload } from 'src/type';
import { cloudinaryService, UploadedFile } from './cloudinary.service';
import mongoose from 'mongoose';
import { socketUserIO } from '../sockets/user.socket';
import {
  IDetailsInfo,
  INotificationSettings,
  ISeachUser,
  IUserDocument,
  UserReadStatusCache
} from 'src/interfaces/user.interface';
import { User } from 'src/models/user.schema';
import { BadRequestException } from 'src/middlewares/globalErrorHandle';
import { TYPE_AVATAR, TYPE_COVER } from 'src/constants/type-post';

class UserService {
  public async findOne(userId: string) {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(userId)) as IUserDocument;
    const existingUser = cachedUser ? cachedUser : await this.getUserById(userId);
    return existingUser;
  }
  public async getUserList(userId: string, type: string, page: number, limit: number) {
    let userList: IUserDocument[] = [];
    let totalUsers = 0;
    const limtOption: number = type === 'follower' ? 21 : limit;
    if (type === 'all') {
      const currentUser = await User.findById(userId).select('following');
      if (!currentUser) {
        throw new BadRequestException('Không tìm thấy người dùng');
      }
      const excludeIds = [userId, ...currentUser.following];
      const query = {
        _id: { $nin: excludeIds }
      };
      userList = await User.find(query).select('_id firstName lastName avatar following follower');
      totalUsers = await User.countDocuments(query);
    } else {
      const usersFromCache: any = await userCache.getAllUsersFromCache(page, limtOption, type, userId);
      if (usersFromCache.totalUsers > 0) {
        return usersFromCache;
      }
      const user: any = await User.findById(userId)
        .select(`${type} -_id`)
        .populate(type, '_id firstName lastName avatar following follower');
      if (!user) {
        throw new BadRequestException('Không tìm thấy người dùng');
      }
      userList = user[type];
      totalUsers = user[type].length;
    }
    const start = (page - 1) * limtOption;
    const end = start + limtOption;
    userList = userList.slice(start, end);
    return {
      userList,
      totalUsers
    };
  }

  public async updateAvatar(file: UploadedFile, currentUser: UserPayload) {
    return await this.updateUserImage(file, currentUser, TYPE_AVATAR);
  }
  public async updateCover(file: UploadedFile, currentUser: UserPayload) {
    return await this.updateUserImage(file, currentUser, TYPE_COVER);
  }

  public async updateDetails(detailsInfo: IDetailsInfo, currentUser: UserPayload): Promise<IUserDocument> {
    const user: IUserDocument = (await User.findByIdAndUpdate(
      { _id: currentUser.userId },
      {
        details: detailsInfo
      },
      {
        new: true
      }
    )) as IUserDocument;
    await userCache.saveUserToCache(user._id.toString(), user);
    return user;
  }
  public async updateNotificationSettings(currentUser: UserPayload, notificationSettings: INotificationSettings) {
    const user: IUserDocument = (await User.findByIdAndUpdate(
      { _id: currentUser.userId },
      {
        notifications: notificationSettings
      },
      {
        new: true
      }
    )) as IUserDocument;
    await userCache.saveUserToCache(`${user._id}`, user);
  }
  public async search(searchTerm: string) {
    const users: IUserDocument[] | null = await User.find({
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { userName: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('firstName lastName avatar userName');
    return users;
  }
  public async updateMessaageStatus(receiverId: string) {
    const data: UserReadStatusCache = (await userCache.updateMessageStatusFromCache(
      `${receiverId}`,
      true
    )) as UserReadStatusCache;
  }
  public async getNotificationStatus(userId: string) {
    return await userCache.getStatusFromCache(`${userId}`, 'notification');
  }
  public async updateNotificationStatus(receiverId: string) {
    const data: UserReadStatusCache = (await userCache.updateNotificationStatusFromCache(
      `${receiverId}`,
      true
    )) as UserReadStatusCache;
    socketUserIO?.emit('notification-status', data);
  }
  public async getMessageStatus(userId: string) {
    return await userCache.getStatusFromCache(`${userId}`, 'message');
  }
  public async addToSearchHistory(searchUser: string, currentUser: UserPayload) {
    const searchedUser = await this.getUserById(searchUser);
    if (!searchedUser) {
      throw new BadRequestException('Không tìm thấy người dùng được tìm kiếm');
    }
    const search: ISeachUser = {
      user: searchUser,
      createAt: new Date()
    };
    const user: IUserDocument = (await this.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const checkUserInSearch = user.searchHistory.find((x) => x.user.toString() === searchUser);
    if (checkUserInSearch) {
      await User.updateOne(
        {
          _id: currentUser.userId,
          'searchHistory._id': checkUserInSearch._id
        },
        {
          $set: { 'searchHistory.$.createAt': new Date() }
        }
      );
    } else {
      await User.updateOne(
        {
          _id: currentUser.userId
        },
        {
          $push: {
            searchHistory: search
          }
        }
      );
    }
  }
  public async getSearchHistory(currentUser: UserPayload) {
    const results = await User.findById(currentUser.userId)
      .select('searchHistory')
      .populate('searchHistory.user', 'fistName lastName avatar');
    return results;
  }
  public async removeFromSearch(searchUser: string, currentUser: UserPayload) {
    await User.updateOne(
      {
        _id: currentUser.userId
      },
      {
        $pull: {
          searchHistory: searchUser
        }
      }
    );
  }
  public async getRandomUsers(userId: string) {
    const user: IUserDocument = (await this.getUserById(userId)) as IUserDocument;
    const followingIds = [userId, ...user?.following];
    const randomUsers = await User.aggregate([
      {
        $match: {
          _id: {
            $ne: new mongoose.Types.ObjectId(userId),
            $nin: followingIds
          }
        }
      },
      { $sample: { size: 5 } },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          avatar: 1
        }
      }
    ]);
    return randomUsers;
  }
  public async getUserById(id: string) {
    const user = await User.findById({ _id: id });
    return user;
  }
  public async getUserByEmail(email: string) {
    const user = await User.findOne({ email });
    return user;
  }
  public async getUserByUserName(userName: string) {
    const user = User.findOne({ userName });
    return user;
  }
  public async getUserByEmailOrUsername(emailOrUsername: string) {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { userName: emailOrUsername }]
    }).exec();
    return user;
  }
  private async updateUserImage(file: UploadedFile, currentUser: UserPayload, type: string) {
    const image = await cloudinaryService.upload(file, 'users');
    const user: IUserDocument = (await this.getUserByEmail(currentUser.email)) as IUserDocument;
    if (type === TYPE_AVATAR) {
      user.avatar = image.url;
    } else if (type === TYPE_COVER) {
      user.bgImage = image.url;
    }
    await user.save();
    await userCache.saveUserToCache(`${user._id}`, user);
    return user;
  }
}
export const userService: UserService = new UserService();
