import express, { Express } from 'express';
import { ChatifyServer } from './server';
import connectDb from './config/connectDb';
import { appConfig } from './config/appConfig';
class Application {
  public run(): void {
    this.loadConfig();
    connectDb();
    const app: Express = express();
    const server = new ChatifyServer(app);
    server.start();
  }
  private loadConfig() {
    appConfig.validateConfig();
  }
}
const app: Application = new Application();
app.run();
