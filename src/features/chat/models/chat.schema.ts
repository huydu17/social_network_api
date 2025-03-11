import mongoose, { model, Model, Schema } from 'mongoose';
import { IMessageDocument } from '../interfaces/chat.interface';

const messageSchema: Schema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Types.ObjectId, ref: 'Conversation' },
    senderId: { type: mongoose.Types.ObjectId, ref: 'User' },
    receiverId: { type: mongoose.Types.ObjectId, ref: 'User' },
    textMessage: { type: String, default: '' },
    gifUrl: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    selectedImage: { type: String, default: '' },
    reaction: Array,
    deleteForMe: { type: Boolean, default: false },
    deleteForEveryone: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

const Message: Model<IMessageDocument> = model<IMessageDocument>('Message', messageSchema);
export { Message };
