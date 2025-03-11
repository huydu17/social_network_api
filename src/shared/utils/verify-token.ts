import jwt from 'jsonwebtoken';
import { appConfig } from '../config/appConfig';
export const verifyToken = (token: string) => {
  return jwt.verify(token, appConfig.JWT_SECRET!);
};
