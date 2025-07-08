import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { REFRESHTOKEN } from 'src/constants/token.constants';
import { authService } from 'src/services/db/auth.service';
import { setCookies } from 'src/utils/cookie';

const ACCESSTOKEN = 'accesstoken';
class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    const { accessToken, refreshToken, user, verifyToken } = await authService.register(req.body);
    setCookies(res, accessToken, refreshToken);
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Tạo tài khoản thành công',
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
      message: 'Đăng nhập thành công',
      data: userFound,
      accessToken,
      refreshToken
    });
  }
  public async sendCode(req: Request, res: Response): Promise<void> {
    const { user, refreshToken } = req.body;
    const verifyToken = await authService.sendCode(user, refreshToken);
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Gửi mã thành công',
      data: verifyToken
    });
  }
  public async refreshToken(req: Request, res: Response): Promise<void> {
    const { accessToken, refreshToken } = await authService.refreshToken(req.cookies.refreshToken);
    setCookies(res, accessToken, refreshToken);
    res.status(HTTP_STATUS.OK).json({
      accessToken,
      refreshToken
    });
  }
  public async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.forgotPassword(req.body.email);
    res.status(HTTP_STATUS.OK).json({
      message: 'Đã gửi. Vui lòng kiểm tra email của bạn'
    });
  }
  public async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body.newPassword, req.params.token);
    res.status(HTTP_STATUS.OK).json({
      message: 'Đổi mật khẩu thành công'
    });
  }
  public async verifyUser(req: Request, res: Response): Promise<void> {
    await authService.verifyUser(req.params.verifyToken, req.body.code);
    res.status(HTTP_STATUS.OK).json({
      message: 'Xác minh tài khoản thành công'
    });
  }
  public async changePassword(req: Request, res: Response): Promise<void> {
    await authService.changePassword(req.body, req.currentUser!);
    res.status(HTTP_STATUS.OK).json({
      message: 'Thay đổi mật khẩu thành công'
    });
  }
  public async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }
    res.clearCookie(ACCESSTOKEN);
    res.clearCookie(REFRESHTOKEN);
    res.status(HTTP_STATUS.OK).json({ message: 'Đăng xuất thành công' });
  }
}

export const authController: AuthController = new AuthController();
