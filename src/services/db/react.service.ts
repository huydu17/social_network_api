import { UserPayload } from 'src/type';
import { reactionCache } from '../redis/reaction.cache';
import mongoose from 'mongoose';
import { userCache } from '../redis/user.cache';
import { socketNotificationIO } from '../sockets/notification.socket';
import { notificationService } from './notification.service';
import { socketUserIO } from '../sockets/user.socket';
import { IReactionData, IReactionDocument } from 'src/interfaces/reaction.interface';
import { Helpers } from 'src/utils/helpers';
import { NOTIFICATION_TYPES } from 'src/constants/notification.constant';
import { Reaction } from 'src/models/reaction.schema';
import { IPostDocument } from 'src/interfaces/post.interface';
import { Post } from 'src/models/post.schema';
import { BadRequestException } from 'src/middlewares/globalErrorHandle';
import { IUserDocument, UserReadStatusCache } from 'src/interfaces/user.interface';

class ReactionService {
  public async create(data: IReactionData, currentUser: UserPayload) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { type, postId, userTo, previousReaction } = data;
      const toEngReaction = Helpers.toEnglishReaction(type) as string;
      const toEngPrevReaction = Helpers.toEnglishReaction(previousReaction) as string;
      let reactExisting = await Reaction.findOne({ postId, user: currentUser.userId }).session(session);
      let updatedReact: any;
      if (reactExisting) {
        if (reactExisting.type !== type) {
          if (currentUser.userId !== userTo) {
            try {
              await notificationService.deleteNotificationByType({
                userTo: userTo,
                userFrom: `${currentUser.userId}`,
                notificationType: NOTIFICATION_TYPES.REACT,
                createdItemId: `${reactExisting._id}`
              });
            } catch (error) {
              console.error('Không thể xóa thông báo cũ:', error);
            }
          }
          reactExisting.type = type;
          updatedReact = await reactExisting.save({ session });
        } else {
          await session.commitTransaction();
          return reactExisting;
        }
      } else {
        updatedReact = await Reaction.create([{ type, postId, user: currentUser.userId }], { session });
        updatedReact = updatedReact[0];
      }
      const updatePost: IPostDocument = (await Post.findByIdAndUpdate(
        postId,
        {
          $inc: {
            [`reactions.${toEngPrevReaction}`]: reactExisting ? -1 : 0,
            [`reactions.${toEngReaction}`]: 1
          }
        },
        { new: true, session }
      )) as IPostDocument;

      if (!updatePost) {
        throw new BadRequestException('Không tìm thấy bài viết hoặc bài viết đã được cập nhật.');
      }
      await session.commitTransaction();
      try {
        await reactionCache.savePostReactionToCache(
          `${postId}`,
          updatedReact._doc || updatedReact,
          updatePost?.reactions,
          type,
          toEngPrevReaction
        );
        const user: IUserDocument = (await userCache.getUserFromCache(`${userTo}`)) as IUserDocument;
        if (user?.notifications?.reactions && currentUser.userId !== userTo) {
          const notification = await notificationService.create({
            userTo: userTo,
            userFrom: `${currentUser.userId}`,
            message: `${currentUser.firstName + ' ' + currentUser.lastName} đã bày tỏ cảm xúc về bài viết của bạn.`,
            notificationType: NOTIFICATION_TYPES.REACT,
            entityId: new mongoose.Types.ObjectId(`${postId}`),
            createdItemId: new mongoose.Types.ObjectId(`${updatedReact._id}`),
            comment: '',
            reaction: type,
            post: updatePost.text
          });
          const formattedData = Helpers.formattedNotification(notification, currentUser);
          const data: UserReadStatusCache = (await userCache.updateNotificationStatusFromCache(
            `${userTo}`,
            false
          )) as UserReadStatusCache;
          socketNotificationIO.emit('add-notification', formattedData);
          socketUserIO?.to(currentUser.userId.toString()).to(userTo.toString()).emit('notification-status', data);
        }
      } catch (postCommitError) {
        console.error('Thao tác sau khi commit thất bại:', postCommitError);
      }
      return { updatedReact, postReactions: updatePost.reactions };
    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw new BadRequestException(`Lỗi khi xử lý phản ứng: ${error.message}`);
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }
  public async remove(postId: string, previousReaction: string, currentUser: UserPayload) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const existingReaction = await Reaction.findOne({
        postId,
        type: previousReaction,
        user: currentUser.userId
      }).session(session);
      if (!existingReaction) {
        await session.commitTransaction();
        const post = await Post.findById(postId).session(session);
        return { postReactions: post?.reactions || {} };
      }
      await Reaction.deleteOne({
        postId,
        type: previousReaction,
        user: currentUser.userId
      }).session(session);
      const toEngType = Helpers.toEnglishReaction(previousReaction);
      const updatePost: IPostDocument | null = (await Post.findByIdAndUpdate(
        postId,
        { $inc: { [`reactions.${toEngType}`]: -1 } },
        { new: true, session }
      )) as IPostDocument | null;

      if (!updatePost) {
        throw new BadRequestException('Không tìm thấy bài viết hoặc bài viết đã được cập nhật.');
      }
      await session.commitTransaction();
      try {
        await reactionCache.removePostReactionFromCache(`${postId}`, `${currentUser.userId}`, updatePost.reactions);
      } catch (cacheError) {
        console.error('Thao tác bộ nhớ cache thất bại sau khi xóa phản ứng:', cacheError);
      }
      try {
        if (updatePost.user.toString() !== currentUser.userId) {
          await notificationService.deleteNotificationByType({
            userTo: `${updatePost.user}`,
            userFrom: `${currentUser.userId}`,
            notificationType: NOTIFICATION_TYPES.REACT,
            createdItemId: `${existingReaction._id}`
          });
          socketNotificationIO.emit('delete-notification', existingReaction?._id);
        }
      } catch (error) {
        console.error('Không thể xóa thông báo:', error);
      }
      return { postReactions: updatePost.reactions };
    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw new BadRequestException(`Lỗi khi xóa phản ứng: ${error.message}`);
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  public async getAll(postId: string) {
    const reactionsFromCache: [IReactionDocument[], number] = await reactionCache.getReactionsFromCache(`${postId}`);
    const reactions = reactionsFromCache[0].length
      ? reactionsFromCache[0]
      : await Reaction.find({ postId }, { createdAt: -1 }).populate('user', 'firstName lastName avatar');
    return { reactions, count: reactions.length };
  }
}

export const reactionService: ReactionService = new ReactionService();
