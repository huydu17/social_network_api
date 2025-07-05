import jwt, { sign } from 'jsonwebtoken';
import { appConfig } from '../config/appConfig';
import { ObjectId } from 'mongoose';

export class TokenGenerator {
  private static signToken(payload: any, expiresIn: string) {
    return sign(payload, appConfig.JWT_SECRET!, {
      expiresIn,
      issuer: appConfig.JWT_TOKEN_ISSUER,
      audience: appConfig.JWT_TOKEN_AUDIENCE
    });
  }
  public static generateToken(payload: any) {
    const accessToken = this.signToken(payload, appConfig.JWT_ACCESS_TOKEN_TTL!);
    const refreshToken = this.signToken(payload, appConfig.JWT_REFRESH_TOKEN_TTL!);
    return { accessToken, refreshToken };
  }
}
