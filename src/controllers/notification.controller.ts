import { Request, Response } from 'express';
import { notificationService } from 'src/services/db/notification.service';

class NotificationController {
  public async getAll(req: Request, res: Response): Promise<void> {
    const notifications = await notificationService.getAll(`${req.currentUser?.userId}`);
    res.status(200).json({
      message: 'Lấy danh sách thông báo thành công',
      data: notifications
    });
  }
  public async update(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    await notificationService.update(notificationId);
    res.status(200).json({
      message: 'Đánh dấu thông báo đã đọc thành công'
    });
  }
  public async delete(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    await notificationService.delete(notificationId);
    res.status(200).json({
      message: 'Xóa thông báo thành công'
    });
  }
}
export const notificationController: NotificationController = new NotificationController();
