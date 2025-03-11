import express, { Router } from 'express';
import { authMiddlware } from 'src/shared/middlewares/auth.middleware';
import { reactionController } from '../controllers/reaction.controller';
import { validateSchema } from 'src/shared/middlewares/joi-validate.middleware';
import { createReactSchema } from '../schemes/reaction';
class ReactionRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
  }
  public routes(): Router {
    this.route.post('/reacts', authMiddlware.isLogin, reactionController.create);
    this.route.get('/reacts/:postId', authMiddlware.isLogin, reactionController.getReacts);
    this.route.delete('/reacts/:postId/:previousReaction', authMiddlware.isLogin, reactionController.delete);
    return this.route;
  }
}

export const reactionRoute: ReactionRoute = new ReactionRoute();
