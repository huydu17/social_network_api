import express, { Router } from 'express';
import { authMiddlware } from 'src/shared/middlewares/auth.middleware';
import { validateSchema } from 'src/shared/middlewares/joi-validate.middleware';
import { chatController } from '../controllers/chat.controller';
import { upload } from 'src/shared/middlewares/upload';
class ChatRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
  }
  public routes(): Router {
    this.route.post('/chat/message', authMiddlware.isLogin, upload, chatController.addMessage);
    this.route.get('/chat/conversation-list', authMiddlware.isLogin, chatController.getConversationsList);
    this.route.get('/chat/message/:receiverId', authMiddlware.isLogin, chatController.getChatMessageList);
    this.route.delete(
      '/chat/mark-as-deleted/:messageId/:receiverId/:type',
      authMiddlware.isLogin,
      chatController.markMessageAsDeleted
    );
    this.route.put('/chat/mask-as-read/:receiverId', authMiddlware.isLogin, chatController.markMessageAsRead);
    this.route.put('/chat/message/reaction', authMiddlware.isLogin, chatController.addMessageReaction);
    return this.route;
  }
}

export const chatRoute: ChatRoute = new ChatRoute();
