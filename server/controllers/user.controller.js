import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';

export const getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate posts per day
    const posts = await Post.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId), createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Aggregate comments (engagement) per day - comments ON user's posts
    // First find user's posts
    const userPosts = await Post.find({ author: userId }).select('_id');
    const postIds = userPosts.map(p => p._id);

    const comments = await Comment.aggregate([
      { $match: { post: { $in: postIds }, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const stats = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const postCount = posts.find(p => p._id === dateStr)?.count || 0;
      const commentCount = comments.find(p => p._id === dateStr)?.count || 0;
      stats.unshift({ date: dateStr, posts: postCount, engagement: commentCount });
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username email displayName bio avatarUrl createdAt');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { displayName, bio, isPrivate } = req.body;
    const update = {
      displayName: displayName ?? '',
      bio: bio ?? '',
      isPrivate: isPrivate === 'true' || isPrivate === true
    };
    if (req.file) {
      update.avatarUrl = `/uploads/${req.file.filename}`;
    }
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('username email displayName bio avatarUrl isPrivate');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

export const getByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('username displayName bio avatarUrl createdAt').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const followerCount = await User.countDocuments({ following: user._id });
    const followingCount = await User.countDocuments({ followers: user._id });
    const isFollowing = req.userId ? await User.exists({ _id: user._id, followers: req.userId }) : false;
    res.json({ ...user, followerCount, followingCount, isFollowing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const { username } = req.params;
    const target = await User.findOne({ username });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target._id.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }
    const me = await User.findById(req.userId);
    const isFollowing = me.following.some((id) => id.toString() === target._id.toString());
    if (isFollowing) {
      me.following = me.following.filter((id) => id.toString() !== target._id.toString());
      target.followers = target.followers.filter((id) => id.toString() !== req.userId);
    } else {
      me.following.push(target._id);
      target.followers.push(req.userId);

      // Create Notification
      await Notification.create({
        user: target._id,
        title: 'New Follower',
        body: `${me.username} started following you`,
        link: `/u/${me.username}`
      });
    }
    await Promise.all([me.save(), target.save()]);
    res.json({ isFollowing: !isFollowing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle follow', error: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('_id isPrivate followers');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Privacy check
    if (user.isPrivate) {
      const isMe = req.userId && req.userId === user._id.toString();
      const isFollowing = req.userId && user.followers.some(id => id.toString() === req.userId);
      if (!isMe && !isFollowing) {
        return res.json([]); // Return empty array if private and not following
      }
    }

    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 }).populate('author', 'username displayName avatarUrl');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts', error: err.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } }
      ]
    }).limit(20).select('username displayName avatarUrl');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};

export const changeUsername = async (req, res) => {
  try {
    const { newUsername } = req.body;
    const lower = String(newUsername || '').toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(lower)) {
      return res.status(400).json({ message: 'Username must be 3-20 chars, lowercase letters, numbers or _' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const now = Date.now();
    if (user.lastUsernameChangeAt && now - user.lastUsernameChangeAt.getTime() < 14 * 24 * 60 * 60 * 1000) {
      const ms = 14 * 24 * 60 * 60 * 1000 - (now - user.lastUsernameChangeAt.getTime());
      return res.status(400).json({ message: `You can change again in ${Math.ceil(ms / (24 * 60 * 60 * 1000))} day(s)` });
    }
    const existing = await User.findOne({ username: lower });
    if (existing) return res.status(409).json({ message: 'Username already taken' });
    user.previousUsernames = user.previousUsernames || [];
    user.previousUsernames.push({ username: user.username, changedAt: new Date() });
    user.username = lower;
    user.lastUsernameChangeAt = new Date();
    await user.save();
    res.json({ username: user.username, previousUsernames: user.previousUsernames });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change username', error: err.message });
  }
};
