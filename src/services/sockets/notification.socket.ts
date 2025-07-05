import { Server } from 'socket.io';

export let socketNotificationIO: Server;
export class SocketIONotificationHandler {
  public listen(io: Server) {
    socketNotificationIO = io;
  }
}
