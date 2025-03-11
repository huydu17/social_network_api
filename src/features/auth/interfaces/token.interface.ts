import { Document, ObjectId } from 'mongoose';

export interface ITokenDocument extends Document {
  userId: string | ObjectId;
  refreshToken: string;
  passwordResetToken?: string;
  passwordResetTokenExpiresAt?: number;
  verifyToken?: string;
  verifyTokenExpiresAt?: number;
}
