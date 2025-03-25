import { NextFunction, Request, Response } from 'express';
import { authService } from 'src/shared/services/db/auth.service';
import HTTP_STATUS from 'http-status-codes';
import { setCookies } from 'src/shared/utils/cookie';

const ACCESSTOKEN = 'accesstoken';
class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    const { accessToken, refreshToken, user, verifyToken } = await authService.register(req.body);
    setCookies(res, accessToken, refreshToken);
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Account created successfully',
      data: user,
      accessToken,
      refreshToken,
      verifyToken
    });
  }
  public async login(req: Request, res: Response): Promise<void> {
    const { accessToken, refreshToken, userFound } = await authService.login(req.body);
    setCookies(res, accessToken, refreshToken);
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Login successful',
      data: userFound,
      accessToken,
      refreshToken
    });
  }
  public async refreshToken(req: Request, res: Response): Promise<void> {
    const { accessToken, refreshToken } = await authService.refreshToken(req.body);
    setCookies(res, accessToken, refreshToken);
    res.status(HTTP_STATUS.OK).json({
      accessToken,
      refreshToken
    });
  }
  public async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.forgotPassword(req.body.email);
    res.status(HTTP_STATUS.OK).json({
      message: 'Sent. Please check your email'
    });
  }
  public async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body.password, req.params.token);
    res.status(HTTP_STATUS.OK).json({
      message: 'Password changed successfully'
    });
  }
  public async verifyUser(req: Request, res: Response): Promise<void> {
    await authService.verifyUser(req.params.verifyToken, req.body.code);
    res.status(HTTP_STATUS.OK).json({
      message: 'Account verification successful'
    });
  }
  public async changPassword(req: Request, res: Response): Promise<void> {
    await authService.changePassword(req.body, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Change password successfully'
    });
  }
  public async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie(ACCESSTOKEN);
    res.status(HTTP_STATUS.OK).json({
      message: 'Logout successfully'
    });
  }
}

export const authController: AuthController = new AuthController();
