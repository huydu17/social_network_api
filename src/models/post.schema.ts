import mongoose, { Types } from 'mongoose';
import { Privacy } from 'src/enums/privacy.enum';

const postSchema = new mongoose.Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', index: true },
    text: { type: String, default: '' },
    images: { type: Array, default: [] },
    gifUrl: { type: String, default: '' },
    videos: { type: Array, default: [] },
    feelings: { type: String, default: '' },
    privacy: { type: String, enum: Privacy, default: Privacy.PUBLIC },
    commentsCount: { type: Number, default: 0 },
    reactions: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      lovelove: { type: Number, default: 0 },
      haha: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      angry: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

const Post = mongoose.model('Post', postSchema);
export { Post };
