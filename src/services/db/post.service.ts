import { UserPayload } from 'src/type';
import { userService } from './user.service';
import { postCache } from '../redis/post.cache';
import { cloudinaryService, UploadedFile } from './cloudinary.service';
import { socketPostIO } from '../sockets/post.socket';
import { IPostDocument, IPostOuputData, IPostPayload } from 'src/interfaces/post.interface';
import { Post } from 'src/models/post.schema';
import { IUserDocument } from 'src/interfaces/user.interface';
import { BadRequestException } from 'src/middlewares/globalErrorHandle';
import { Comment } from 'src/models/comment.schema';
import { Reaction } from 'src/models/reaction.schema';
import { Notification } from 'src/models/notification.schema';

class PostService {
  public async create(requestBody: IPostDocument, file: UploadedFile | undefined, currentUser: UserPayload) {
    const data: IPostDocument = {
      ...requestBody,
      user: currentUser.userId
    } as IPostDocument;
    const images = file ? await cloudinaryService.upload(file, 'posts') : [];
    const post: any = new Post(data);
    if (images) {
      post.images = images;
    }
    await post.save();
    await postCache.savePostToCache({ key: `${post._id}`, post });
    const postFormatted = this.PostOuputData(post, currentUser);
    socketPostIO.emit('add-post', postFormatted);
    return post;
  }
  public async getAllPosts(currentUser: UserPayload, page: number = 1, limit: number = 3) {
    const user: IUserDocument = (await userService.getUserById(`${currentUser.userId}`)) as IUserDocument;
    const following = user?.following;
    const usersToFetch: string[] = [...following, currentUser.userId] as string[];
    const cachePost: any = await postCache.getPostsFromCache(page, limit, usersToFetch);
    if (cachePost.length > 0) {
      return { posts: cachePost, totalPosts: cachePost.length };
    }
    const totalPosts = await Post.countDocuments();
    const posts = await Post.find({ user: { $in: usersToFetch } })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return { posts, totalPosts };
  }
  public async getUserPosts(userId: string, page: number = 1, limit: number = 10) {
    const user: IUserDocument = (await userService.getUserById(userId)) as IUserDocument;
    const cachePost: any = await postCache.getUserPostsFromCache(page, limit, userId);
    if (cachePost.length > 0) {
      return { posts: cachePost, totalPosts: cachePost.length };
    }
    const totalPosts = await Post.countDocuments();
    const posts = await Post.find({ user: user._id })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return { posts, totalPosts: totalPosts };
  }
  public async updatePost(postId: string, data: IPostPayload, currentUser: UserPayload, fileList?: UploadedFile) {
    const postExists = await Post.findById(postId);
    if (!postExists) {
      throw new BadRequestException('Post not found');
    }
    let images = postExists.images || [];
    let gifUrl = postExists.gifUrl || '';
    const hasImageChange = data.hasImageChange === 'true';
    const hasGifChange = data.hasGifChange === 'true';
    if (hasImageChange) {
      if (fileList) {
        images = await cloudinaryService.upload(fileList, 'posts');
        gifUrl = '';
      } else {
        images = [];
      }
    }
    if (hasGifChange) {
      gifUrl = data.gifUrl || '';
      if (gifUrl) {
        images = [];
      }
    }
    const updatedPost: any = await Post.findByIdAndUpdate(
      postId,
      {
        ...data,
        images,
        gifUrl
      },
      { new: true }
    );
    await postCache.updatePostFromCache(updatedPost);
    const postFormatted = this.PostOuputData(updatedPost, currentUser);
    socketPostIO.emit('update-post', postFormatted);
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
    const notifications = Notification.deleteMany({ entityId: postId }).exec();
    const deletePostFromCache = postCache.deletePostFromCache(postId);
    await Promise.all([deletePost, deletePostFromCache, comments, reactions, notifications]);
    socketPostIO.emit('delete-post', postId);
  }
  private PostOuputData(post: any, currentUser: UserPayload) {
    const data: IPostOuputData = {
      _id: post._id,
      user: {
        _id: currentUser.userId.toString(),
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        avatar: currentUser.avatar
      },
      text: post.text,
      images: post.images,
      gifUrl: post.gifUrl,
      feelings: post.feelings,
      privacy: post.privacy,
      commentsCount: post.commentsCount,
      reactions: post.reactions,
      createdAt: post.createdAt
    };
    return data;
  }
}

export const postService: PostService = new PostService();
