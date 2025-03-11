import { IDeleteByType, INotificationDocument } from 'src/features/notifications/interfaces/notification.interface';
import { Notification } from 'src/features/notifications/models/notification.schema';

class NotificationService {
  public async getAll(userId: string): Promise<INotificationDocument[]> {
    const notifications = await Notification.find({ userTo: userId })
      .populate('userFrom', '_id firstName lastName avatar')
      .sort({ createdAt: -1 });
    return notifications;
  }
  public async update(notificationId: string): Promise<void> {
    await Notification.updateOne({ _id: notificationId }, { read: true }).exec();
  }
  public async delete(notificationId: string): Promise<void> {
    await Notification.deleteOne({ _id: notificationId }).exec();
  }
  public async deleteNotificationByType(data: IDeleteByType) {
    const { userTo, userFrom, notificationType, createdItemId } = data;
    await Notification.deleteOne({ userTo, userFrom, notificationType, createdItemId }).exec();
  }
}
export const notificationService: NotificationService = new NotificationService();
