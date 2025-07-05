import { Application } from 'express';
import { authRoute } from './auth.route';
import { userRoute } from './user.route';
import { postRoute } from './post.route';
import { reactionRoute } from './react.route';
import { commentRoute } from './comment.route';
import { notificationRoute } from './notification.route';
import { chatRoute } from './chat.route';
import { followerRoute } from './follower.route';

const BASE_PATH = '/api/v1/';

export const appRoute = (app: Application) => {
  app.use(BASE_PATH, authRoute.routes());
  app.use(BASE_PATH, userRoute.routes());
  app.use(BASE_PATH, followerRoute.routes());
  app.use(BASE_PATH, postRoute.routes());
  app.use(BASE_PATH, reactionRoute.routes());
  app.use(BASE_PATH, commentRoute.routes());
  app.use(BASE_PATH, notificationRoute.routes());
  app.use(BASE_PATH, chatRoute.routes());
};
