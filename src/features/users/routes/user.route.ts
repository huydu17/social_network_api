import express, { Router } from 'express';
import { asyncWrapper } from 'src/shared/middlewares/globalErrorHandle';
import { userController } from '../controllers/user.controller';
import { authMiddlware } from 'src/shared/middlewares/auth.middleware';
import { validateSchema } from 'src/shared/middlewares/joi-validate.middleware';
import { updateInfoSchema } from '../schemes/update-info.schema';

class UserRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
  }
  public routes(): Router {
    this.route.get('/users/:userId', authMiddlware.isLogin, asyncWrapper(userController.get));
    this.route.get('/users-list/:page/:type', authMiddlware.isLogin, asyncWrapper(userController.getUserList));
    this.route.put('/update-avatar', authMiddlware.isLogin, asyncWrapper(userController.updateAvatar));
    this.route.put('/update-cover', authMiddlware.isLogin, asyncWrapper(userController.updateCover));
    this.route.put(
      '/update-info',
      validateSchema(updateInfoSchema),
      authMiddlware.isLogin,
      asyncWrapper(userController.updateDetailsInfo)
    );
    this.route.put('/add-friend/:id', authMiddlware.isLogin, asyncWrapper(userController.addFriend));
    this.route.put('/cancle-request/:id', authMiddlware.isLogin, asyncWrapper(userController.cancelRequest));
    this.route.put('/follow/:id', authMiddlware.isLogin, asyncWrapper(userController.follow));
    this.route.put('/unfollow/:id', authMiddlware.isLogin, asyncWrapper(userController.unfollow));
    this.route.put('/accept-request/:id', authMiddlware.isLogin, asyncWrapper(userController.acceptFriend));
    this.route.put('/unfriend/:id', authMiddlware.isLogin, asyncWrapper(userController.unfriend));
    this.route.put('/delete-request/:id', authMiddlware.isLogin, asyncWrapper(userController.deleteRequest));
    this.route.get('/search/:searchTerm', authMiddlware.isLogin, asyncWrapper(userController.search));
    this.route.post('/add-to-search-history', authMiddlware.isLogin, asyncWrapper(userController.addToSearchHistory));
    this.route.get('/list-searched', authMiddlware.isLogin, asyncWrapper(userController.getSearchHistory));

    return this.route;
  }
}

export const userRoute: UserRoute = new UserRoute();
