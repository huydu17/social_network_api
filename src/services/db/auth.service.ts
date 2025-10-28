import { userService } from './user.service';
import { userCache } from '../redis/user.cache';
import { UserPayload } from 'src/type';
import { mailTransport } from '../email/email.transport';
import { resetTemplate } from '../email/templates/reset-password/reset-password';
import { verifyTemplate } from '../email/templates/verify-user/verify-user';
import Cryptr from 'cryptr';
import { appConfig } from 'src/config/appConfig';
import { IChangePassword, ILoginData, IRegisterData, ITokenDocument } from 'src/interfaces/auth.interface';
import { IUserDocument } from 'src/interfaces/user.interface';
import { BadRequestException, UnAuthorizedException } from 'src/middlewares/globalErrorHandle';
import { User } from 'src/models/user.schema';
import { Token } from 'src/models/token.schema';
import { verifyToken } from 'src/utils/verify-token';
import { TokenGenerator } from 'src/utils/genarateToken';
import { generateRadomHex } from 'src/utils/generateRandomHex';
import { Helpers } from 'src/utils/helpers';

const cryptr = new Cryptr(appConfig.CRYPTR_KEY!);

class AuthService {
  public async register(requestBody: IRegisterData) {
    const { email } = requestBody;
    const existingUser: IUserDocument = (await userService.getUserByEmail(email)) as IUserDocument;
    if (existingUser) {
      throw new BadRequestException('Tài khoản đã tồn tại');
    }
    const data = await this.registerData(requestBody);
    const user: IUserDocument = await User.create(data);
    const { accessToken, refreshToken } = await this.generateAndSaveTokens(user);
    const verifyToken = await this.sendCode(user, refreshToken);
    await userCache.saveUserToCache(`${user._id}`, user);
    return { accessToken, refreshToken, user, verifyToken };
  }

  public async verifyUser(verifyToken: string, code: number): Promise<void> {
    const token: ITokenDocument | null = await this.getTokenByVerficationToken(verifyToken);
    if (!token) {
      throw new BadRequestException('Mã xác minh không hợp lệ');
    }
    if (token.verifyTokenExpiresAt && token.verifyTokenExpiresAt < Date.now()) {
      throw new BadRequestException('Mã xác minh đã hết hạn');
    }
    const user: IUserDocument = (await userService.getUserById(`${token.userId}`)) as IUserDocument;
    const decryptToken: string = cryptr.decrypt(verifyToken);
    if (code.toString() !== decryptToken) {
      throw new BadRequestException('Mã xác minh không đúng');
    }
    user.verified = true;
    token.verifyToken = undefined;
    token.verifyTokenExpiresAt = undefined;
    await Promise.all([token.save(), user.save()]);
    await userCache.saveUserToCache(`${user._id}`, user);
  }

