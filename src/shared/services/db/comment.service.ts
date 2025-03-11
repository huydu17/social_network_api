import { Comment } from 'src/features/comments/models/comment.schema';
import { UserPayload } from 'src/type';
import { commentCache } from '../redis/comment.cache';
import mongoose from 'mongoose';
import { ICommentData } from 'src/features/comments/interfaces/comment.interface';
import { BadRequestException } from 'src/shared/middlewares/globalErrorHandle';
import { IUserDocument } from 'src/features/users/interfaces/user.interface';
import { userCache } from '../redis/user.cache';
import { Post } from 'src/features/posts/models/post.schema';
import { IPostDocument } from 'src/features/posts/interfaces/post.interface';
import { INotificationDocument } from 'src/features/notifications/interfaces/notification.interface';
import { Notification } from 'src/features/notifications/models/notification.schema';
import { NOTIFICATION_TYPES } from 'src/features/notifications/constants/notification.constant';

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
      const user: IUserDocument = (await userCache.getUserFromCache(`${userTo}`)) as IUserDocument;
      await session.commitTransaction();
      session.endSession();
      await commentCache.saveCommentToCache(`${postId}`, JSON.stringify(comment._doc));
      if (user.notifications.follows && currentUser.userId !== userTo) {
        const notificationModel: INotificationDocument = new Notification();
        const notification = await notificationModel.insertNotification({
          userTo: userTo,
          userFrom: `${currentUser.userId}`,
          message: `${currentUser.firstName + ' ' + currentUser.lastName} commented to your post`,
          notificationType: NOTIFICATION_TYPES.COMMENT,
          entityId: `${postId}`,
          createdItemId: `${comment._id}`,
          comment: `${comment.content}`,
          reaction: '',
          post: updatePost.text
        });
      }
      return comment;
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      throw new BadRequestException(`Error processing comment: ${error.message}`);
    }
  }
  public async getPostComments(postId: string) {
    const commentFromCache = await commentCache.getCommentsFromCache(`${postId}`);
    return commentFromCache.length > 0
      ? commentFromCache
      : await Comment.find({ postId }).populate('user', 'firstName lastName avatar');
  }
}
export const commentService: CommentSerice = new CommentSerice();
