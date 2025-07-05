import { Server, Socket } from 'socket.io';

export let socketUserIO: Server;

export class SocketIOUserHandler {
  public listen(io: Server): void {
    socketUserIO = io;
  }
}
