import express, { Response, Router } from 'express';
import { authController } from 'src/controllers/auth.controller';
import { authMiddlware } from 'src/middlewares/auth.middleware';
import { asyncWrapper } from 'src/middlewares/globalErrorHandle';
import { validateSchema } from 'src/middlewares/joi-validate.middleware';
import { emailSchema, passwordSchema, signInSchema, signUpSchema } from 'src/schemas/auth';

class AuthRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
  }
  public routes(): Router {
    this.route.post('/register', validateSchema(signUpSchema), asyncWrapper(authController.register));
    this.route.post('/verify/:verifyToken', asyncWrapper(authController.verifyUser));
    this.route.post('/send-code', asyncWrapper(authController.sendCode));
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
      asyncWrapper(authController.changePassword)
    );
    this.route.post('/logout', asyncWrapper(authController.logout));
    return this.route;
  }
}

export const authRoute: AuthRoute = new AuthRoute();
