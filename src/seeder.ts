// import mongoose from 'mongoose';
// import { faker } from '@faker-js/faker';
// import bcrypt from 'bcryptjs';
// import { User } from 'src/features/users/models/user.schema';
// import { Token } from 'src/features/auth/models/token.schema';
// import { Post } from 'src/features/posts/models/post.schema';
// import { Reaction } from 'src/features/reactions/models/reaction.schema';
// import { Message } from 'src/features/chat/models/chat.schema';
// import { Conversation } from 'src/features/chat/models/conversation.schema';
// import { Comment } from 'src/features/comments/models/comment.schema';
// import { Gender } from 'src/features/users/enums/gender.enum';
// import { Relationship } from 'src/features/users/enums/relationship.enum';
// import { Privacy } from 'src/features/posts/enums/privacy.enum';
// import { TYPE_REACT } from 'src/features/reactions/enums/type-react.enum';
// import connectDb from './shared/config/connectDb';

// const CONFIG = {
//   USERS: 50,
//   POSTS_PER_USER: 5,
//   COMMENTS_PER_POST: 8,
//   REACTIONS_PER_POST: 15,
//   CONVERSATIONS: 30,
//   MESSAGES_PER_CONVERSATION: 20
// };

// class DataSeeder {
//   users: any[];
//   posts: any[];
//   conversations: any[];

//   constructor() {
//     this.users = [];
//     this.posts = [];
//     this.conversations = [];
//   }

//   // Connect to MongoDB
//   async connect(): Promise<void> {
//     try {
//       connectDb();
//     } catch (error) {
//       console.error('❌ MongoDB connection error:', error);
//       process.exit(1);
//     }
//   }

//   // Disconnect from MongoDB
//   async disconnect(): Promise<void> {
//     try {
//       await mongoose.disconnect();
//       console.log('🔌 Disconnected from MongoDB');
//     } catch (error) {
//       console.error('❌ MongoDB disconnect error:', error);
//     }
//   }

//   // Drop indexes to avoid conflicts
//   async dropIndexes(): Promise<void> {
//     try {
//       await User.collection.dropIndexes();
//       await Post.collection.dropIndexes();
//       await Comment.collection.dropIndexes();
//       await Reaction.collection.dropIndexes();
//       await Message.collection.dropIndexes();
//       await Conversation.collection.dropIndexes();
//       await Token.collection.dropIndexes();
//       console.log('🔧 Dropped all indexes');
//     } catch (error) {
//       console.log('⚠️  Some indexes might not exist, continuing...');
//     }
//   }

//   // Clear existing data
//   async clearData(): Promise<void> {
//     try {
//       await User.deleteMany({});
//       await Token.deleteMany({});
//       await Post.deleteMany({});
//       await Comment.deleteMany({});
//       await Reaction.deleteMany({});
//       await Message.deleteMany({});
//       await Conversation.deleteMany({});
//       console.log('🗑️  Cleared existing data');
//     } catch (error) {
//       console.error('❌ Error clearing data:', error);
//       throw error;
//     }
//   }

//   // Generate fake users
//   async generateUsers(): Promise<void> {
//     console.log('👥 Generating users...');
//     const users = [];

//     for (let i = 0; i < CONFIG.USERS; i++) {
//       const firstName = faker.person.firstName();
//       const lastName = faker.person.lastName();
//       const userName = faker.internet.username().toLowerCase() + faker.number.int({ min: 100, max: 999 });
//       const email = faker.internet.email().toLowerCase();
//       const password = await bcrypt.hash('123456', 10); // Password mặc định

