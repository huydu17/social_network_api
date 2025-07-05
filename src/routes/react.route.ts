import express, { Router } from 'express';
import { reactionController } from 'src/controllers/reaction.controller';
import { authMiddlware } from 'src/middlewares/auth.middleware';
import { verifiedMiddleware } from 'src/middlewares/verify.middleware';

class ReactionRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
    this.route.use(authMiddlware.isLogin, verifiedMiddleware);
  }
  public routes(): Router {
    this.route.post('/reacts', reactionController.create);
    this.route.get('/reacts/:postId', reactionController.getReacts);
    this.route.delete('/reacts/:postId/:previousReaction', reactionController.delete);
    return this.route;
  }
}

export const reactionRoute: ReactionRoute = new ReactionRoute();
