# Social Network Backend

A comprehensive social network backend built with Node.js, TypeScript, MongoDB, and Redis. Features include user authentication, posts, real-time chat, friendships, notifications, and more.

🎨 **Frontend Repository**: [Social Network UI](https://github.com/huydu17/social_network_ui) - React frontend for this social network backend
## 🚀 Features

- **Authentication**: JWT, Google OAuth, email verification, password reset
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
