import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import http from 'http';
import compression from 'compression';
import HTTP_STATUS from 'http-status-codes';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import fileUpload from 'express-fileupload';
import { appRoute } from './routes/app.route';
import { CustomError, IErrorResponse } from './middlewares/globalErrorHandle';
import { SocketIOPostHandler } from './services/sockets/post.socket';
import { SocketIONotificationHandler } from './services/sockets/notification.socket';
import { SocketIOChatHandler } from './services/sockets/chat.socket';
import { SocketIOUserHandler } from './services/sockets/user.socket';
import { appConfig } from './config/appConfig';
const PORT = appConfig.PORT;
export class ChatifyServer {
  constructor(private app: Application) {
    this.app = app;
  }
  public start(): void {
    this.setupMiddleware(this.app);
    this.setupRoutes(this.app);
    this.globalErrorHandle(this.app);
    this.startServer(this.app);
  }
  private setupMiddleware(app: Application) {
    app.use(cookieParser());
    app.use(hpp());
    app.use(helmet());
    app.use(
      fileUpload({
        useTempFiles: true
      })
    );
    app.use(
      cors({
        origin: '*',
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
    app.use(compression());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  }
  private setupRoutes(app: Application) {
    appRoute(app);
  }
  private globalErrorHandle(app: Application) {
    app.all('*', (req: Request, res: Response) => {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: `The url ${req.originalUrl} not found` });
    });
    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.getMessageError());
      }
      next();
    });
  }
  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnection(socketIO);
    } catch (e) {
      console.log(`Server error: ${e}`);
    }
  }
  private startHttpServer(httpServer: http.Server): void {
    httpServer.listen(PORT, () => {
      console.log(`Server is running with PORT ${PORT}`);
    });
  }
  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });
    const pubClient = createClient({ url: appConfig.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }
  private socketIOConnection(io: Server): void {
    const postSocket: SocketIOPostHandler = new SocketIOPostHandler(io);
    const notificationSocket: SocketIONotificationHandler = new SocketIONotificationHandler();
    const chatSocket: SocketIOChatHandler = new SocketIOChatHandler(io);
    const userSocket: SocketIOUserHandler = new SocketIOUserHandler();

    postSocket.listen();
    notificationSocket.listen(io);
    chatSocket.listen();
    userSocket.listen(io);
  }
}
