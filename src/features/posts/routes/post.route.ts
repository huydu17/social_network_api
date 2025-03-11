import express, { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { upload } from 'src/shared/middlewares/upload';
import { asyncWrapper } from 'src/shared/middlewares/globalErrorHandle';
import { validateSchema } from 'src/shared/middlewares/joi-validate.middleware';
import { postSchema } from '../schemes/post';
import { authMiddlware } from 'src/shared/middlewares/auth.middleware';

class PostRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
  }
  public routes(): Router {
    this.route.post('/posts', authMiddlware.isLogin, upload, asyncWrapper(postController.create));
    this.route.get('/posts/:page', authMiddlware.isLogin, asyncWrapper(postController.getAllPosts));
    this.route.get('/posts/:userId/:page', authMiddlware.isLogin, asyncWrapper(postController.getUserPosts));
    this.route.put('/posts/:postId', authMiddlware.isLogin, upload, asyncWrapper(postController.updatePost));
    this.route.delete('/posts/:postId', authMiddlware.isLogin, asyncWrapper(postController.deletePost));
    return this.route;
  }
}

export const postRoute: PostRoute = new PostRoute();
