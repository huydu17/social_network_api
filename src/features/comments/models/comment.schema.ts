import mongoose, { model, Model, Types } from 'mongoose';
import { ICommentDocument } from '../interfaces/comment.interface';

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: Types.ObjectId,
      ref: 'Post',
      index: true
    },
    content: {
      type: String,
      default: ''
    },
    user: {
      type: Types.ObjectId,
      ref: 'User',
      index: true
    }
  },
  {
    timestamps: true
  }
);

const Comment: Model<ICommentDocument> = model<ICommentDocument>('Comment', commentSchema);
export { Comment };
