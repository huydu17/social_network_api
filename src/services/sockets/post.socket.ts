import { Server, Socket } from 'socket.io';

export let socketPostIO: Server;

export class SocketIOPostHandler {
  private io: Server;
  constructor(io: Server) {
    this.io = io;
    socketPostIO = io;
  }
  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('reactions', (data: any) => {
        this.io.emit('update-react', data);
      });
      socket.on('comments', (data: any) => {
        this.io.emit('update-comment', data);
      });
    });
  }
}
