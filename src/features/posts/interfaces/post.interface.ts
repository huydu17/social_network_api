import { Document, ObjectId } from 'mongoose';
import { IReactions } from 'src/features/reactions/interfaces/reaction.interface';

export interface IPostDocument extends Document {
  _id: string | ObjectId;
  user: string | ObjectId;
  text: string;
  images?: object[];
  videos?: Object[];
  gifUrl?: string;
  feelings?: string;
  privancy: string;
  commentsCount: number;
  reactions: IReactions;
  createdAt?: Date;
}

export interface ISavePostToCache {
  key?: string;
  post: IPostDocument;
}
