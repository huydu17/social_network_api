import { Helpers } from 'src/shared/utils/helpers';
import { BadRequestException, UnAuthorizedException } from 'src/shared/middlewares/globalErrorHandle';
import { TokenGenerator } from 'src/shared/utils/genarateToken';
import { IUserDocument } from 'src/features/users/interfaces/user.interface';
import { verifyToken } from 'src/shared/utils/verify-token';
import { User } from 'src/features/users/models/user.schema';
import { IRefreshToken } from 'src/features/auth/interfaces/refreshToken.interface';
import { Token } from 'src/features/auth/models/token.schema';
import { userService } from './user.service';
import { userCache } from '../redis/user.cache';
import { IRegisterData } from 'src/features/auth/interfaces/register.interface';
import { ILoginData } from 'src/features/auth/interfaces/login.interface';
import { UserPayload } from 'src/type';
import { generateRadomHex } from 'src/shared/utils/generateRandomHex';
import { mailTransport } from '../email/email.transport';
import { appConfig } from 'src/shared/config/appConfig';
import { resetTemplate } from '../email/templates/reset-password/reset-password';
import { ITokenDocument } from 'src/features/auth/interfaces/token.interface';
import { verifyTemplate } from '../email/templates/verify-user/verify-user';
import Cryptr from 'cryptr';
import { IChangePassword } from 'src/features/auth/interfaces/change-password';
const cryptr = new Cryptr(appConfig.CRYPTR_KEY!);
class AuthService {
  public async register(requestBody: IRegisterData) {
    const { email } = requestBody;
    const existingUser: IUserDocument = (await userService.getUserByEmail(email)) as IUserDocument;
    if (existingUser) {
      throw new BadRequestException('Account already exists');
    }
    const data = await this.registerData(requestBody);
    const user: IUserDocument = await User.create(data);
    const { accessToken, refreshToken } = await this.generateAndSaveTokens(user);
    const verifyCode = Math.floor(100000 + Math.random() * 900000);
    const encryptCode = cryptr.encrypt(verifyCode.toString());
    await Token.create({
      userId: user._id,
      refreshToken: refreshToken,
      verifyToken: encryptCode,
      verifyTokenExpiresAt: Date.now() + 15 * 60 * 1000
    });
    const template = verifyTemplate.verifyTemplate(`${user.firstName + ' ' + user.lastName}`, verifyCode);
    await mailTransport.sendMail(user.email, 'VERIFY ACCOUNT', template);
    await userCache.saveUserToCache(`${user._id}`, user);
    return { accessToken, refreshToken, user, verifyToken: encryptCode };
  }

  public async verifyUser(verifyToken: string, code: number): Promise<void> {
    const token: ITokenDocument | null = await this.getTokenByVerficationToken(verifyToken);
    if (!token) {
      throw new BadRequestException('Invalid verification token');
    }
    console.log(token);
    const user: IUserDocument = (await userService.getUserById(`${token.userId}`)) as IUserDocument;
    const decryptToken: string = cryptr.decrypt(verifyToken);
    if (code.toString() !== decryptToken) {
      throw new BadRequestException('Incorrect verification code');
    }
    console.log(user);
    user.verified = true;
    token.verifyToken = undefined;
    token.verifyTokenExpiresAt = undefined;
    await Promise.all([token.save(), user.save()]);
  }

  public async login(requestBody: ILoginData) {
    const { emailOrUsername, password } = requestBody;
    const userFound: IUserDocument | null = await userService.getUserByEmailOrUsername(emailOrUsername);
    if (!userFound) {
      throw new BadRequestException('Account does not exist');
    }
    const isMatch = await userFound.comparePassword(password);
    if (!userFound) {
      throw new BadRequestException('Account does not exist');
    }
    const { accessToken, refreshToken } = await this.generateAndSaveTokens(userFound);
    const token: ITokenDocument | null = await Token.findOne({ userId: userFound._id.toString() });
    if (!token) {
      throw new BadRequestException('Invalid verification token');
    }
    token.refreshToken = refreshToken;
    await token.save();
    return { accessToken, refreshToken, userFound };
  }

  public async refreshToken(requestBody: IRefreshToken) {
    const { refreshToken } = requestBody;
    if (!refreshToken) {
      throw new UnAuthorizedException('Refresh token is required');
    }
    const payload: UserPayload | any = verifyToken(refreshToken);
    if (!payload) {
      throw new UnAuthorizedException('Invalid refresh token');
    }
    const token = await Token.findOne({ refreshToken: refreshToken });
    if (!token) {
      throw new UnAuthorizedException('Invalid refresh token or user not found');
    }
    const { iat, exp, aud, iss, ...newPayload } = payload;
    const tokens = TokenGenerator.generateToken(newPayload);
    await Token.findByIdAndUpdate({ _id: token._id }, { refreshToken: tokens.refreshToken });
    return tokens;
  }

  public async forgotPassword(email: string): Promise<void> {
    const existingUser: IUserDocument = (await userService.getUserByEmail(email)) as IUserDocument;
    if (!existingUser) {
      throw new BadRequestException('Account does not exist');
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
        'Your verification code has expired or is invalid. Please request a new verification code from your email.'
      );
    }
    const user: IUserDocument = (await userService.getUserById(`${tokenFound.userId}`)) as IUserDocument;
    user.password = password;
    tokenFound.passwordResetToken = undefined;
    tokenFound.passwordResetTokenExpiresAt = undefined;
    await Promise.all([tokenFound.save(), user.save()]);
  }
  public async changePassword(requestBody: IChangePassword, currentUser: UserPayload) {
    const { password } = requestBody;
    const user: IUserDocument = (await userService.getUserByEmail(currentUser.email)) as IUserDocument;
    user.password = password;
    await user.save();
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
    const existingToken: ITokenDocument = (await Token.findOne({ userId })) as ITokenDocument;
    if (!existingToken) {
      throw new BadRequestException('Reset token is invalid');
    }
    existingToken.passwordResetToken = resetToken;
    existingToken.passwordResetTokenExpiresAt = tokenExpires;
    await existingToken.save();
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
    await Token.create({
      userId: user._id,
      refreshToken
    });
    return { accessToken, refreshToken };
  }
}

export const authService: AuthService = new AuthService();
