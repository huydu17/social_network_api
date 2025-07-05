import { Server, Socket } from 'socket.io';

export let socketChatIO: Server;
let users: string[] = [];
let usersMap: Map<string, string> = new Map();

export class SocketIOChatHandler {
  private io: Server;
  constructor(io: Server) {
    this.io = io;
    socketChatIO = io;
  }
  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('join-room', (conversationId: string) => {
        socket.join(conversationId);
      });
      socket.on('setup', (userId: string) => {
        socket.join(userId);
        this.addClientToMap(userId, socket.id);
        this.addUser(userId);
      });
      socket.on('get-users-online', () => {
        this.io.emit('user-online', users);
      });
      socket.on('disconnect', () => {
        this.removeClientFromMap(socket.id);
      });
    });
  }
  private addClientToMap(userId: string, socketId: string) {
    if (!usersMap.has(userId)) {
      usersMap.set(userId, socketId);
    }
  }
  private removeClientFromMap(socketId: string) {
    if (Array.from(usersMap.values()).includes(socketId)) {
      const client: any = [...usersMap].find((c: [string, string]) => c[1] === socketId);
      usersMap.delete(client[0]);
      this.removeUser(client[0]);
    }
  }
  private addUser(userId: string) {
    if (!users.includes(userId)) {
      users.push(userId);
    }
  }
  private removeUser(userId: string) {
    users = users.filter((id) => id !== userId);
  }
}
