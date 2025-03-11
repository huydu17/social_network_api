import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { postService } from 'src/shared/services/db/post.service';
import { IPostDocument } from '../interfaces/post.interface';
import { UserPayload } from 'src/type';
import { UploadedFile } from 'src/shared/services/db/cloudinary.service';
class PostController {
  public async create(req: Request, res: Response): Promise<void> {
    const { body, files } = req;
    const fileList: UploadedFile = req.files?.images as UploadedFile;
    const currentUser = req.currentUser as UserPayload;
    const post = await postService.create(body, fileList, currentUser);
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Create post successfully',
      data: post
    });
  }
  public async getAllPosts(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const posts = await postService.getAllPosts(req.currentUser!, parseInt(page));
    res.status(HTTP_STATUS.OK).json({
      message: 'Get Posts Successfully',
      data: posts
    });
  }
  public async getUserPosts(req: Request, res: Response): Promise<void> {
    const { page, userId } = req.params;
    const posts = await postService.getUserPosts(userId, parseInt(page));
    res.status(HTTP_STATUS.OK).json({
      message: 'Get User Posts Successfully',
      data: posts
    });
  }

  public async updatePost(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const { body } = req;
    const fileList: UploadedFile = req.files?.images as UploadedFile;
    const updatedPost = await postService.updatePost(postId, body, req.currentUser!, fileList);
    res.status(HTTP_STATUS.OK).json({
      message: 'Update post successfully',
      data: updatedPost
    });
  }
  public async deletePost(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    await postService.deletePost(postId);
    res.status(HTTP_STATUS.OK).json({
      message: 'Delete post successfully'
    });
  }
}

export const postController: PostController = new PostController();
