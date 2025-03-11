import mongoose, { Document } from 'mongoose';
import { IReaction } from 'src/features/reactions/interfaces/reaction.interface';
import { IUserSummary } from 'src/features/users/interfaces/user.interface';

export interface IMessageDocument extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  textMessage: string;
  gifUrl: string;
  isRead: boolean;
  selectedImage: string;
  reaction: IReaction[];
  deleteForMe: boolean;
  deleteForEveryone: boolean;
  createdAt: Date;
}

export interface IMessageData {
  conversationId: string | mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  textMessage: string;
  gifUrl: string;
  isRead: boolean;
}

export interface IChatList {
  receiverId: mongoose.Types.ObjectId;
  conversationId: string | mongoose.Types.ObjectId;
}

export interface IGetMessageFromCache {
  index: number;
  message: string;
  receiver: IChatList;
}
