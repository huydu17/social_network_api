import mongoose, { model, Model, Schema } from 'mongoose';
import { INotificationDocument } from 'src/interfaces/notification.interface';
const notificationSchema: Schema = new mongoose.Schema(
  {
    userTo: { type: mongoose.Types.ObjectId, ref: 'User', index: true },
    userFrom: { type: mongoose.Types.ObjectId, ref: 'User' },
    read: { type: Boolean, default: false },
    message: { type: String, default: '' },
    notificationType: String,
    entityId: mongoose.Types.ObjectId,
    createdItemId: mongoose.Types.ObjectId,
    comment: { type: String, default: '' },
    reaction: { type: String, default: '' },
    post: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

const Notification: Model<INotificationDocument> = model<INotificationDocument>('Notification', notificationSchema);
export { Notification };
