import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import HTTP_STATUS from 'http-status-codes';
import { postService } from 'src/services/db/post.service';
import { UserPayload } from 'src/type';

class PostController {
  public async create(req: Request, res: Response): Promise<void> {
    const { body, files } = req;
    const file: UploadedFile = files?.images as UploadedFile;
    const currentUser = req.currentUser as UserPayload;
    const post = await postService.create(body, file, currentUser);
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Tạo bài viết thành công',
      data: post
    });
  }
  public async getAllPosts(req: Request, res: Response): Promise<void> {
    const pageNum = parseInt(req.query.page as string) || 1;
    const limitNum = parseInt(req.query.limit as string) || 10;
    const { posts, totalPosts } = await postService.getAllPosts(req.currentUser!, pageNum, limitNum);
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách bài viết thành công',
      data: {
        posts,
        totalPosts
      }
    });
  }
  public async getUserPosts(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const pageNum = parseInt(req.query.page as string) || 1;
    const limitNum = parseInt(req.query.limit as string) || 10;
    const { posts, totalPosts } = await postService.getUserPosts(userId, pageNum, limitNum);
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách bài viết của người dùng thành công',
      data: {
        posts,
        totalPosts
      }
    });
  }
  public async updatePost(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const { body } = req;
    const fileList: UploadedFile = req.files?.images as UploadedFile;
    const updatedPost = await postService.updatePost(postId, body, req.currentUser!, fileList);
    res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật bài viết thành công',
      data: updatedPost
    });
  }
  public async deletePost(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    await postService.deletePost(postId);
    res.status(HTTP_STATUS.OK).json({
      message: 'Xóa bài viết thành công'
    });
  }
}

export const postController: PostController = new PostController();
