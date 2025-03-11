import { userCache } from 'src/shared/services/redis/user.cache';
import { IUserDocument } from '../interfaces/user.interface';
import { Request, Response } from 'express';
import { userService } from 'src/shared/services/db/user.service';
import HTTP_STATUS from 'http-status-codes';
import { UploadedFile } from 'express-fileupload';

class UserController {
  public async get(req: Request, res: Response): Promise<void> {
    const user = await userService.findOne(req.params.userId);
    res.status(HTTP_STATUS.OK).json({
      message: 'Get user succesfully',
      data: user
    });
  }
  public async getUserList(req: Request, res: Response): Promise<void> {
    const { page, type } = req.params;
    const users = await userService.getUserList(`${req.currentUser?.userId}`, type, parseInt(page));
    res.status(HTTP_STATUS.OK).json({
      message: `Get ${type} list successfully`,
      data: users
    });
  }

  public async updateAvatar(req: Request, res: Response): Promise<void> {
    const file: UploadedFile = req.files?.avatar as UploadedFile;
    const user = await userService.updateAvatar(file, req.currentUser!, req.body.text);
    res.status(HTTP_STATUS.OK).json({
      message: 'Avatar updated successfully',
      data: user
    });
  }
  public async updateCover(req: Request, res: Response): Promise<void> {
    const file: UploadedFile = req.files?.cover as UploadedFile;
    const user = await userService.updateCover(file, req.currentUser!, req.body.text);
    res.status(HTTP_STATUS.OK).json({
      message: 'Cover updated successfully',
      data: user
    });
  }
  public async updateDetailsInfo(req: Request, res: Response): Promise<void> {
    const user: IUserDocument = await userService.updateDetails(req.body.detailsInfo, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'User information updated successfully',
      data: user.details
    });
  }
  public async addFriend(req: Request, res: Response): Promise<void> {
    await userService.addFriend(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Friend request sent successfully'
    });
  }
  public async cancelRequest(req: Request, res: Response): Promise<void> {
    await userService.cancelRequest(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Friend request canceled successfully'
    });
  }
  public async follow(req: Request, res: Response): Promise<void> {
    await userService.follow(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Followed user successfully'
    });
  }
  public async unfollow(req: Request, res: Response): Promise<void> {
    await userService.unfollow(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Unfollowed user successfully'
    });
  }
  public async acceptFriend(req: Request, res: Response): Promise<void> {
    await userService.acceptFriend(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Friend request accepted successfully'
    });
  }
  public async unfriend(req: Request, res: Response): Promise<void> {
    await userService.unfriend(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Unfriended user successfully'
    });
  }
  public async deleteRequest(req: Request, res: Response): Promise<void> {
    await userService.deleteRequest(req.params.id, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Deleted request successfully'
    });
  }
  public async search(req: Request, res: Response): Promise<void> {
    const users = await userService.search(req.params.searchTerm);
    res.status(HTTP_STATUS.OK).json({
      message: 'List users',
      data: users
    });
  }
  public async addToSearchHistory(req: Request, res: Response): Promise<void> {
    await userService.addToSearchHistory(req.body.searchUser, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'User added to search history successfully'
    });
  }
  public async getSearchHistory(req: Request, res: Response): Promise<void> {
    const results = await userService.getSearchHistory(req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'List searched',
      data: results
    });
  }
  public async removeFromSearch(req: Request, res: Response): Promise<void> {
    await userService.removeFromSearch(req.body.searchUser, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Remove user from search history successfully'
    });
  }
  public async getUserSuggestions(req: Request, res: Response): Promise<void> {}
}
export const userController: UserController = new UserController();
