import { Response } from 'express';
import { appConfig } from '../config/appConfig';
import { ACCESSTOKEN, REFRESHTOKEN } from 'src/constants/token.constants';

export const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie(ACCESSTOKEN, accessToken, {
    httpOnly: true,
    secure: appConfig.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 14 * 60 * 1000
  });
  res.cookie(REFRESHTOKEN, refreshToken, {
    httpOnly: true,
    secure: appConfig.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};