//       const user = {
//         firstName,
//         lastName,
//         userName,
//         email,
//         password,
//         avatar: faker.image.avatar(),
//         bgImage: faker.image.url({ width: 1200, height: 400 }),
//         bYear: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }).getFullYear(),
//         bMonth: faker.number.int({ min: 1, max: 12 }),
//         bDay: faker.number.int({ min: 1, max: 28 }),
//         gender: faker.helpers.arrayElement(Object.values(Gender)),
//         verified: faker.datatype.boolean({ probability: 0.3 }),
//         friends: [],
//         following: [],
//         follower: [],
//         requests: [],
//         details: {
//           bio: faker.lorem.sentence(),
//           otherName: faker.person.middleName(),
//           job: faker.person.jobTitle(),
//           workplace: faker.company.name(),
//           highSchool: faker.company.name() + ' High School',
//           college: faker.company.name() + ' University',
//           currentCity: faker.location.city(),
//           hometown: faker.location.city(),
//           relationship: faker.helpers.arrayElement(Object.values(Relationship))
//         },
//         notifications: {
//           messages: faker.datatype.boolean({ probability: 0.8 }),
//           reactions: faker.datatype.boolean({ probability: 0.8 }),
//           comments: faker.datatype.boolean({ probability: 0.8 }),
//           follows: faker.datatype.boolean({ probability: 0.8 })
//         },
//         searchHistory: []
//       };

//       users.push(user);
//     }

//     this.users = await User.insertMany(users);
//     console.log(`✅ Created ${this.users.length} users`);

//     // Tạo relationships giữa users
//     await this.generateUserRelationships();
//   }

//   // Generate user relationships (friends, following, followers)
//   async generateUserRelationships(): Promise<void> {
//     console.log('🤝 Generating user relationships...');

//     for (const user of this.users) {
//       const friendsCount = faker.number.int({ min: 5, max: 20 });
//       const followingCount = faker.number.int({ min: 10, max: 30 });

//       // Random friends
//       const friends = faker.helpers
//         .arrayElements(
//           this.users.filter((u: any) => u._id.toString() !== user._id.toString()),
//           friendsCount
//         )
//         .map((u: any) => u._id);

//       // Random following
//       const following = faker.helpers
//         .arrayElements(
//           this.users.filter((u: any) => u._id.toString() !== user._id.toString()),
//           followingCount
//         )
//         .map((u: any) => u._id);

//       await User.findByIdAndUpdate(user._id, {
//         friends,
//         following,
//         follower: [], // Sẽ được cập nhật khi tạo following
//         requests: faker.helpers
//           .arrayElements(
//             this.users.filter((u: any) => u._id.toString() !== user._id.toString()),
//             faker.number.int({ min: 0, max: 5 })
//           )
//           .map((u: any) => u._id)
//       });
//     }

//     // Update followers based on following
//     for (const user of this.users) {
//       const userDoc = await User.findById(user._id);
//       if (userDoc && userDoc.following) {
//         for (const followingId of userDoc.following) {
//           await User.findByIdAndUpdate(followingId, {
//             $addToSet: { follower: user._id }
//           });
//         }
//       }
//     }
//   }

//   // Generate tokens for users
//   async generateTokens(): Promise<void> {
//     console.log('🔑 Generating tokens...');
//     const tokens = [];

//     for (const user of this.users) {
//       if (faker.datatype.boolean({ probability: 0.7 })) {
//         // 70% users có token
//         const token = {
//           userId: user._id,
//           refreshToken: faker.string.uuid(),
//           passwordResetToken: faker.datatype.boolean({ probability: 0.1 }) ? faker.string.uuid() : '',
//           passwordResetTokenExpiresAt: faker.datatype.boolean({ probability: 0.1 }) ? Date.now() + 3600000 : undefined, // 1 hour from now
//           verifyToken: !user.verified ? faker.string.uuid() : '',
//           verifyTokenExpiresAt: !user.verified ? Date.now() + 86400000 : undefined // 24 hours
//         };
//         tokens.push(token);
//       }
//     }

//     await Token.insertMany(tokens);
//     console.log(`✅ Created ${tokens.length} tokens`);
//   }

//   // Generate posts
//   async generatePosts(): Promise<void> {
//     console.log('📝 Generating posts...');
//     const posts = [];

//     for (const user of this.users) {
//       const userPostsCount = faker.number.int({ min: 1, max: CONFIG.POSTS_PER_USER });

