import { Request, Response } from 'express';
import { commentService } from 'src/shared/services/db/comment.service';
import { notificationService } from 'src/shared/services/db/notification.service';

class NotificationController {
  public async getAll(req: Request, res: Response): Promise<void> {
    const notifications = await notificationService.getAll(`${req.currentUser?.userId}`);
    res.status(200).json({
      message: 'Get all notifications',
      data: notifications
    });
  }
  public async update(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    await notificationService.update(notificationId);
    res.status(200).json({
      message: 'Mark notification as read'
    });
  }
  public async delete(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    await notificationService.delete(notificationId);
    res.status(200).json({
      message: 'Delete notification successfully'
    });
  }
}
export const notificationController: NotificationController = new NotificationController();
