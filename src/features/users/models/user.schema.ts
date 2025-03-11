import mongoose, { model, Model, Schema } from 'mongoose';
import { hash, compare } from 'bcryptjs';
import { Gender } from '../enums/gender.enum';
import { Relationship } from '../enums/relationship.enum';
import { IUserDocument } from '../interfaces/user.interface';
const SALT_ROUND = 10;
const AVATAR_URL = 'https://res.cloudinary.com/db5xbbdbc/image/upload/v1727270247/images_mtg1mj.jpg';
const userSchema: Schema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    userName: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String },
    avatar: { type: String, default: AVATAR_URL },
    bgImage: { type: String, default: '' },
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
      otherName: { type: String, default: '' },
      job: { type: String, default: '' },
      workplace: { type: String, default: '' },
      highSchool: { type: String, default: '' },
      college: { type: String, default: '' },
      currentCity: { type: String, default: '' },
      hometown: { type: String, default: '' },
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
