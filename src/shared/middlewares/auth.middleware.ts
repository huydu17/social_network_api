import { NextFunction, Request, Response } from 'express';
import { UnAuthorizedException } from './globalErrorHandle';
import { verifyToken } from '../utils/verify-token';
import { UserPayload } from 'src/type';

class AuthMiddleware {
  public isLogin(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.accessToken;
    if (!token) {
      throw new UnAuthorizedException('Token is not available. Please login again');
    }
    try {
      const payload: UserPayload = verifyToken(token) as UserPayload;
      req.currentUser = payload;
    } catch (error: any) {
      throw new UnAuthorizedException('Token is invalid. Please login agin');
    }
    next();
  }
}
export const authMiddlware: AuthMiddleware = new AuthMiddleware();
