import { Document, ObjectId } from 'mongoose';
import { TYPE_REACT } from '../enums/type-react.enum';

export interface IReactionDocument extends Document {
  _id: string | ObjectId;
  type: string;
  postId: string | ObjectId;
  user: string | ObjectId;
  createdAt?: Date;
}

export interface IReaction {
  like: number;
  love: number;
  happy: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
}

export interface IReactionData {
  type: string;
  postId: string | ObjectId;
  userTo: string | ObjectId;
  previousReaction: string;
}

export interface IMessageReaction {
  senderReactionId: string | ObjectId;
  type: string;
}
