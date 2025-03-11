import mongoose, { Document, ObjectId } from 'mongoose';
import { Relationship } from '../enums/relationship.enum';
import { Gender } from '../enums/gender.enum';

export interface IUserDocument extends Document {
  _id: string | mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  avatar: string;
  bgImage: string;
  bYear: number;
  bMonth: number;
  bDay: number;
  gender: Gender;
  verified: boolean;
  friends: string[];
  following: string[];
  follower: string[];
  requests: string[];
  notifications: INotificationSettings;
  searchHistory: ISeachUser[];
  details: IDetailsInfo;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface ISeachUser {
  _id?: ObjectId;
  user: string;
  createAt: Date;
}

export interface IDetailsInfo {
  bio: string;
  otherName: string;
  job: string;
  workplace: string;
  highSchool: string;
  college: string;
  currentCity: string;
  hometown: string;
  relationship: Relationship;
}
export interface INotificationSettings {
  messages: boolean;
  reactions: boolean;
  comments: boolean;
  follows: boolean;
}

export interface IUserSummary {
  _id: string | ObjectId;
  firstName: string;
  lastName: string;
  avatar: string;
}
