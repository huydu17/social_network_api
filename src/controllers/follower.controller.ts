import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { followerService } from 'src/services/db/follower.service';

class FollowerController {
  public async addFriend(req: Request, res: Response): Promise<void> {
    const data = await followerService.addFriend(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Gửi yêu cầu kết bạn thành công',
      data
    });
  }
  public async cancelRequest(req: Request, res: Response): Promise<void> {
    const data = await followerService.cancelRequest(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Hủy yêu cầu kết bạn thành công',
      data
    });
  }
  public async follow(req: Request, res: Response): Promise<void> {
    const data = await followerService.follow(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Theo dõi người dùng thành công',
      data
    });
  }
  public async unfollow(req: Request, res: Response): Promise<void> {
    const data = await followerService.unfollow(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Bỏ theo dõi người dùng thành công',
      data
    });
  }
  public async acceptFriend(req: Request, res: Response): Promise<void> {
    const data = await followerService.acceptFriend(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Chấp nhận yêu cầu kết bạn thành công',
      data
    });
  }
  public async unfriend(req: Request, res: Response): Promise<void> {
    const data = await followerService.unfriend(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Hủy kết bạn thành công',
      data
    });
  }
  public async deleteRequest(req: Request, res: Response): Promise<void> {
    const data = await followerService.deleteRequest(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Xóa yêu cầu kết bạn thành công',
      data
    });
  }
}
export const followerController: FollowerController = new FollowerController();
