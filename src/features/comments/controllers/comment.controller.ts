import { Request, Response } from 'express';
import { commentService } from 'src/shared/services/db/comment.service';

class CommentController {
  public async create(req: Request, res: Response): Promise<void> {
    const comment = await commentService.create(req.body, req.currentUser!);
    res.status(201).json({
      message: 'Create comment successfully',
      data: comment
    });
  }
  public async getAll(req: Request, res: Response): Promise<void> {
    const comments = await commentService.getPostComments(req.params.postId);
    res.status(200).json({
      message: 'Get all comments',
      data: comments
    });
  }
}
export const commentController: CommentController = new CommentController();
