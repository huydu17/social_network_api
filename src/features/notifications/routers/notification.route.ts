import express, { Router } from 'express';
import { authMiddlware } from 'src/shared/middlewares/auth.middleware';
import { validateSchema } from 'src/shared/middlewares/joi-validate.middleware';
import { notificationController } from '../controllers/notification.controller';
class NotificationRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
  }
  public routes(): Router {
    this.route.get('/notifications/', authMiddlware.isLogin, notificationController.getAll);
    this.route.put('/notifications/:notificationId', authMiddlware.isLogin, notificationController.update);
    this.route.delete('/notifications/:notificationId', authMiddlware.isLogin, notificationController.delete);
    return this.route;
  }
}

export const notificationRoute: NotificationRoute = new NotificationRoute();