//       for (let i = 0; i < userPostsCount; i++) {
//         const post = {
//           user: user._id,
//           text: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
//           images: faker.datatype.boolean({ probability: 0.4 })
//             ? Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.image.url())
//             : [],
//           gifUrl: faker.datatype.boolean({ probability: 0.1 }) ? faker.image.url() : '',
//           videos: faker.datatype.boolean({ probability: 0.2 })
//             ? Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, () => faker.internet.url())
//             : [],
//           feelings: faker.datatype.boolean({ probability: 0.3 })
//             ? faker.helpers.arrayElement(['happy', 'sad', 'excited', 'grateful', 'blessed'])
//             : '',
//           privacy: faker.helpers.arrayElement(Object.values(Privacy)),
//           commentsCount: 0, // Will be updated after creating comments
//           reactions: {
//             like: 0,
//             love: 0,
//             lovelove: 0,
//             haha: 0,
//             wow: 0,
//             sad: 0,
//             angry: 0
//           }
//         };
//         posts.push(post);
//       }
//     }

//     this.posts = await Post.insertMany(posts);
//     console.log(`✅ Created ${this.posts.length} posts`);
//   }

//   // Generate comments
//   async generateComments(): Promise<void> {
//     console.log('💬 Generating comments...');
//     const comments = [];

//     for (const post of this.posts) {
//       const commentsCount = faker.number.int({ min: 0, max: CONFIG.COMMENTS_PER_POST });

//       for (let i = 0; i < commentsCount; i++) {
//         const comment = {
//           postId: post._id,
//           content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
//           user: faker.helpers.arrayElement(this.users)._id
//         };
//         comments.push(comment);
//       }

//       // Update post's comment count
//       await Post.findByIdAndUpdate(post._id, {
//         commentsCount: commentsCount
//       });
//     }

//     await Comment.insertMany(comments);
//     console.log(`✅ Created ${comments.length} comments`);
//   }

//   // Generate reactions
//   async generateReactions(): Promise<void> {
//     console.log('👍 Generating reactions...');
//     const reactions = [];

//     for (const post of this.posts) {
//       const reactionsCount = faker.number.int({ min: 0, max: CONFIG.REACTIONS_PER_POST });
//       const reactionCounts: Record<string, number> = {
//         like: 0,
//         love: 0,
//         lovelove: 0,
//         haha: 0,
//         wow: 0,
//         sad: 0,
//         angry: 0
//       };

//       // Tạo reactions và đếm số lượng
//       const usersWhoReacted = new Set<string>();
//       for (let i = 0; i < reactionsCount; i++) {
//         const randomUser = faker.helpers.arrayElement(this.users);

//         // Mỗi user chỉ react 1 lần cho 1 post
//         if (!usersWhoReacted.has(randomUser._id.toString())) {
//           const reactionType = faker.helpers.arrayElement(Object.values(TYPE_REACT));

//           const reaction = {
//             type: reactionType,
//             postId: post._id,
//             user: randomUser._id
//           };

//           reactions.push(reaction);
//           if (reactionCounts[reactionType] !== undefined) {
//             reactionCounts[reactionType]++;
//           }
//           usersWhoReacted.add(randomUser._id.toString());
//         }
//       }

//       // Update post's reaction counts
//       await Post.findByIdAndUpdate(post._id, {
//         reactions: reactionCounts
//       });
//     }

//     await Reaction.insertMany(reactions);
//     console.log(`✅ Created ${reactions.length} reactions`);
//   }

//   // Generate conversations
//   async generateConversations(): Promise<void> {
//     console.log('💬 Generating conversations...');
//     const conversations = [];
//     const conversationPairs = new Set<string>();

//     for (let i = 0; i < CONFIG.CONVERSATIONS; i++) {
//       let sender: any, receiver: any;
//       let pairKey: string;

