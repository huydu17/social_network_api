import express, { Router } from 'express';
import { userController } from 'src/controllers/user.controller';
import { authMiddlware } from 'src/middlewares/auth.middleware';
import { asyncWrapper } from 'src/middlewares/globalErrorHandle';
import { verifiedMiddleware } from 'src/middlewares/verify.middleware';

class UserRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
    this.route.use(authMiddlware.isLogin, verifiedMiddleware);
  }
  public routes(): Router {
    this.route.get('/users/:userId', asyncWrapper(userController.get));
    this.route.get('/users-list/:page', asyncWrapper(userController.getUserList));
    this.route.put('/update-avatar', asyncWrapper(userController.updateAvatar));
    this.route.put('/update-cover', asyncWrapper(userController.updateCover));
    this.route.put('/update-info', asyncWrapper(userController.updateDetailsInfo));
    this.route.put('/update-notification', asyncWrapper(userController.updateNotification));
    this.route.get('/search/:searchTerm', asyncWrapper(userController.search));
    this.route.post('/add-to-search-history', asyncWrapper(userController.addToSearchHistory));
    this.route.get('/list-searched', asyncWrapper(userController.getSearchHistory));
    this.route.get('/get-suggestions', asyncWrapper(userController.getUserSuggestions));
    this.route.get('/get-message-status', asyncWrapper(userController.getMessageStatus));
    this.route.put('/update-message-status', asyncWrapper(userController.updateMessaageStatus));
    this.route.get('/get-notification-status', asyncWrapper(userController.getNotificationStatus));
    this.route.put('/update-notification-status', asyncWrapper(userController.updateNotificationStatus));

    return this.route;
  }
}

export const userRoute: UserRoute = new UserRoute();
