import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}
export interface UserPayload {
  userId: mongoose.Types.ObjectId | string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  avatar: string;
}
