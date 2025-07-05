import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { reactionService } from 'src/services/db/react.service';

class ReactionController {
  public async create(req: Request, res: Response): Promise<void> {
    const response: any = await reactionService.create(req.body, req.currentUser!);
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Tạo phản ứng thành công',
      data: {
        updatedReact: response.updatedReact,
        postReactions: response.postReactions
      }
    });
  }
  public async getReacts(req: Request, res: Response): Promise<void> {
    const reacts = await reactionService.getAll(req.params.postId);
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách phản ứng thành công',
      data: reacts
    });
  }
  public async delete(req: Request, res: Response): Promise<void> {
    const { postId, previousReaction } = req.params;
    const { postReactions } = await reactionService.remove(postId, previousReaction, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Xóa phản ứng thành công',
      data: postReactions
    });
  }
}
export const reactionController: ReactionController = new ReactionController();
