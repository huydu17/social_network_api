import mongoose from 'mongoose';
import { TYPE_REACT } from 'src/enums/type-react.enum';
const { ObjectId } = mongoose.Schema;
const reactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: TYPE_REACT,
      require: true
    },
    postId: { type: ObjectId, ref: 'Post' },
    user: { type: ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

const Reaction = mongoose.model('Reaction', reactionSchema);
export { Reaction };
