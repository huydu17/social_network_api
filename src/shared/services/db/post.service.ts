import { IPostDocument } from 'src/features/posts/interfaces/post.interface';
import { Post } from 'src/features/posts/models/post.schema';
import { UserPayload } from 'src/type';
import { userService } from './user.service';
import { IUserDocument } from 'src/features/users/interfaces/user.interface';
import { postCache } from '../redis/post.cache';
import { BadRequestException } from 'src/shared/middlewares/globalErrorHandle';
import { cloudinaryService, UploadedFile } from './cloudinary.service';
import { Comment } from 'src/features/comments/models/comment.schema';
import { Reaction } from 'src/features/reactions/models/reaction.schema';

class PostService {
  public async create(requestBody: IPostDocument, fileList: UploadedFile | undefined, currentUser: UserPayload) {
    const data: IPostDocument = {
      ...requestBody,
      user: currentUser.userId
    } as IPostDocument;
    const images = fileList ? await cloudinaryService.upload(fileList, 'posts') : [];
    const post: any = new Post(data);
    if (images) {
      post.images = images;
    }
    await post.save();
    await postCache.savePostToCache({ key: `${post._id}`, post });
    return post;
  }
  public async getAllPosts(currentUser: UserPayload, page: number = 1, limit: number = 10) {
    const user: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const following = user?.following;
    const usersToFetch: string[] = [...following, currentUser.userId] as string[];
    const cachePost: any = await postCache.getPostsFromCache(page, limit, usersToFetch);
    if (cachePost.length > 0) {
      return cachePost;
    }
    const posts = await Post.find({ user: { $in: usersToFetch } })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return posts;
  }
  public async getUserPosts(userId: string, page: number = 1, limit: number = 10) {
    const user: IUserDocument = (await userService.getUserById(userId)) as IUserDocument;
    const cachePost: any = await postCache.getUserPostsFromCache(page, limit, userId);
    if (cachePost.length > 0) {
      return cachePost;
    }
    const posts = await Post.find({ user: user._id })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return posts;
  }
  public async updatePost(postId: string, data: IPostDocument, currentUser: UserPayload, fileList?: UploadedFile) {
    const postExists = await Post.findById(postId);
    if (!postExists) {
      throw new BadRequestException('Post not found');
    }
    let images = postExists.images || [];
    if (fileList) {
      images = await cloudinaryService.upload(fileList, 'posts');
    }
    const updatedPost: any = await Post.findByIdAndUpdate(postId, { ...data, images }, { new: true }).populate(
      'user',
      'firstName lastName avatar'
    );
    await postCache.updatePostFromCache(updatedPost);
    return updatedPost;
  }

  public async deletePost(postId: string) {
    const postExists = await Post.findById(postId);
    if (!postExists) {
      throw new BadRequestException('Post not found');
    }
    const deletePost = Post.findByIdAndDelete(postId);
    const comments = Comment.deleteMany({ postId: postId }).exec();
    const reactions = Reaction.deleteMany({ postId: postId }).exec();
    const deletePostFromCache = postCache.deletePostFromCache(postId);
    await Promise.all([deletePost, deletePostFromCache]);
  }
}

export const postService: PostService = new PostService();
