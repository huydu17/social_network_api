import mongoose, { model, Model, Schema } from 'mongoose';
import { INotification, INotificationDocument } from '../interfaces/notification.interface';
import { notificationService } from 'src/shared/services/db/notification.service';
import { InternalException } from 'src/shared/middlewares/globalErrorHandle';
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

notificationSchema.methods.insertNotification = async function (body: INotification) {
  const { userTo, userFrom, message, notificationType, entityId, createdItemId, comment, reaction, post } = body;
  await Notification.create(body);
  try {
    const notifications: INotificationDocument[] = (await notificationService.getAll(
      `${userTo}`
    )) as INotificationDocument[];
    return notifications;
  } catch (err: any) {
    throw new InternalException(err);
  }
};

const Notification: Model<INotificationDocument> = model<INotificationDocument>('Notification', notificationSchema);
export { Notification };
