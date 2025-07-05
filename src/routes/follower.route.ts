import express, { Router } from 'express';
import { followerController } from 'src/controllers/follower.controller';
import { authMiddlware } from 'src/middlewares/auth.middleware';
import { asyncWrapper } from 'src/middlewares/globalErrorHandle';
import { verifiedMiddleware } from 'src/middlewares/verify.middleware';

class FollowerRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
    this.route.use(authMiddlware.isLogin, verifiedMiddleware);
  }
  public routes(): Router {
    this.route.put('/add-friend/:id', verifiedMiddleware, asyncWrapper(followerController.addFriend));
    this.route.put('/cancle-request/:id', verifiedMiddleware, asyncWrapper(followerController.cancelRequest));
    this.route.put('/follow/:id', asyncWrapper(followerController.follow));
    this.route.put('/unfollow/:id', asyncWrapper(followerController.unfollow));
    this.route.put('/accept-request/:id', asyncWrapper(followerController.acceptFriend));
    this.route.put('/unfriend/:id', asyncWrapper(followerController.unfriend));
    this.route.put('/delete-request/:id', asyncWrapper(followerController.deleteRequest));
    return this.route;
  }
}

export const followerRoute: FollowerRoute = new FollowerRoute();
