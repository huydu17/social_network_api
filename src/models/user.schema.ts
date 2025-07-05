import mongoose, { model, Model, Schema } from 'mongoose';
import { hash, compare } from 'bcryptjs';
import { Gender } from '../enums/gender.enum';
import { Relationship } from '../enums/relationship.enum';
import { IUserDocument } from 'src/interfaces/user.interface';
const SALT_ROUND = 10;
const AVATAR_URL = 'https://res.cloudinary.com/db5xbbdbc/image/upload/v1727270247/images_mtg1mj.jpg';
const COVER_URL =
  'https://res.cloudinary.com/db5xbbdbc/image/upload/v1750343371/Screenshot_2025-06-19_212807_hciqwp.png';

const userSchema: Schema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    userName: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String },
    avatar: { type: String, default: AVATAR_URL },
    bgImage: { type: String, default: COVER_URL },
    bYear: { type: Number },
    bMonth: { type: Number },
    bDay: { type: Number },
    gender: { type: String, enum: Gender },
    verified: { type: Boolean, default: false },
    friends: [{ type: mongoose.Types.ObjectId, ref: 'User', default: [] }],
    following: [{ type: mongoose.Types.ObjectId, ref: 'User', default: [] }],
    follower: [{ type: mongoose.Types.ObjectId, ref: 'User', default: [] }],
    requests: [{ type: mongoose.Types.ObjectId, ref: 'User', default: [] }],
    details: {
      bio: { type: String, default: '' },
      workplace: { type: String, default: '' },
      school: { type: String, default: '' },
      location: { type: String, default: '' },
      relationship: {
        type: String,
        enum: Relationship,
        default: Relationship.SINGLE
      }
    },
    notifications: {
      messages: { type: Boolean, default: true },
      reactions: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true }
    },
    searchHistory: [
      {
        user: {
          type: mongoose.Types.ObjectId,
          ref: 'User'
        },
        createAt: Date
      }
    ]
  },
  {
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      }
    },
    timestamps: true
  }
);

userSchema.pre('save', async function (this: IUserDocument, next: () => void) {
  if (!this.isModified('password')) return next();
  this.password = await hash(this.password as string, SALT_ROUND);
  next();
});
userSchema.methods.comparePassword = async function (password: string) {
  const hashedPassword: string = this.password!;
  return compare(password, hashedPassword);
};
const User: Model<IUserDocument> = model<IUserDocument>('User', userSchema, 'User');
export { User };
