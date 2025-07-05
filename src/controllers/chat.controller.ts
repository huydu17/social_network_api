import { Request, Response } from 'express';
import { chatService } from 'src/services/db/chat.service';
import { UploadedFile } from 'src/services/db/cloudinary.service';

class ChatController {
  public async addMessage(req: Request, res: Response): Promise<void> {
    const file: UploadedFile = req.files?.image as UploadedFile;
    const message = await chatService.addMessage(req.body, file, req.currentUser!);
    res.status(200).json({
      message: 'Gửi tin nhắn thành công',
      data: message
    });
  }
  public async getConversationsList(req: Request, res: Response): Promise<void> {
    const conversations = await chatService.getConversationsList(`${req.currentUser?.userId}`);
    res.status(200).json({
      message: 'Lấy danh sách cuộc trò chuyện thành công',
      data: conversations
    });
  }
  public async getChatMessageList(req: Request, res: Response): Promise<void> {
    const messages = await chatService.getMessages(`${req.currentUser?.userId}`, req.params.receiverId);
    res.status(200).json({
      message: 'Lấy danh sách tin nhắn từ cuộc trò chuyện thành công',
      data: messages
    });
  }
  public async markMessageAsDeleted(req: Request, res: Response): Promise<void> {
    const { receiverId, messageId, type } = req.params;
    await chatService.markMessageAsDeleted(`${req.currentUser?.userId}`, receiverId, messageId, type);
    res.status(200).json({
      message: 'Xóa tin nhắn thành công'
    });
  }
  public async markMessageAsRead(req: Request, res: Response): Promise<void> {
    const { receiverId } = req.params;
    await chatService.markMessageAsRead(`${req.currentUser?.userId}`, receiverId);
    res.status(200).json({
      message: 'Đánh dấu tin nhắn đã đọc thành công'
    });
  }
  public async addMessageReaction(req: Request, res: Response): Promise<void> {
    const { conversationId, messageId, reaction, type } = req.body;
    await chatService.addMessageReaction(conversationId, messageId, reaction, `${req.currentUser?.userId}`, type);
    res.status(200).json({
      message: 'Thêm phản ứng cho tin nhắn thành công'
    });
  }
}
export const chatController: ChatController = new ChatController();
