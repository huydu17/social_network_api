import mongoose, { Document, ObjectId } from 'mongoose';

export interface INotificationDocument extends Document {
  _id: ObjectId | string;
  userTo: ObjectId | string;
  userFrom: ObjectId | string;
  message: string;
  notificationType: string;
  entityId: mongoose.Types.ObjectId | string;
  createdItemId: mongoose.Types.ObjectId | string;
  comment: string;
  reaction: string;
  post: string;
  read?: boolean;
  createdAt?: Date;
  insertNotification(data: INotification): Promise<void>;
}

export interface INotification {
  userTo: ObjectId | string;
  userFrom: ObjectId | string;
  message: string;
  notificationType: string;
  entityId: mongoose.Types.ObjectId | string;
  createdItemId: mongoose.Types.ObjectId | string | null;
  comment: string;
  reaction: string;
  post: string;
}

export interface IDeleteByType {
  userTo: ObjectId | string;
  userFrom: ObjectId | string;
  notificationType: string;
  createdItemId?: ObjectId | string;
}