//       // Đảm bảo không có conversation trùng lặp
//       do {
//         sender = faker.helpers.arrayElement(this.users);
//         receiver = faker.helpers.arrayElement(
//           this.users.filter((u: any) => u._id.toString() !== sender._id.toString())
//         );
//         pairKey = [sender._id.toString(), receiver._id.toString()].sort().join('-');
//       } while (conversationPairs.has(pairKey));

//       conversationPairs.add(pairKey);

//       const conversation = {
//         senderId: sender._id,
//         receiverId: receiver._id
//       };

//       conversations.push(conversation);
//     }

//     this.conversations = await Conversation.insertMany(conversations);
//     console.log(`✅ Created ${this.conversations.length} conversations`);
//   }

//   // Generate messages
//   async generateMessages(): Promise<void> {
//     console.log('📨 Generating messages...');
//     const messages = [];

//     for (const conversation of this.conversations) {
//       const messagesCount = faker.number.int({ min: 5, max: CONFIG.MESSAGES_PER_CONVERSATION });

//       for (let i = 0; i < messagesCount; i++) {
//         // Random người gửi trong conversation
//         const isFromSender = faker.datatype.boolean();
//         const senderId = isFromSender ? conversation.senderId : conversation.receiverId;
//         const receiverId = isFromSender ? conversation.receiverId : conversation.senderId;

//         const message = {
//           conversationId: conversation._id,
//           senderId: senderId,
//           receiverId: receiverId,
//           textMessage: faker.datatype.boolean({ probability: 0.9 })
//             ? faker.lorem.sentences(faker.number.int({ min: 1, max: 2 }))
//             : '',
//           gifUrl: faker.datatype.boolean({ probability: 0.05 }) ? faker.image.url() : '',
//           isRead: faker.datatype.boolean({ probability: 0.7 }),
//           selectedImage: faker.datatype.boolean({ probability: 0.1 }) ? faker.image.url() : '',
//           reaction: faker.datatype.boolean({ probability: 0.2 })
//             ? [faker.helpers.arrayElement(['👍', '❤️', '😂', '😮', '😢', '😠'])]
//             : [],
//           deleteForMe: faker.datatype.boolean({ probability: 0.05 }),
//           deleteForEveryone: faker.datatype.boolean({ probability: 0.02 })
//         };

//         messages.push(message);
//       }
//     }

//     await Message.insertMany(messages);
//     console.log(`✅ Created ${messages.length} messages`);
//   }

//   // Import all data
//   async importData(): Promise<void> {
//     console.log('🚀 Starting data import...\n');

//     await this.dropIndexes();
//     await this.clearData();

//     await this.generateUsers();
//     await this.generateTokens();
//     await this.generatePosts();
//     await this.generateComments();
//     await this.generateReactions();
//     await this.generateConversations();
//     await this.generateMessages();

//     console.log('\n🎉 Data import completed successfully!');
//     console.log('📊 Summary:');
//     console.log(`- Users: ${this.users.length}`);
//     console.log(`- Posts: ${this.posts.length}`);
//     console.log(`- Conversations: ${this.conversations.length}`);
//   }

//   // Delete all data
//   async deleteData(): Promise<void> {
//     console.log('🗑️  Starting data deletion...\n');

//     await this.dropIndexes();
//     await this.clearData();

//     console.log('\n✅ Data deletion completed successfully!');
//   }

//   // Main execution method
//   async execute(): Promise<void> {
//     try {
//       await this.connect();

//       // Check command line arguments
//       const isDeleteMode = process.argv[2] === '-d';

//       if (isDeleteMode) {
//         await this.deleteData();
//         console.log('🗑️  Xóa dữ liệu thành công');
//       } else {
//         await this.importData();
//         console.log('📥 Tạo dữ liệu thành công');
//       }

//       await this.disconnect();
//       process.exit(0);
//     } catch (error) {
//       console.error('❌ Lỗi:', error);
//       await this.disconnect();
//       process.exit(1);
//     }
//   }
// }

// // Run the seeder
// const seeder = new DataSeeder();
// seeder.execute();
