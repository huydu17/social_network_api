import { IDeleteByType, INotification, INotificationDocument } from 'src/interfaces/notification.interface';
import { socketNotificationIO } from '../sockets/notification.socket';
import { Notification } from 'src/models/notification.schema';
import { NOTIFICATION_TYPES } from 'src/constants/notification.constant';

class NotificationService {
  public async create(data: INotification) {
    const notification: INotificationDocument = await Notification.create(data);
    return notification;
  }
  public async getAll(userId: string): Promise<INotificationDocument[]> {
    const notifications = await Notification.find({ userTo: userId })
      .populate('userFrom', '_id firstName lastName avatar')
      .sort({ createdAt: -1 });
    return notifications;
  }
  public async update(notificationId: string): Promise<void> {
    await Notification.updateOne({ _id: notificationId }, { read: true }).exec();
    socketNotificationIO.emit('update-notification', notificationId);
  }
  public async deleteNotificationByType(data: IDeleteByType) {
    const { userTo, userFrom, notificationType, createdItemId } = data;
    const notification: INotificationDocument = (await Notification.findOne({
      userTo,
      userFrom,
      notificationType,
      createdItemId
    }).exec()) as INotificationDocument;
    await this.delete(`${notification._id}`);
  }
  public async delete(notificationId: string): Promise<void> {
    await Notification.deleteOne({ _id: notificationId }).exec();
    socketNotificationIO.emit('delete-notification', notificationId);
  }
  public async getNotificationPost(postId: string, userId: string) {
    const notification = await Notification.findOne({
      entityId: postId,
      userFrom: userId,
      notificationType: NOTIFICATION_TYPES.REACT
    });
    return notification?._id || null;
  }
}
export const notificationService: NotificationService = new NotificationService();
