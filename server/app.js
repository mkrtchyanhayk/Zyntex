import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import './config/db.js';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import userRoutes from './routes/user.routes.js';
import dmRoutes from './routes/dm.routes.js';
import groupRoutes from './routes/group.routes.js';
import inviteRoutes from './routes/invite.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import storyRoutes from './routes/story.routes.js';
import savedPostsRoutes from './routes/savedPosts.routes.js';
import exploreRoutes from './routes/explore.routes.js';
import reelRoutes from './routes/reel.routes.js';
import collectionRoutes from './routes/collection.routes.js';
import highlightRoutes from './routes/highlight.routes.js';
import audioRoutes from './routes/audio.routes.js';
import filterRoutes from './routes/filter.routes.js';

dotenv.config();

const app = express();

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/invitations', inviteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/saved', savedPostsRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/filters', filterRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

export default app;

