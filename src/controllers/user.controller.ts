import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UploadedFile } from 'express-fileupload';
import { userService } from 'src/services/db/user.service';
import { IUserDocument } from 'src/interfaces/user.interface';

class UserController {
  public async get(req: Request, res: Response): Promise<void> {
    const user = await userService.findOne(req.params.userId);
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thông tin người dùng thành công',
      data: user
    });
  }
  public async getUserList(req: Request, res: Response): Promise<void> {
    const { userId, type } = req.query;
    const pageNum = parseInt(req.query.page as string) || 1;
    const limitNum = parseInt(req.query.limit as string);
    const { userList, totalUsers } = await userService.getUserList(`${userId}`, `${type}`, pageNum, limitNum);
    res.status(HTTP_STATUS.OK).json({
      message: `Lấy danh sách ${type} thành công`,
      data: {
        users: userList,
        totalUsers
      }
    });
  }
  public async updateAvatar(req: Request, res: Response): Promise<void> {
    const file: UploadedFile = req.files?.image as UploadedFile;
    const user = await userService.updateAvatar(file, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật ảnh đại diện thành công',
      data: user
    });
  }
  public async updateCover(req: Request, res: Response): Promise<void> {
    const file: UploadedFile = req.files?.image as UploadedFile;
    const user = await userService.updateCover(file, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật ảnh bìa thành công',
      data: user
    });
  }
  public async updateDetailsInfo(req: Request, res: Response): Promise<void> {
    const user: IUserDocument = await userService.updateDetails(req.body.detailsInfo, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật thông tin người dùng thành công',
      data: user.details
    });
  }
  public async updateNotification(req: Request, res: Response): Promise<void> {
    await userService.updateNotificationSettings(req.currentUser!, req.body);
    res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật cài đặt thông báo thành công'
    });
  }
  public async search(req: Request, res: Response): Promise<void> {
    const users = await userService.search(req.params.searchTerm);
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách người dùng thành công',
      data: users
    });
  }
  public async addToSearchHistory(req: Request, res: Response): Promise<void> {
    await userService.addToSearchHistory(req.body.searchUser, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Thêm người dùng vào lịch sử tìm kiếm thành công'
    });
  }
  public async getSearchHistory(req: Request, res: Response): Promise<void> {
    const results = await userService.getSearchHistory(req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy lịch sử tìm kiếm thành công',
      data: results
    });
  }
  public async removeFromSearch(req: Request, res: Response): Promise<void> {
    await userService.removeFromSearch(req.body.searchUser, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Xóa người dùng khỏi lịch sử tìm kiếm thành công'
    });
  }
  public async getUserSuggestions(req: Request, res: Response) {
    const randomUsers = await userService.getRandomUsers(req.currentUser?.userId as string);
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách người dùng gợi ý thành công',
      data: randomUsers
    });
  }
  public async getMessageStatus(req: Request, res: Response) {
    const data = await userService.getMessageStatus(`${req?.currentUser?.userId}`);
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy trạng thái tin nhắn thành công',
      data: data
    });
  }
  public async updateMessaageStatus(req: Request, res: Response) {
    const data = await userService.updateMessaageStatus(`${req?.currentUser?.userId}`);
    res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật trạng thái tin nhắn thành công',
      data: data
    });
  }
  public async getNotificationStatus(req: Request, res: Response) {
    const data = await userService.getNotificationStatus(`${req?.currentUser?.userId}`);
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy trạng thái thông báo thành công',
      data: data
    });
  }
  public async updateNotificationStatus(req: Request, res: Response) {
    const data = await userService.updateNotificationStatus(`${req?.currentUser?.userId}`);
    res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật trạng thái thông báo thành công',
      data: data
    });
  }
}
export const userController: UserController = new UserController();
