import express, { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authMiddlware } from 'src/middlewares/auth.middleware';
import { upload } from 'src/middlewares/upload';
import { asyncWrapper } from 'src/middlewares/globalErrorHandle';
import { verifiedMiddleware } from 'src/middlewares/verify.middleware';

class PostRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
    this.route.use(authMiddlware.isLogin, verifiedMiddleware);
  }
  public routes(): Router {
    this.route.post('/posts', upload, asyncWrapper(postController.create));
    this.route.get('/posts', asyncWrapper(postController.getAllPosts));
    this.route.get('/posts/:userId', asyncWrapper(postController.getUserPosts));
    this.route.put('/posts/:postId', upload, asyncWrapper(postController.updatePost));
    this.route.delete('/posts/:postId', asyncWrapper(postController.deletePost));
    return this.route;
  }
}

export const postRoute: PostRoute = new PostRoute();
