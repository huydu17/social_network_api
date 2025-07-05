import express, { Router } from 'express';
import { chatController } from 'src/controllers/chat.controller';
import { authMiddlware } from 'src/middlewares/auth.middleware';
import { upload } from 'src/middlewares/upload';
import { verifiedMiddleware } from 'src/middlewares/verify.middleware';

class ChatRoute {
  private route: Router;
  constructor() {
    this.route = express.Router();
    this.route.use(authMiddlware.isLogin, verifiedMiddleware);
  }
  public routes(): Router {
    this.route.post('/chat/message', upload, chatController.addMessage);
    this.route.get('/chat/conversation-list', chatController.getConversationsList);
    this.route.get('/chat/message/:receiverId', chatController.getChatMessageList);
    this.route.delete('/chat/mark-as-deleted/:messageId/:receiverId/:type', chatController.markMessageAsDeleted);
    this.route.put('/chat/mask-as-read/:receiverId', chatController.markMessageAsRead);
    this.route.put('/chat/message/reaction', chatController.addMessageReaction);
    return this.route;
  }
}

export const chatRoute: ChatRoute = new ChatRoute();
