// src/middlewares/verified.middleware.ts
import { NextFunction, Request, Response } from 'express';
import { userService } from 'src/services/db/user.service';
import { BadRequestException, ForbiddenException } from './globalErrorHandle';

export const verifiedMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.currentUser?.userId;
    if (!userId) {
      throw new BadRequestException('Id không tồn tại');
    }
    const user = await userService.getUserById(`${userId}`);
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    if (!user.verified) {
      throw new ForbiddenException('Vui lòng xác minh tài khoản');
    }
    next();
  } catch (error) {
    next(error);
  }
};