  public async login(requestBody: ILoginData) {
    const { emailOrUsername, password } = requestBody;
    const userFound: IUserDocument | null = await userService.getUserByEmailOrUsername(emailOrUsername);
    if (!userFound) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }
    const isMatch = await userFound.comparePassword(password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu không đúng');
    }
    const { accessToken, refreshToken } = await this.generateAndSaveTokens(userFound);
    await userCache.saveUserToCache(`${userFound._id}`, userFound);
    return { accessToken, refreshToken, userFound };
  }

  public async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnAuthorizedException('Yêu cầu có mã làm mới');
    }
    const payload: UserPayload | any = verifyToken(refreshToken);
    if (!payload) {
      throw new UnAuthorizedException('Mã làm mới không hợp lệ');
    }
    const token = await Token.findOne({ refreshToken: refreshToken });
    if (!token) {
      throw new UnAuthorizedException('Mã làm mới không hợp lệ hoặc không tìm thấy người dùng');
    }
    const { iat, exp, aud, iss, ...newPayload } = payload;
    const tokens = TokenGenerator.generateToken(newPayload);
    await Token.findByIdAndUpdate({ _id: token._id }, { refreshToken: tokens.refreshToken }, { new: true });
    return tokens;
  }

  public async forgotPassword(email: string): Promise<void> {
    const existingUser: IUserDocument = (await userService.getUserByEmail(email)) as IUserDocument;
    if (!existingUser) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }
    const resetToken: string = generateRadomHex(`${existingUser._id}`);
    await this.updateResetPasswordToken(`${existingUser._id}`, resetToken, Date.now() + 15 * 60 * 1000);
    const resetLink = `${appConfig.CLIENT_URL}/reset-password?token=${resetToken}`;
    const template = resetTemplate.resetPasswordTemplate(
      `${existingUser.firstName + ' ' + existingUser.lastName}`,
      resetLink
    );
    await mailTransport.sendMail(existingUser.email, 'RESET PASSWORD', template);
  }

  public async resetPassword(password: string, token: string): Promise<void> {
    const tokenFound: ITokenDocument = (await this.getTokenByResetToken(token)) as ITokenDocument;
    if (!tokenFound) {
      throw new BadRequestException(
        'Mã xác minh của bạn đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu mã xác minh mới từ email của bạn.'
      );
    }
    const user: IUserDocument = (await userService.getUserById(`${tokenFound.userId}`)) as IUserDocument;
    user.password = password;
    tokenFound.passwordResetToken = undefined;
    tokenFound.passwordResetTokenExpiresAt = undefined;
    await Promise.all([tokenFound.save(), user.save()]);
    await userCache.saveUserToCache(`${user._id}`, user);
  }

  public async changePassword(data: IChangePassword, currentUser: UserPayload) {
    const { oldPassword, newPassword } = data;
    const user: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const isOldPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isOldPasswordCorrect) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }
    const isNewPasswordDuplicate = await user.comparePassword(newPassword);
    if (isNewPasswordDuplicate) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }
    user.password = newPassword;
    await user.save();
    await userCache.saveUserToCache(`${user._id}`, user);
    return user;
  }

  private async registerData(data: IRegisterData) {
    const { firstName, lastName, email } = data;
    return {
      ...data,
      userName: await Helpers.validateUsername(firstName + lastName),
      email: Helpers.lowerCase(email)
    };
  }

  private async getTokenByVerficationToken(vtoken: string) {
    const token: ITokenDocument | null = await Token.findOne({ verifyToken: vtoken });
    return token;
  }

  private async getTokenByResetToken(resetToken: string) {
    const token: ITokenDocument = (await Token.findOne({
      passwordResetToken: resetToken,
      passwordResetTokenExpiresAt: { $gt: Date.now() }
    })) as ITokenDocument;
    return token;
  }

  private async updateResetPasswordToken(userId: string, resetToken: string, tokenExpires: number) {
    const updatedToken = await Token.findOneAndUpdate(
      { userId },
      {
        passwordResetToken: resetToken,
        passwordResetTokenExpiresAt: tokenExpires
      },
      { new: true, upsert: true }
    );
    if (!updatedToken) {
      throw new BadRequestException('Không thể cập nhật mã đặt lại mật khẩu');
    }
  }

  private async generateAndSaveTokens(user: IUserDocument) {
    const payload: UserPayload = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      avatar: user.avatar
    };
    const { accessToken, refreshToken } = TokenGenerator.generateToken(payload);
    await Token.findOneAndUpdate(
      { userId: user._id },
      {
        refreshToken,
        $unset: {
          verifyToken: 1,
          verifyTokenExpiresAt: 1
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    return { accessToken, refreshToken };
  }

  public async sendCode(user: IUserDocument, refreshToken: string) {
    const verifyCode = Math.floor(100000 + Math.random() * 900000);
    const encryptCode = cryptr.encrypt(verifyCode.toString());
    await Token.findOneAndUpdate(
      { userId: user._id },
      {
        refreshToken: refreshToken,
        verifyToken: encryptCode,
        verifyTokenExpiresAt: Date.now() + 15 * 60 * 1000
      },
      {
        upsert: true,
        new: true
      }
    );
    const template = verifyTemplate.verifyTemplate(`${user.firstName + ' ' + user.lastName}`, verifyCode);
    await mailTransport.sendMail(user.email, 'VERIFY ACCOUNT', template);
    return encryptCode;
  }

  public async revokeRefreshToken(token: string): Promise<void> {
    await Token.deleteOne({ refreshToken: token });
  }
}

export const authService: AuthService = new AuthService();
