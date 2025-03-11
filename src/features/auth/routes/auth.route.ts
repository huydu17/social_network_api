import express, { Response, Router } from 'express';
import { signUpSchema } from '../schemes/register';
import { asyncWrapper } from 'src/shared/middlewares/globalErrorHandle';
import { validateSchema } from 'src/shared/middlewares/joi-validate.middleware';
import { authController } from '../controllers/auth.controller';
import { signInSchema } from '../schemes/login';
import { emailSchema } from '../schemes/email';
import { passwordSchema } from '../schemes/password';
import { authMiddlware } from 'src/shared/middlewares/auth.middleware';
class AuthRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
  }
  public routes(): Router {
    this.route.post('/register', validateSchema(signUpSchema), asyncWrapper(authController.register));
    this.route.post('/verify/:verifyToken', asyncWrapper(authController.verifyUser));
    this.route.post('/login', validateSchema(signInSchema), asyncWrapper(authController.login));
    this.route.post('/refresh-token', asyncWrapper(authController.refreshToken));
    this.route.post('/forgot-password', validateSchema(emailSchema), asyncWrapper(authController.forgotPassword));
    this.route.post(
      '/reset-password/:token',
      validateSchema(passwordSchema),
      asyncWrapper(authController.resetPassword)
    );
    this.route.put(
      '/change-password',
      authMiddlware.isLogin,
      validateSchema(passwordSchema),
      asyncWrapper(authController.changPassword)
    );
    this.route.post('/logout', asyncWrapper(authController.logout));
    return this.route;
  }
}

export const authRoute: AuthRoute = new AuthRoute();
