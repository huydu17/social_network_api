import mongoose from 'mongoose';
import { appConfig } from './appConfig';
export default () => {
  const connect = () => {
    mongoose
      .connect(appConfig.MONGO_URI!)
      .then(() => {
        console.log('Connect to database successfully');
      })
      .catch((err) => {
        console.log('Error connecting to database', err);
        process.exit(1);
      });
  };
  connect();
  mongoose.connection.on('disconnected', connect);
};
