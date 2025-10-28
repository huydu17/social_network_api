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
    const receiver: IUserDocument = (await userService.getUserById(`${receiverId}`)) as IUserDocument;
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

  public async getConversationsList(user: UserPayload): Promise<any[]> {
    const { userId } = user;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const lastMessages = await Message.aggregate([
      { $match: { $or: [{ senderId: userObjectId }, { receiverId: userObjectId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessageDoc: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$lastMessageDoc' } },
      { $sort: { createdAt: -1 } }
    ]);
    if (!lastMessages || lastMessages.length === 0) {
      return [];
    }

    const lastMessageIds = lastMessages.map((msg) => msg._id);
    const populatedLastMessages = await Message.find({ _id: { $in: lastMessageIds } })
      .populate('senderId', '_id firstName lastName avatar')
      .populate('receiverId', '_id firstName lastName avatar')
      .sort({ createdAt: -1 })
      .lean();

    const conversationList = populatedLastMessages
      .map((msg: any) => {
        const isSenderCurrentUser = msg.senderId?._id.toString() === userId.toString();
        const otherUser = isSenderCurrentUser ? msg.receiverId : msg.senderId;
        if (!otherUser) {
          return null;
        }
        return {
          chatItem: {
            conversationId: msg.conversationId,
            receiverId: {
              _id: otherUser._id,
              firstName: otherUser.firstName,
              lastName: otherUser.lastName,
              avatar: otherUser.avatar
            }
          },
          lastMessage: msg
        };
      })
      .filter((item) => item !== null);

    return conversationList;
  }

  public async getMessages(senderId: string, receiverId: string): Promise<IMessageDocument[]> {
    const query = {
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    };
    return await Message.find(query)
      .populate('senderId', '_id firstName lastName avatar')
      .populate('receiverId', '_id firstName lastName avatar')
      .sort({ createdAt: 1 })
      .lean();
  }
  public async markMessageAsDeleted(senderId: string, receiverId: string, messageId: string, type: string) {
    let updateQuery = {};
    if (type === DELETE_TYPE.FOR_ME) {
      updateQuery = { $set: { deleteForMe: true } };
    } else if (type === DELETE_TYPE.FOR_ALL) {
      updateQuery = { $set: { deleteForMe: true, deleteForEveryone: true } };
    }
    const updatedMessagePopulated = await Message.findOneAndUpdate(
      { _id: messageId, $or: [{ senderId }, { receiverId }] },
      updateQuery,
      { new: true }
    )
      .populate('senderId', '_id firstName lastName avatar')
      .populate('receiverId', '_id firstName lastName avatar')
      .lean();
    if (!updatedMessagePopulated) {
      throw new BadRequestException('Không tìm thấy tin nhắn');
    }
    const lastMessagePopulated = await Message.findOne({ conversationId: updatedMessagePopulated.conversationId })
      .sort({ createdAt: -1 })
      .populate('senderId', '_id firstName lastName avatar')
      .populate('receiverId', '_id firstName lastName avatar')
      .lean();
    socketChatIO.to(updatedMessagePopulated.conversationId.toString()).emit('update-message', updatedMessagePopulated);
    socketChatIO.emit('chat-list', lastMessagePopulated);
  }

  public async markMessageAsRead(senderId: string, receiverId: string) {
    const query = {
      $or: [
        { senderId, receiverId, isRead: false },
        { senderId: receiverId, receiverId: senderId, isRead: false }
      ]
    };
    const updateResult = await Message.updateMany(query, { $set: { isRead: true } }).exec();
    if (updateResult.modifiedCount > 0) {
      const conversation = await Conversation.findOne({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      });
      if (!conversation) return;
      const lastMessagePopulated = await Message.findOne({ conversationId: conversation._id })
        .sort({ createdAt: -1 })
        .populate('senderId', '_id firstName lastName avatar')
        .populate('receiverId', '_id firstName lastName avatar')
        .lean();
      socketChatIO.to(lastMessagePopulated!.conversationId.toString()).emit('update-message', lastMessagePopulated);
      socketChatIO.emit('chat-list', lastMessagePopulated);
    }
  }
  public async addMessageReaction(
    conversationId: string,
    messageId: string,
    reaction: string,
    senderReactionId: string,
    type: 'remove' | 'add'
  ) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new BadRequestException('Tin nhắn không tồn tại.');
    }
    console.log(type);
    if (type === 'add') {
      message.reaction = reaction;
    } else {
      message.reaction = '';
    }
    const messageUpdate = await message.save();
    socketChatIO.to(conversationId).emit('message-reaction', messageUpdate);
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
