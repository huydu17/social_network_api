import express, { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authMiddlware } from 'src/middlewares/auth.middleware';
import { verifiedMiddleware } from 'src/middlewares/verify.middleware';
class CommentRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
    this.route.use(authMiddlware.isLogin, verifiedMiddleware);
  }
  public routes(): Router {
    this.route.post('/comments', commentController.create);
    this.route.get('/comments/:postId', commentController.getAll);
    return this.route;
  }
}

export const commentRoute: CommentRoute = new CommentRoute();
