import { UserPayload } from 'src/type';
import { Reaction } from 'src/features/reactions/models/reaction.schema';
import { IReactionData, IReactionDocument } from 'src/features/reactions/interfaces/reaction.interface';
import { reactionCache } from '../redis/reaction.cache';
import mongoose from 'mongoose';
import { Post } from 'src/features/posts/models/post.schema';
import { BadRequestException } from 'src/shared/middlewares/globalErrorHandle';
import { IPostDocument } from 'src/features/posts/interfaces/post.interface';
import { userCache } from '../redis/user.cache';
import { IUserDocument } from 'src/features/users/interfaces/user.interface';
import { INotificationDocument } from 'src/features/notifications/interfaces/notification.interface';
import { Notification } from 'src/features/notifications/models/notification.schema';
import { NOTIFICATION_TYPES } from 'src/features/notifications/constants/notification.constant';
class ReactionService {
  public async create(data: IReactionData, currentUser: UserPayload) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { type, postId, userTo, previousReaction } = data;
      let reactExisting = await Reaction.findOne({ postId, user: currentUser.userId }).session(session);
      let updatedReact: any;
      if (reactExisting) {
        if (reactExisting.type !== type) {
          reactExisting.type = type;
          updatedReact = await reactExisting.save({ session });
        } else {
          await session.commitTransaction();
          session.endSession();
          return reactExisting;
        }
      } else {
        updatedReact = await Reaction.create({ type, postId, user: currentUser.userId });
      }
      const updatePost: IPostDocument = (await Post.findByIdAndUpdate(
        postId,
        {
          $inc: {
            [`reactions.${previousReaction}`]: reactExisting ? -1 : 0,
            [`reactions.${type}`]: 1
          }
        },
        { new: true, session }
      )) as IPostDocument;
      if (!updatePost) {
        throw new BadRequestException(`Post not found or already updated.`);
      }
      await session.commitTransaction();
      session.endSession();
      await reactionCache.savePostReactionToCache(
        `${postId}`,
        updatedReact._doc,
        updatePost?.reactions,
        type,
        previousReaction
      );
      const user: IUserDocument = (await userCache.getUserFromCache(`${userTo}`)) as IUserDocument;
      if (user.notifications.reactions && currentUser.userId !== userTo) {
        const notificationModel: INotificationDocument = new Notification();
        const notification = await notificationModel.insertNotification({
          userTo: userTo,
          userFrom: `${currentUser.userId}`,
          message: `${currentUser.firstName + ' ' + currentUser.lastName} reacted to your post`,
          notificationType: NOTIFICATION_TYPES.REACT,
          entityId: new mongoose.Types.ObjectId(`${postId}`),
          createdItemId: new mongoose.Types.ObjectId(`${updatedReact._id}`),
          comment: '',
          reaction: type,
          post: updatePost.text
        });
      }
      return updatedReact;
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      throw new BadRequestException(`Error processing reaction: ${error.message}`);
    }
  }
  public async remove(postId: string, previousReaction: string, currentUser: UserPayload) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Reaction.deleteOne({ postId, type: previousReaction, user: currentUser.userId }).session(session);

      const updatePost: IPostDocument | null = (await Post.findByIdAndUpdate(
        postId,
        { $inc: { [`reactions.${previousReaction}`]: -1 } },
        { new: true, session }
      )) as IPostDocument | null;

      if (!updatePost) {
        throw new BadRequestException(`Post not found or already updated.`);
      }
      await session.commitTransaction();
      await reactionCache.removePostReactionFromCache(`${postId}`, `${currentUser.userId}`, updatePost.reactions);
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      throw new BadRequestException(`Error processing reaction: ${error.message}`);
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
