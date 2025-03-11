# Social Network App Backend

## Features
1. Signup and signin authentication
2. Forgot password and reset password
3. Change password when logged in
4. Create, read, update and delete posts
5. Post reactions
6. Comments
7. Ralationship: Followers, following, friend...
8. Private chat messaging with text, images, gifs, 
9. Image upload
10. In-app notification and email notification

## Main tools
- Node.js
- Typescript
- MongoDB
- Mongoose
- Redis
- Express
- Bull
- PM2
- AWS
- Terraform
- Nodemailer
- Sendgrid mail
- Cloudinary
- Jest
- Lodash
- Socket.io

## Requirements

- Node 16.x or higher
- Redis ([https://redis.io/download/](https://redis.io/download/))
- MongoDB ([https://www.mongodb.com/docs/manual/administration/install-community/](https://www.mongodb.com/docs/manual/administration/install-community/))
- Typescript
- API key, secret and cloud name from cloudinary [https://cloudinary.com/](https://cloudinary.com/)
- Local email sender and password [https://ethereal.email/](https://ethereal.email/)

## Local Installation

- There are three different branches develop, staging and main. The develop branch is the default branch.

```bash
git clone https://github.com/huydu17/social_network_api/tree/main/endpoints
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
