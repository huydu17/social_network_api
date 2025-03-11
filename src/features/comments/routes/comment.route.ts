import express, { Router } from 'express';
import { authMiddlware } from 'src/shared/middlewares/auth.middleware';
import { validateSchema } from 'src/shared/middlewares/joi-validate.middleware';
import { commentController } from '../controllers/comment.controller';
class CommentRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
  }
  public routes(): Router {
    this.route.post('/comments', authMiddlware.isLogin, commentController.create);
    this.route.get('/comments/:postId', authMiddlware.isLogin, commentController.getAll);
    return this.route;
  }
}

export const commentRoute: CommentRoute = new CommentRoute();
