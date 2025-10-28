import { IUserDocument, UserReadStatusCache } from 'src/interfaces/user.interface';
import { BadRequestException } from 'src/middlewares/globalErrorHandle';
import { userService } from './user.service';
import { UserPayload } from 'src/type';
import { notificationService } from './notification.service';
import { NOTIFICATION_TYPES } from 'src/constants/notification.constant';
import mongoose from 'mongoose';
import { userCache } from '../redis/user.cache';
import { IDeleteByType } from 'src/interfaces/notification.interface';
import { Helpers } from 'src/utils/helpers';
import { socketNotificationIO } from '../sockets/notification.socket';
import { socketUserIO } from '../sockets/user.socket';
import { redisCache } from '../redis/redis.cache';

class FollowerService {
  public async addFriend(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('Bạn không thể gửi yêu cầu kết bạn cho chính mình');
    }
    const sender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await userService.getUserById(userId)) as IUserDocument;
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
        const notification = await notificationService.create({
          userTo: `${receiver._id}`,
          userFrom: `${sender._id}`,
          message: `${sender.firstName + ' ' + sender.lastName} đã gửi bạn một yêu cầu kết bạn`,
          notificationType: NOTIFICATION_TYPES.ADD_FRIEND,
          entityId: new mongoose.Types.ObjectId(userId),
          createdItemId: null,
          comment: '',
          reaction: '',
          post: ''
        });
      }
      await Promise.all([
        userCache.updateRelationsUserCache(`${receiver._id}`, 'requests', 'add', `${sender._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'follower', 'add', `${sender._id}`),
        userCache.updateRelationsUserCache(`${sender._id}`, 'following', 'add', `${receiver._id}`)
      ]);
      await redisCache.del([
        `user:list:${receiver._id}:requests:page:1`,
        `user:list:${receiver._id}:follower:page:1`,
        `user:list:${sender._id}:following:page:1`
      ]);
      const updatedSender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
      return updatedSender;
    } else {
      throw new BadRequestException('Yêu cầu đã được gửi');
    }
  }
  public async cancelRequest(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('Bạn không thể hủy yêu cầu kết bạn cho chính mình');
    }
    const sender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await userService.getUserById(userId)) as IUserDocument;
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
      await Promise.all([
        userCache.updateRelationsUserCache(`${receiver._id}`, 'requests', 'remove', `${sender._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'follower', 'remove', `${sender._id}`),
        userCache.updateRelationsUserCache(`${sender._id}`, 'following', 'remove', `${receiver._id}`)
      ]);
      await redisCache.del([
        `user:list:${receiver._id}:requests:page:1`,
        `user:list:${receiver._id}:follower:page:1`,
        `user:list:${sender._id}:following:page:1`
      ]);
      const updatedSender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
      return updatedSender;
    } else {
      throw new BadRequestException('Yêu cầu đã được hủy');
    }
  }
  public async follow(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('Bạn không thể theo dõi chính mình');
    }
    const sender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await userService.getUserById(userId)) as IUserDocument;
    if (!receiver.follower.includes(sender._id.toString()) && !sender.following.includes(receiver._id.toString())) {
      await sender.updateOne({
        $push: { following: receiver._id }
      });
      await receiver.updateOne({
        $push: { follower: sender._id }
      });
      if (receiver.notifications.reactions && currentUser.userId !== sender._id) {
        const notification = await notificationService.create({
          userTo: `${receiver._id}`,
          userFrom: `${sender._id}`,
          message: `${sender.firstName + ' ' + sender.lastName} đã theo dõi bạn`,
          notificationType: NOTIFICATION_TYPES.FOLLOW,
          entityId: new mongoose.Types.ObjectId(userId),
          createdItemId: null,
          comment: '',
          reaction: '',
          post: ''
        });
        const formattedData = Helpers.formattedNotification(notification, currentUser);
        const data: UserReadStatusCache = (await userCache.updateNotificationStatusFromCache(
          `${receiver._id}`,
          false
        )) as UserReadStatusCache;
        socketNotificationIO.emit('add-notification', formattedData);
        socketUserIO?.to(sender._id.toString()).to(receiver._id.toString()).emit('notification-status', data);
      }
      await Promise.all([
        userCache.updateRelationsUserCache(`${sender._id}`, 'following', 'add', `${receiver._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'follower', 'add', `${sender._id}`)
      ]);
      await redisCache.del([`user:list:${sender._id}:following:page:1`, `user:list:${receiver._id}:follower:page:1`]);
      const updatedSender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
      return updatedSender;
    } else {
      throw new BadRequestException('Đã theo dõi người dùng này');
    }
  }
  public async unfollow(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('Bạn không thể bỏ theo dõi chính mình');
    }
    const sender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await userService.getUserById(userId)) as IUserDocument;
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
      await Promise.all([
        userCache.updateRelationsUserCache(`${sender._id}`, 'following', 'remove', `${receiver._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'follower', 'remove', `${sender._id}`)
      ]);
      await redisCache.del([`user:list:${sender._id}:following:page:1`, `user:list:${receiver._id}:follower:page:1`]);
      const updatedSender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
      return updatedSender;
    } else {
      throw new BadRequestException('Chưa theo dõi người dùng này');
    }
  }
  public async acceptFriend(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('Bạn không thể chấp nhận yêu cầu kết bạn của chính mình');
    }
    const receiver: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const sender: IUserDocument = (await userService.getUserById(userId)) as IUserDocument;
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
        const notification = await notificationService.create({
          userTo: `${sender._id}`,
          userFrom: `${receiver._id}`,
          message: `${receiver.firstName + ' ' + receiver.lastName} đã chấp nhận yêu cầu kết bạn của bạn`,
          notificationType: NOTIFICATION_TYPES.ACCEPT_FRIEND,
          entityId: new mongoose.Types.ObjectId(userId),
          createdItemId: null,
          comment: '',
          reaction: '',
          post: ''
        });
      }
      await Promise.all([
        userCache.updateRelationsUserCache(`${sender._id}`, 'friends', 'add', `${receiver._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'friends', 'add', `${sender._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'requests', 'remove', `${sender._id}`)
      ]);
      await redisCache.del([
        `user:list:${sender._id}:friends:page:1`,
        `user:list:${receiver._id}:friends:page:1`,
        `user:list:${receiver._id}:requests:page:1`
      ]);
      const updatedSender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
      return updatedSender;
    } else if (!receiver.requests.includes(sender._id.toString())) {
      throw new BadRequestException('Người dùng chưa gửi yêu cầu kết bạn');
    } else {
      throw new BadRequestException('Đã là bạn bè');
    }
  }
  public async unfriend(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('Bạn không thể hủy kết bạn với chính mình');
    }
    const sender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const receiver: IUserDocument = (await userService.getUserById(userId)) as IUserDocument;
    if (sender.friends.includes(receiver._id.toString()) && receiver.friends.includes(sender._id.toString())) {
      await sender.updateOne({
        $pull: { friends: receiver._id, following: receiver._id }
      });
      await receiver.updateOne({
        $pull: { friends: sender._id, follower: sender._id }
      });
      await Promise.all([
        userCache.updateRelationsUserCache(`${sender._id}`, 'friends', 'remove', `${receiver._id}`),
        userCache.updateRelationsUserCache(`${sender._id}`, 'following', 'remove', `${receiver._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'friends', 'remove', `${sender._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'follower', 'remove', `${sender._id}`)
      ]);
      await redisCache.del([
        `user:list:${sender._id}:friends:page:1`,
        `user:list:${sender._id}:following:page:1`,
        `user:list:${receiver._id}:friends:page:1`,
        `user:list:${receiver._id}:follower:page:1`
      ]);
      const updatedSender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
      return updatedSender;
    } else {
      throw new BadRequestException('Chưa là bạn bè');
    }
  }
  public async deleteRequest(userId: string, currentUser: UserPayload) {
    if (userId === currentUser.userId) {
      throw new BadRequestException('Bạn không thể xóa yêu cầu của chính mình');
    }
    const receiver: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const sender: IUserDocument = (await userService.getUserById(userId)) as IUserDocument;
    if (receiver.requests.includes(sender._id.toString())) {
      await sender.updateOne({ $pull: { following: receiver._id } });
      await receiver.updateOne({ $pull: { follower: sender._id } });
      await receiver.updateOne({ $pull: { requests: sender._id } });
      await Promise.all([
        userCache.updateRelationsUserCache(`${sender._id}`, 'following', 'remove', `${receiver._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'follower', 'remove', `${sender._id}`),
        userCache.updateRelationsUserCache(`${receiver._id}`, 'requests', 'remove', `${sender._id}`)
      ]);
      await redisCache.del([
        `user:list:${sender._id}:following:page:1`,
        `user:list:${receiver._id}:follower:page:1`,
        `user:list:${receiver._id}:requests:page:1`
      ]);
      const updatedSender: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
      return updatedSender;
    } else {
      throw new BadRequestException('Yêu cầu đã được xóa');
    }
  }
}

export const followerService: FollowerService = new FollowerService();
