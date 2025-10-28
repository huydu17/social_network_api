import { UserPayload } from 'src/type';
import { commentCache } from '../redis/comment.cache';
import mongoose from 'mongoose';
import { userCache } from '../redis/user.cache';
import { socketNotificationIO } from '../sockets/notification.socket';
import { notificationService } from './notification.service';
import { socketUserIO } from '../sockets/user.socket';
import { ICommentData } from 'src/interfaces/comment.interface';
import { IPostDocument } from 'src/interfaces/post.interface';
import { Comment } from 'src/models/comment.schema';
import { Post } from 'src/models/post.schema';
import { BadRequestException } from 'src/middlewares/globalErrorHandle';
import { IUserDocument, UserReadStatusCache } from 'src/interfaces/user.interface';
import { NOTIFICATION_TYPES } from 'src/constants/notification.constant';
import { Helpers } from 'src/utils/helpers';
import { redisCache } from '../redis/redis.cache';
import { userService } from './user.service';

class CommentSerice {
  public async create(data: ICommentData, currentUser: UserPayload) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { postId, content, userTo } = data;
      const comment: any = await Comment.create({ postId, content, user: currentUser.userId });
      const updatePost: IPostDocument = (await Post.findByIdAndUpdate(
        { _id: postId },
        { $inc: { commentsCount: 1 } },
        { new: true, session }
      )) as IPostDocument;
      if (!updatePost) {
        throw new BadRequestException('Post not found');
      }
      const user: IUserDocument = (await userService.getUserById(`${userTo}`)) as IUserDocument;
      await session.commitTransaction();
      await commentCache.incrementCommentCountInPostCache(`${postId}`);
      if (user.notifications.comments && currentUser.userId !== userTo) {
        const notification = await notificationService.create({
          userTo: userTo,
          userFrom: `${currentUser.userId}`,
          message: `${currentUser.firstName + ' ' + currentUser.lastName} đã bình luận bài viết của bạn.`,
          notificationType: NOTIFICATION_TYPES.COMMENT,
          entityId: `${postId}`,
          createdItemId: `${comment._id}`,
          comment: `${comment.content}`,
          reaction: '',
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
      return comment;
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(`Error processing comment: ${error.message}`);
    } finally {
      session.endSession();
    }
  }
  public async getPostComments(postId: string) {
    return await Comment.find({ postId }).populate('user', 'firstName lastName avatar');
  }
  public async deleteComment(commentId: string, postId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const deletedComment = await Comment.findByIdAndDelete(commentId, { session });
      if (!deletedComment) {
        throw new BadRequestException('Comment not found');
      }
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } }, { session });
      await session.commitTransaction();
      await commentCache.decrementCommentCountInPostCache(postId);
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(`Error deleting comment: ${error.message}`);
    } finally {
      session.endSession();
    }
  }
}
export const commentService: CommentSerice = new CommentSerice();
