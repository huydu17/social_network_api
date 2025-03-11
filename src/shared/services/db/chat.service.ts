import mongoose, { ObjectId } from 'mongoose';
import { IMessageData, IMessageDocument } from 'src/features/chat/interfaces/chat.interface';
import { IConversationDocument } from 'src/features/chat/interfaces/conversation.interface';
import { Message } from 'src/features/chat/models/chat.schema';
import { Conversation } from 'src/features/chat/models/conversation.schema';
import { UserPayload } from 'src/type';
import { cloudinaryService, UploadedFile } from './cloudinary.service';
import { chatCache } from '../redis/chat.cache';
import { DELETE_TYPE } from 'src/features/chat/constants/chat.constant';

class ChatService {
  public async addMessage(data: IMessageData, file: UploadedFile, currentUser: UserPayload) {
    const { conversationId, receiverId, textMessage, gifUrl, isRead } = data;
    const image = file ? await cloudinaryService.upload(file, 'chat') : '';
    const conversationObjectId = !conversationId ? new mongoose.Types.ObjectId() : conversationId;
    const conversation: IConversationDocument[] = (await Conversation.find({
      _id: conversationObjectId
    })) as IConversationDocument[];
    if (conversation.length === 0) {
      await Conversation.create({
        _id: conversationObjectId,
        senderId: currentUser.userId,
        receiverId
      });
    }
    const message: IMessageDocument = await Message.create({
      conversationId: conversationObjectId,
      senderId: currentUser.userId,
      receiverId,
      textMessage,
      gifUrl,
      isRead,
      selectedImage: image.url
    });
    await chatCache.addChatListToCache(`${currentUser.userId}`, `${receiverId}`, `${conversationObjectId}`);
    await chatCache.addChatListToCache(`${receiverId}`, `${currentUser.userId}`, `${conversationObjectId}`);
    await chatCache.addChatMessageToCache(`${conversationObjectId}`, message);
    return conversationObjectId;
  }
  public async getConversationsList(userId: string): Promise<IMessageDocument[]> {
    let chatList: IMessageDocument[] = [];
    const chatListCache: IMessageDocument[] = await chatCache.getUserConversationList(userId);
    console.log(chatListCache);
    if (chatListCache.length > 0) {
      chatList = chatListCache;
    } else {
      chatList = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }]
      })
        .populate('receiverId', '_id firstName lastName avatar')
        .sort({ createdAt: 1 });
    }
    return chatList;
  }
  public async getMessages(senderId: string, receiverId: string): Promise<IMessageDocument[]> {
    const query = {
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    };
    const messageFromCache = await chatCache.getChatMessageFromCache(senderId, receiverId);
    if (messageFromCache.length < 0) {
      return messageFromCache;
    } else {
      return await Message.find(query).populate('receiverId', '_id firstName lastName avatar').sort({ createdAt: 1 });
    }
  }
  public async markMessageAsDeleted(senderId: string, receiverId: string, messageId: string, type: string) {
    if (type === DELETE_TYPE.FOR_ME) {
      await Message.updateOne({ _id: messageId }, { deleteForMe: true }).exec();
    } else if (type === DELETE_TYPE.FOR_EVERYONE) {
      await Message.updateOne({ _id: messageId }, { deleteForMe: true, deleteForEveryone: true }).exec();
    }
    const updateMessageCache = await chatCache.markMessageAsDeleted(senderId, receiverId, messageId, type);
  }

  public async markMessageAsRead(senderId: string, receiverId: string) {
    const query = {
      $or: [
        { senderId, receiverId, isRead: false },
        { senderId: receiverId, receiverId: senderId, isRead: false }
      ]
    };
    await Message.updateMany(query, { $set: { isRead: true } }).exec();
    await chatCache.updateChatMessage(senderId, receiverId);
  }
  public async addMessageReaction(
    conversationId: string,
    messageId: string,
    reaction: string,
    senderReactionId: string,
    type: 'remove' | 'add'
  ) {
    if (type === 'add') {
      await Message.updateOne({ _id: messageId }, { $push: { reaction: { senderReactionId, type: reaction } } }).exec();
    } else {
      await Message.updateOne({ _id: messageId }, { $pull: { reaction: { senderReactionId } } }).exec();
    }
    await chatCache.updateMessageReaction(conversationId, messageId, reaction, senderReactionId, type);
  }
}

export const chatService: ChatService = new ChatService();
