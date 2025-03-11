import { Document, ObjectId } from 'mongoose';

export interface ICommentDocument extends Document {
  _id: string | ObjectId;
  postId: string | ObjectId;
  content: string;
  user: string | ObjectId;
  createdAt: Date;
}

export interface ICommentData {
  postId: string | ObjectId;
  content: string;
  userTo: string | ObjectId;
}
