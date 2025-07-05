import mongoose, { Document } from 'mongoose';

export interface IMessageDocument extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  textMessage: string;
  gifUrl: string;
  isRead: boolean;
  selectedImage: string;
  reaction: string;
  deleteForMe: boolean;
  deleteForEveryone: boolean;
  createdAt: Date;
}

export interface IMessageData {
  conversationId: string | mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  textMessage: string;
  gifUrl: string;
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
