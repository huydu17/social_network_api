import {
  IDetailsInfo,
  INotificationSettings,
  ISeachUser,
  IUserDocument
} from 'src/features/users/interfaces/user.interface';
import { User } from 'src/features/users/models/user.schema';
import { userCache } from '../redis/user.cache';
import cloudinary from 'cloudinary';
import { UserPayload } from 'src/type';
import { postService } from './post.service';
import { IPostDocument } from 'src/features/posts/interfaces/post.interface';
import { TYPE_AVATAR, TYPE_COVER } from 'src/features/posts/constants/type-post';
import { BadRequestException } from 'src/shared/middlewares/globalErrorHandle';
import { cloudinaryService, UploadedFile } from './cloudinary.service';
import mongoose from 'mongoose';
import { IDeleteByType, INotificationDocument } from 'src/features/notifications/interfaces/notification.interface';
import { Notification } from 'src/features/notifications/models/notification.schema';
import { notificationService } from './notification.service';
import { NOTIFICATION_TYPES } from 'src/features/notifications/constants/notification.constant';

class UserService {
  public async findOne(userId: string) {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(userId)) as IUserDocument;
    const existingUser = cachedUser ? cachedUser : await this.getUserById(userId);
    return existingUser;
  }
  public async getUserList(userId: string, type: string, page: number = 1, limit: number = 10) {
    const usersFromCache = await userCache.getAllUsersFromCache(page, limit, type, userId);
    if (usersFromCache.length > 0) {
      return usersFromCache;
    }
    const user: any = await User.findById(userId)
      .select(`${type} -_id`)
      .populate(type, '_id firstName lastName avatar');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const start = (page - 1) * limit;
    const end = start + limit;
    return user[type].slice(start, end);
  }
  public async updateAvatar(file: UploadedFile, currentUser: UserPayload, text: string) {
    return await this.updateUserImage(file, currentUser, text, TYPE_AVATAR);
  }
  public async updateCover(file: UploadedFile, currentUser: UserPayload, text: string) {
    return await this.updateUserImage(file, currentUser, text, TYPE_COVER);
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
    await userCache.saveUserToCache(`${user._id}`, user);
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
  public async addFriend(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('You cant send a request to yourself');
    }
    const sender: IUserDocument = (await this.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await this.getUserById(userId)) as IUserDocument;
    if (!receiver.requests.includes(sender?._id.toString()) && !receiver.friends.includes(sender._id.toString())) {
      await receiver.updateOne({
        $push: { requests: sender._id }
      });
      await receiver.updateOne({
        $push: { follower: sender._id }
      });
      await sender.updateOne({
        $push: { following: receiver._id }
      });
      if (receiver.notifications.reactions && currentUser.userId !== sender._id) {
        const notificationModel: INotificationDocument = new Notification();
        const notification = await notificationModel.insertNotification({
          userTo: `${receiver._id}`,
          userFrom: `${sender._id}`,
          message: `${sender.firstName + ' ' + sender.lastName} sent you a friend request`,
          notificationType: NOTIFICATION_TYPES.ADD_FRIEND,
          entityId: new mongoose.Types.ObjectId(userId),
          createdItemId: null,
          comment: '',
          reaction: '',
          post: ''
        });
      }
      await userCache.saveUserToCache(`${sender._id}`, sender);
      await userCache.saveUserToCache(`${receiver._id}`, receiver);
    } else {
      throw new BadRequestException('Already sent');
    }
  }
  public async cancelRequest(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('You cant cancle a request to yourself');
    }
    const sender: IUserDocument = (await this.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await this.getUserById(userId)) as IUserDocument;
    if (receiver.requests.includes(sender._id.toString()) && !receiver.friends.includes(sender._id.toString())) {
      await receiver.updateOne({
        $pull: { requests: sender._id }
      });
      await receiver.updateOne({
        $pull: { follower: sender._id }
      });
      await sender.updateOne({
        $pull: { following: receiver._id }
      });
      const data: IDeleteByType = {
        userTo: `${receiver._id}`,
        userFrom: `${sender._id}`,
        notificationType: NOTIFICATION_TYPES.ADD_FRIEND
      };
      await notificationService.deleteNotificationByType(data);
      await userCache.saveUserToCache(`${sender._id}`, sender);
      await userCache.saveUserToCache(`${receiver._id}`, receiver);
    } else {
      throw new BadRequestException('Already canceled');
    }
  }
  public async follow(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('You cant follow a request to yourself');
    }
    const sender: IUserDocument = (await this.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await this.getUserById(userId)) as IUserDocument;
    if (!receiver.follower.includes(sender._id.toString()) && !sender.following.includes(receiver._id.toString())) {
      await sender.updateOne({
        $push: { following: receiver._id }
      });
      await receiver.updateOne({
        $push: { follower: sender._id }
      });
      if (receiver.notifications.reactions && currentUser.userId !== sender._id) {
        const notificationModel: INotificationDocument = new Notification();
        const notification = await notificationModel.insertNotification({
          userTo: `${receiver._id}`,
          userFrom: `${sender._id}`,
          message: `${sender.firstName + ' ' + sender.lastName} started following you`,
          notificationType: NOTIFICATION_TYPES.FOLLOW,
          entityId: new mongoose.Types.ObjectId(userId),
          createdItemId: null,
          comment: '',
          reaction: '',
          post: ''
        });
      }
      await userCache.saveUserToCache(`${sender._id}`, sender);
      await userCache.saveUserToCache(`${receiver._id}`, receiver);
    } else {
      throw new BadRequestException('Already followed');
    }
  }
  public async unfollow(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('You cant unfollow a request to yourself');
    }
    const sender: IUserDocument = (await this.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await this.getUserById(userId)) as IUserDocument;
    if (sender.following.includes(receiver._id.toString()) && receiver.follower.includes(sender._id.toString())) {
      await sender.updateOne({
        $pull: { following: receiver._id }
      });
      await receiver.updateOne({
        $pull: { follower: sender._id }
      });
      const data: IDeleteByType = {
        userTo: `${receiver._id}`,
        userFrom: `${sender._id}`,
        notificationType: NOTIFICATION_TYPES.FOLLOW
      };
      await notificationService.deleteNotificationByType(data);
      await userCache.saveUserToCache(`${sender._id}`, sender);
      await userCache.saveUserToCache(`${receiver._id}`, receiver);
    } else {
      throw new BadRequestException('Already not following');
    }
  }
  public async acceptFriend(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('You cant accept a request to yourself');
    }
    const receiver: IUserDocument = (await this.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const sender: IUserDocument = (await this.getUserById(userId)) as IUserDocument;
    if (
      !sender.friends.includes(receiver._id.toString()) &&
      !receiver.friends.includes(sender._id.toString()) &&
      receiver.requests.includes(sender._id.toString())
    ) {
      await sender.updateOne({
        $push: { friends: receiver._id }
      });
      await receiver.updateOne({
        $push: { friends: sender._id }
      });
      await receiver.updateOne({
        $pull: { requests: sender._id }
      });
      if (receiver.notifications.reactions && currentUser.userId !== sender._id) {
        const notificationModel: INotificationDocument = new Notification();
        const notification = await notificationModel.insertNotification({
          userTo: `${sender._id}`,
          userFrom: `${receiver._id}`,
          message: `${receiver.firstName + ' ' + receiver.lastName} accepted your friend request`,
          notificationType: NOTIFICATION_TYPES.ACCEPT_FRIEND,
          entityId: new mongoose.Types.ObjectId(userId),
          createdItemId: null,
          comment: '',
          reaction: '',
          post: ''
        });
      }
      await userCache.saveUserToCache(`${sender._id}`, sender);
      await userCache.saveUserToCache(`${receiver._id}`, receiver);
    } else if (!receiver.requests.includes(sender._id.toString())) {
      throw new BadRequestException('User has not submitted request yet');
    } else {
      throw new BadRequestException('Already friend');
    }
  }
  public async unfriend(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('You cant unfriend yourself');
    }
    const sender: IUserDocument = (await this.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await this.getUserById(userId)) as IUserDocument;
    if (sender.friends.includes(receiver._id.toString()) && receiver.friends.includes(sender._id.toString())) {
      await User.findByIdAndUpdate(
        { _id: sender._id },
        {
          $pull: { friends: receiver._id, following: receiver._id }
        },
        {
          new: true
        }
      );
      await User.findByIdAndUpdate(
        { _id: receiver._id },
        {
          $pull: { friends: sender._id, follower: sender._id }
        },
        {
          new: true
        }
      );
      await userCache.saveUserToCache(`${sender._id}`, sender);
      await userCache.saveUserToCache(`${receiver._id}`, receiver);
    } else {
      throw new BadRequestException('Already not friends');
    }
  }
  public async deleteRequest(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('You cant deleted yourself');
    }
    const receiver: IUserDocument = (await this.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const sender: IUserDocument = (await this.getUserById(userId)) as IUserDocument;
    if (receiver.requests.includes(sender._id.toString())) {
      await sender.updateOne({ $pull: { following: receiver._id } });
      await receiver.updateOne({ $pull: { follower: sender._id } });
      await receiver.updateOne({ $pull: { requests: sender._id } });
      await userCache.saveUserToCache(`${sender._id}`, sender);
      await userCache.saveUserToCache(`${receiver._id}`, receiver);
    } else {
      throw new BadRequestException('Already deleted');
    }
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
  public async addToSearchHistory(searchUser: string, currentUser: UserPayload) {
    const searchedUser = await this.getUserById(searchUser);
    if (!searchedUser) {
      throw new BadRequestException('Search user does not foud');
    }
    const search: ISeachUser = {
      user: searchUser,
      createAt: new Date()
    };
    const user: IUserDocument = (await this.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const checkUserInSearch = user.searchHistory.find((x) => x.user.toString() === searchUser);
    console.log(checkUserInSearch);
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

  public async getSuggestions() {}
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
  private async updateUserImage(file: UploadedFile, currentUser: UserPayload, text: string, type: string) {
    const image = await cloudinaryService.upload(file, 'users');
    const user: IUserDocument = (await this.getUserByEmail(currentUser.email)) as IUserDocument;
    if (type === TYPE_AVATAR) {
      user.avatar = image.url;
    } else if (type === TYPE_COVER) {
      user.bgImage = image.url;
    }
    const postData: IPostDocument = {
      text,
      images: image
    } as IPostDocument;
    await postService.create(postData, undefined, currentUser);
    await user.save();
    await userCache.saveUserToCache(`${user._id}`, user);
    return user;
  }
}
export const userService: UserService = new UserService();
