import mongoose, { ObjectId } from 'mongoose';
import { UserPayload } from 'src/type';
import { cloudinaryService, UploadedFile } from './cloudinary.service';
import { chatCache } from '../redis/chat.cache';
import { socketChatIO } from '../sockets/chat.socket';
import { userService } from './user.service';
import { userCache } from '../redis/user.cache';
import { socketUserIO } from '../sockets/user.socket';
import { IMessageData, IMessageDocument } from 'src/interfaces/chat.interface';
import { Conversation } from 'src/models/conversation.schema';
import { IConversationDocument } from 'src/interfaces/conversation.interface';
import { Message } from 'src/models/chat.schema';
import { IUserDocument, UserReadStatusCache } from 'src/interfaces/user.interface';
import { DELETE_TYPE } from 'src/constants/chat.constant';
import { BadRequestException } from 'src/middlewares/globalErrorHandle';

class ChatService {
  public async addMessage(data: IMessageData, file: UploadedFile, currentUser: UserPayload) {
    const { conversationId, receiverId, textMessage, gifUrl } = data;
    const image = file ? await cloudinaryService.upload(file, 'chat') : '';
    const conversationObjectId = !conversationId ? new mongoose.Types.ObjectId() : conversationId;
    const conversation: IConversationDocument = (await Conversation.findById({
      _id: conversationObjectId
    })) as IConversationDocument;
    const message: IMessageDocument = await Message.create({
      conversationId: conversationObjectId,
      senderId: currentUser.userId,
      receiverId,
      textMessage,
      gifUrl,
      selectedImage: image.url
    });
    const receiver: IUserDocument = (await userCache.getUserFromCache(`${receiverId}`)) as IUserDocument;
    if (!conversation) {
      await Conversation.create({
        _id: conversationObjectId,
        senderId: currentUser.userId,
        receiverId: receiverId
      });
      socketChatIO
        .to(message.senderId.toString())
        .to(message.receiverId.toString())
        .emit('new-conversation', {
          chatItem: {
            conversationId: conversationObjectId,
            receiverId: {
              _id: receiver?._id,
              firstName: receiver?.firstName,
              lastName: receiver?.lastName,
              avatar: receiver?.avatar
            }
          },
          lastMessage: message
        });
    }
    const formattedMessage = await this.formatMessage(message, currentUser);
    await chatCache.addChatListToCache(`${currentUser.userId}`, `${receiverId}`, `${conversationObjectId}`);
    await chatCache.addChatListToCache(`${receiverId}`, `${currentUser.userId}`, `${conversationObjectId}`);
    await chatCache.addChatMessageToCache(`${conversationObjectId}`, message);
    if (receiver.notifications.messages && currentUser.userId !== receiverId) {
      const data: UserReadStatusCache = (await userCache.updateMessageStatusFromCache(
        `${receiverId}`,
        false
      )) as UserReadStatusCache;
      socketUserIO?.to(message.senderId.toString()).to(message.receiverId.toString()).emit('message-status', data);
    }
    socketChatIO.to(message.conversationId.toString()).emit('received-message', formattedMessage);
    socketChatIO.to(currentUser.userId.toString()).emit('chat-list', message);
    socketChatIO.to(receiverId.toString()).emit('chat-list', message);
    return message;
  }

  public async getConversationsList(userId: string): Promise<IMessageDocument[]> {
    let chatList: IMessageDocument[] = [];
    const chatListCache: any = await chatCache.getUserConversationList(userId);
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
    if (messageFromCache.length > 0) {
      return messageFromCache;
    } else {
      return await Message.find(query).populate('receiverId', '_id firstName lastName avatar').sort({ createdAt: 1 });
    }
  }
  public async markMessageAsDeleted(senderId: string, receiverId: string, messageId: string, type: string) {
    if (type === DELETE_TYPE.FOR_ME) {
      await Message.updateOne({ _id: messageId }, { deleteForMe: true }).exec();
    } else if (type === DELETE_TYPE.FOR_ALL) {
      await Message.updateOne({ _id: messageId }, { deleteForMe: true, deleteForEveryone: true }).exec();
    }
    const { formattedUpdateMessage, formattedLastMessage }: any = await chatCache.markMessageAsDeleted(
      senderId,
      receiverId,
      messageId,
      type
    );
    socketChatIO.to(formattedUpdateMessage.conversationId.toString()).emit('update-message', formattedUpdateMessage);
    socketChatIO.emit('chat-list', formattedLastMessage);
  }

  public async markMessageAsRead(senderId: string, receiverId: string) {
    const query = {
      $or: [
        { senderId, receiverId, isRead: false },
        { senderId: receiverId, receiverId: senderId, isRead: false }
      ]
    };
    await Message.updateMany(query, { $set: { isRead: true } }).exec();
    const lastMessage = await chatCache.updateMessageAsRead(senderId, receiverId);
    socketChatIO.to(lastMessage.conversationId.toString()).emit('update-message', lastMessage);
    socketChatIO.emit('chat-list', lastMessage);
  }
  public async addMessageReaction(
    conversationId: string,
    messageId: string,
    reaction: string,
    senderReactionId: string,
    type: 'remove' | 'add'
  ) {
    if (type === 'add') {
      await Message.updateOne({ _id: messageId }, { reaction: reaction }).exec();
    } else {
      await Message.updateOne({ _id: messageId }, { reaction: '' }).exec();
    }
    const messageReaction = await chatCache.updateMessageReaction(
      conversationId,
      messageId,
      reaction,
      senderReactionId,
      type
    );
    socketChatIO.to(conversationId).emit('message-reaction', messageReaction);
  }
  private async formatMessage(message: IMessageDocument, currentUser: UserPayload) {
    const receiverInfo: IUserDocument = (await userService.getUserById(`${message.receiverId}`)) as IUserDocument;
    if (!receiverInfo) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }
    return {
      _id: message._id,
      conversationId: message.conversationId,
      textMessage: message.textMessage,
      gifUrl: message.gifUrl,
      selectedImage: message.selectedImage,
      senderId: {
        _id: currentUser.userId,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        avatar: currentUser.avatar
      },
      receiverId: {
        _id: receiverInfo._id,
        firstName: receiverInfo.firstName,
        lastName: receiverInfo.lastName,
        avatar: receiverInfo.avatar
      },
      createdAt: message.createdAt,
      reaction: message.reaction
    };
  }
}

export const chatService: ChatService = new ChatService();
