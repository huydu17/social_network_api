import express, { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authMiddlware } from 'src/middlewares/auth.middleware';
import { verifiedMiddleware } from 'src/middlewares/verify.middleware';
class NotificationRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
    this.route.use(authMiddlware.isLogin, verifiedMiddleware);
  }
  public routes(): Router {
    this.route.get('/notifications/', notificationController.getAll);
    this.route.put('/notifications/:notificationId', notificationController.update);
    this.route.delete('/notifications/:notificationId', notificationController.delete);
    return this.route;
  }
}

export const notificationRoute: NotificationRoute = new NotificationRoute();
