# Social Network Backend

A comprehensive social network backend built with Node.js, TypeScript, MongoDB, and Redis. Features include user authentication, posts, real-time chat, friendships, notifications, and more.

🎨 **Frontend Repository**: [Social Network UI](https://github.com/huydu17/social_network_ui) - React frontend for this social network backend
## 🚀 Features

- **Authentication**: JWT, email verification, password reset
- **User Management**: Profile management, avatar/cover updates, user search
- **Posts**: Create, update, delete posts with images, pagination
- **Social Features**: Friend requests, follow/unfollow, user suggestions
- **Real-time Chat**: Direct messaging with image support, message reactions
- **Notifications**: Real-time notifications for various activities
- **Comments & Reactions**: Post comments and reactions (like, love, etc.)
- **Search**: User search with search history

## 🛠️ Tech Stack
- **Node.js** - Runtime environment
- **TypeScript** - Type safety
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Redis** - Caching and session storage
- **Cloudinary** - Image storage and processing
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Lodash** - Utility functions

## 🚀 Requirements

- Node
- Redis ([https://redis.io/download/](https://redis.io/download/))
- MongoDB ([https://www.mongodb.com/docs/manual/administration/install-community/](https://www.mongodb.com/docs/manual/administration/install-community/))
- Typescript
- API key, secret and cloud name from cloudinary [https://cloudinary.com/](https://cloudinary.com/)
- Local email sender and password [https://ethereal.email/](https://ethereal.email/)

## 🔧 Environment Variables

Create `.env` file in the directory:

```env
PORT=your_server_port
NODE_ENV=your_node_environment
CLIENT_URL=your_client_url
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_TOKEN_AUDIENCE=your_jwt_token_audience
JWT_TOKEN_ISSUER=your_jwt_token_issuer
JWT_ACCESS_TOKEN_TTL=your_jwt_access_token_ttl
JWT_REFRESH_TOKEN_TTL=your_jwt_refresh_token_ttl
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
REDIS_HOST=your_redis_host
EMAIL_HOST=your_email_host
EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password
EMAIL_SENDER=your_email_sender
CRYPTR_KEY=your_cryptr_key
```

## 📦 Installation

```bash
https://github.com/huydu17/social_network_api.git
npm install
```
- To start the server after installation, run
```bash
npm run dev
```

## API Endpoints
- The actual endpoints for the application can be found inside the folder named `endpoints` [https://github.com/huydu17/social_network_api/tree/main/endpoints](https://github.com/huydu17/social_network_api/tree/main/endpoints). 
- The endpoint files all have a `.http` extension. 
- Update the endpoints http files before using.
- The files inside the endpoints folder contains APIs for
  - Authentication
  - Chat
  - Comments
  - Notifications
  - Posts
  - Reactions
  - User
