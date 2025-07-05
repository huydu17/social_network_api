import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    refreshToken: { type: String, default: '' },
    passwordResetToken: { type: String, default: '' },
    passwordResetTokenExpiresAt: { type: Number },
    verifyToken: { type: String, default: '' },
    verifyTokenExpiresAt: { type: Number }
  },
  {
    timestamps: true
  }
);

const Token = mongoose.model('Token', tokenSchema);
export { Token };
