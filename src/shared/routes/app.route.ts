import { Application } from 'express';
import { authRoute } from 'src/features/auth/routes/auth.route';
import { chatRoute } from 'src/features/chat/routes/chat.route';
import { commentRoute } from 'src/features/comments/routes/comment.route';
import { postRoute } from 'src/features/posts/routes/post.route';
import { reactionRoute } from 'src/features/reactions/routes/react.route';
import { userRoute } from 'src/features/users/routes/user.route';

const BASE_PATH = '/api/v1/';

export const appRoute = (app: Application) => {
  app.use(BASE_PATH, authRoute.routes());
  app.use(BASE_PATH, userRoute.routes());
  app.use(BASE_PATH, postRoute.routes());
  app.use(BASE_PATH, reactionRoute.routes());
  app.use(BASE_PATH, commentRoute.routes());
  app.use(BASE_PATH, chatRoute.routes());
};
