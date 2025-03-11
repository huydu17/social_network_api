import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { reactionService } from 'src/shared/services/db/react.service';
class ReactionController {
  public async create(req: Request, res: Response): Promise<void> {
    const react = await reactionService.create(req.body, req.currentUser!);
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Create react successfully',
      data: react
    });
  }
  public async getReacts(req: Request, res: Response): Promise<void> {
    const reacts = await reactionService.getAll(req.params.postId);
    res.status(HTTP_STATUS.OK).json({
      message: 'Get all reactions',
      data: reacts
    });
  }
  public async delete(req: Request, res: Response): Promise<void> {
    const { postId, previousReaction } = req.params;
    await reactionService.remove(postId, previousReaction, req.currentUser!);
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Delete react successfully'
    });
  }
}
export const reactionController: ReactionController = new ReactionController();
