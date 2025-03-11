import mongoose, { model, Model, Schema } from 'mongoose';
import { IConversationDocument } from '../interfaces/conversation.interface';

const conversationSchema: Schema = new mongoose.Schema({
  senderId: { type: mongoose.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Types.ObjectId, ref: 'User' }
});

const Conversation: Model<IConversationDocument> = model<IConversationDocument>('Conversation', conversationSchema);
export { Conversation };
