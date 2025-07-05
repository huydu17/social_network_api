import { Document, ObjectId } from 'mongoose';
import { IReaction } from './reaction.interface';

export interface IPostDocument extends Document {
  _id: string | ObjectId;
  user: string | ObjectId;
  text: string;
  images?: object[];
  gifUrl?: string;
  feelings?: string;
  privacy: string;
  commentsCount: number;
  reactions: IReaction;
  createdAt?: Date;
}

export interface ISavePostToCache {
  key?: string;
  post: IPostDocument;
}

export interface IPostPayload {
  _id: string | ObjectId;
  user: string | ObjectId;
  text: string;
  images?: object[];
  gifUrl?: string;
  feelings?: string;
  privacy: string;
  commentsCount: number;
  reactions: IReaction;
  createdAt?: Date;
  hasImageChange?: any;
  hasGifChange?: any;
}
export interface IPostOuputData {
  _id: string | ObjectId;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  text: string;
  images?: object[];
  gifUrl?: string;
  feelings?: string;
  privacy: string;
  commentsCount: number;
  reactions: IReaction;
  createdAt?: Date;
}
