import { Request, Response } from 'express';
import { chatService } from 'src/shared/services/db/chat.service';
import { UploadedFile } from 'src/shared/services/db/cloudinary.service';

class ChatController {
  public async addMessage(req: Request, res: Response): Promise<void> {
    const file: UploadedFile = req.files?.image as UploadedFile;
    const conversationId = await chatService.addMessage(req.body, file, req.currentUser!);
    res.status(200).json({
      message: 'Message sent successfully',
      conversationId
    });
  }
  public async getConversationsList(req: Request, res: Response): Promise<void> {
    const conversations = await chatService.getConversationsList(`${req.currentUser?.userId}`);
    res.status(200).json({
      message: 'Get all conversations',
      data: conversations
    });
  }
  public async getChatMessageList(req: Request, res: Response): Promise<void> {
    const conversations = await chatService.getMessages(`${req.currentUser?.userId}`, req.params.receiverId);
    res.status(200).json({
      message: 'Get all messages from conversation',
      data: conversations
    });
  }
  public async markMessageAsDeleted(req: Request, res: Response): Promise<void> {
    const { receiverId, messageId, type } = req.params;
    await chatService.markMessageAsDeleted(`${req.currentUser?.userId}`, receiverId, messageId, type);
    res.status(200).json({
      message: 'Message deleted successfully'
    });
  }
  public async markMessageAsRead(req: Request, res: Response): Promise<void> {
    const { receiverId } = req.params;
    await chatService.markMessageAsRead(`${req.currentUser?.userId}`, receiverId);
    res.status(200).json({
      message: 'Message read successfully'
    });
  }
  public async addMessageReaction(req: Request, res: Response): Promise<void> {
    const { conversationId, messageId, reaction, type } = req.body;
    await chatService.addMessageReaction(conversationId, messageId, reaction, `${req.currentUser?.userId}`, type);
    res.status(200).json({
      message: 'Message reaction added successfully'
    });
  }
}
export const chatController: ChatController = new ChatController();
