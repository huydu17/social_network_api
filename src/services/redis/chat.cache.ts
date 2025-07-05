import { filter, find, findIndex, remove } from 'lodash';
import { redisCache } from './redis.cache';
import { userCache } from './user.cache';
import { InternalException } from 'src/middlewares/globalErrorHandle';
import { IChatList, IGetMessageFromCache, IMessageDocument } from 'src/interfaces/chat.interface';
import { Helpers } from 'src/utils/helpers';
import { DELETE_TYPE } from 'src/constants/chat.constant';
import { IMessageReaction } from 'src/interfaces/reaction.interface';

class ChatCache {
  public async addChatListToCache(senderId: string, receiverId: string, conversationId: string): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const userChatList = await redisCache.client.LRANGE(`chatList:${senderId}`, 0, -1);
      if (userChatList.length === 0) {
        await redisCache.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
      } else {
        const receiverIndex: number = findIndex(userChatList, (listItem: string) => listItem.includes(receiverId));
        if (receiverIndex < 0) {
          await redisCache.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
        }
      }
    } catch (err) {
      throw new InternalException('Lỗi máy chủ. Vui lòng thử lại.');
    }
    0;
  }

  public async addChatMessageToCache(conversationId: string, value: IMessageDocument): Promise<void> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      await redisCache.client.RPUSH(`messages:${conversationId}`, JSON.stringify(value));
    } catch (error) {
      throw new InternalException('Lỗi máy chủ. Vui lòng thử lại.');
    }
  }

  public async getUserConversationList(key: string): Promise<IMessageDocument[]> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const userChatList: string[] = await redisCache.client.LRANGE(`chatList:${key}`, 0, -1);
      const conversationList: any = [];
      for (const item of userChatList) {
        const chatItem: IChatList = Helpers.parseJson(item) as IChatList;
        const lastMessage: string = (await redisCache.client.LINDEX(
          `messages:${chatItem.conversationId}`,
          -1
        )) as string;
        const formattedReceiver = await userCache.getFormattedUserResponse(`${chatItem.receiverId}`);
        const data = {
          lastMessage: Helpers.parseJson(lastMessage),
          chatItem: {
            ...chatItem,
            receiverId: formattedReceiver
          }
        };
        conversationList.push(data);
      }
      return conversationList;
    } catch (error) {
      throw new InternalException('Lỗi máy chủ. Vui lòng thử lại.');
    }
  }
  public async getChatMessageFromCache(senderId: string, receiverId: string): Promise<IMessageDocument[]> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const userChatList: string[] = await redisCache.client.LRANGE(`chatList:${senderId}`, 0, -1);
      const receiver: string = find(userChatList, (listItem: string) => listItem.includes(receiverId)) as string;
      const parsedReceiver: IChatList = Helpers.parseJson(receiver) as IChatList;
      if (parsedReceiver) {
        const userMessages: string[] = await redisCache.client.LRANGE(
          `messages:${parsedReceiver.conversationId}`,
          0,
          -1
        );
        const chatMessages: IMessageDocument[] = [];
        for (const item of userMessages) {
          const chatItem = Helpers.parseJson(item) as IMessageDocument;
          chatMessages.push(chatItem);
        }
        const messageList: any = await this.formatMessageList(chatMessages);
        return messageList;
      } else {
        return [];
      }
    } catch (error) {
      throw new InternalException('Lỗi máy chủ. Vui lòng thử lại.');
    }
  }
  public async markMessageAsDeleted(
    senderId: string,
    receiverId: string,
    messageId: string,
    type: string
  ): Promise<IMessageDocument> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const { index, message, receiver } = await this.getMessage(senderId, receiverId, messageId);
      const chatItem = Helpers.parseJson(message) as IMessageDocument;
      if (type === DELETE_TYPE.FOR_ME) {
        chatItem.deleteForMe = true;
      } else if (type === DELETE_TYPE.FOR_ALL) {
        chatItem.deleteForMe = true;
        chatItem.deleteForEveryone = true;
      }
      await redisCache.client.LSET(`messages:${receiver.conversationId}`, index, JSON.stringify(chatItem));
      const [updatedMessage, lastMessage] = await Promise.all([
        redisCache.client.LINDEX(`messages:${receiver.conversationId}`, index),
        redisCache.client.LINDEX(`messages:${receiver.conversationId}`, -1) // -1 = last message
      ]);
      const parsedUpdatedMessage: IMessageDocument = Helpers.parseJson(updatedMessage as string);
      const parsedLastMessage: IMessageDocument = Helpers.parseJson(lastMessage as string);
      const [formattedUpdateMessage, formattedLastMessage] = await Promise.all([
        this.formatSingleMessage(parsedUpdatedMessage),
        this.formatSingleMessage(parsedLastMessage)
      ]);
      return { formattedUpdateMessage, formattedLastMessage } as any;
    } catch (error) {
      throw new InternalException('Lỗi máy chủ. Vui lòng thử lại.');
    }
  }
  public async updateMessageAsRead(senderId: string, receiverId: string): Promise<IMessageDocument> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const userChatList = await redisCache.client.LRANGE(`chatList:${senderId}`, 0, -1);
      const receiver: string = find(userChatList, (listItem: string) => listItem.includes(receiverId)) as string;
      const parsedReceiver: IChatList = Helpers.parseJson(receiver) as IChatList;
      const messagesList: string[] = (await redisCache.client.LRANGE(
        `messages:${parsedReceiver.conversationId}`,
        0,
        -1
      )) as string[];
      const unreadMessages: string[] = filter(messagesList, (listItem: string) => !Helpers.parseJson(listItem).isRead);
      for (const item of unreadMessages) {
        const chatItem = Helpers.parseJson(item) as IMessageDocument;
        const index = findIndex(messagesList, (listItem: string) => listItem.includes(`${chatItem._id}`));
        chatItem.isRead = true;
        await redisCache.client.LSET(`messages:${chatItem.conversationId}`, index, JSON.stringify(chatItem));
      }
      const lastMessage: string = (await redisCache.client.LINDEX(
        `messages:${parsedReceiver.conversationId}`,
        -1
      )) as string;
      const parsedLastMessage: IMessageDocument = Helpers.parseJson(lastMessage) as IMessageDocument;
      const formattedLastMessage: any = await this.formatSingleMessage(parsedLastMessage);
      return formattedLastMessage;
    } catch (error) {
      throw new InternalException('Lỗi máy chủ. Vui lòng thử lại.');
    }
  }
  public async updateMessageReaction(
    conversationId: string,
    messageId: string,
    reaction: string,
    senderReactionId: string,
    type: string
  ): Promise<IMessageDocument> {
    try {
      if (!redisCache.client.isOpen) {
        await redisCache.connect();
      }
      const messages: string[] = await redisCache.client.LRANGE(`messages:${conversationId}`, 0, -1);
      const messageIndex: number = findIndex(messages, (listItem: string) => listItem.includes(messageId));
      const message: string = (await redisCache.client.LINDEX(`messages:${conversationId}`, messageIndex)) as string;
      const parsedMessage: any = Helpers.parseJson(message) as IMessageDocument;
      if (parsedMessage) {
        remove(parsedMessage.reaction, (reaction: IMessageReaction) => reaction.senderReactionId === senderReactionId);
        if (type === 'add') {
          parsedMessage.reaction = reaction;
          await redisCache.client.LSET(`messages:${conversationId}`, messageIndex, JSON.stringify(parsedMessage));
        } else {
          parsedMessage.reaction = '';
          await redisCache.client.LSET(`messages:${conversationId}`, messageIndex, JSON.stringify(parsedMessage));
        }
      }
      const updatedMessage: string = (await redisCache.client.LINDEX(
        `messages:${conversationId}`,
        messageIndex
      )) as string;
      return Helpers.parseJson(updatedMessage) as IMessageDocument;
    } catch (error) {
      throw new InternalException('Lỗi máy chủ. Vui lòng thử lại.');
    }
  }
  private async getMessage(senderId: string, receiverId: string, messageId: string): Promise<IGetMessageFromCache> {
    const userChatList = await redisCache.client.LRANGE(`chatList:${senderId}`, 0, -1);
    const receiver: string = find(userChatList, (listItem: string) => listItem.includes(receiverId)) as string;
    const parsedReceiver: IChatList = Helpers.parseJson(receiver) as IChatList;
    const messagesList: string[] = (await redisCache.client.LRANGE(
      `messages:${parsedReceiver.conversationId}`,
      0,
      -1
    )) as string[];
    const message: string = find(messagesList, (listItem: string) => listItem.includes(messageId)) as string;
    const messageIndex: number = findIndex(messagesList, (listItem: string) => listItem.includes(messageId)) as number;
    return { index: messageIndex, message, receiver: parsedReceiver };
  }
  private async formatSingleMessage(message: IMessageDocument) {
    return {
      ...message,
      receiverId: await userCache.getFormattedUserResponse(`${message.receiverId}`),
      senderId: await userCache.getFormattedUserResponse(`${message.senderId}`)
    };
  }
  private async formatMessageList(messages: IMessageDocument[]) {
    return await Promise.all(messages.map((msg) => this.formatSingleMessage(msg)));
  }
}

export const chatCache: ChatCache = new ChatCache();
