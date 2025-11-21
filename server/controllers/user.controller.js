import User from '../models/User.js';
import Post from '../models/Post.js';

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
    const { displayName, bio } = req.body;
    const update = { displayName: displayName ?? '', bio: bio ?? '' };
    if (req.file) {
      update.avatarUrl = `/uploads/${req.file.filename}`;
    }
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('username email displayName bio avatarUrl');
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
    }
    await Promise.all([me.save(), target.save()]);
    res.json({ isFollowing: !isFollowing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle follow', error: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('_id');
    if (!user) return res.status(404).json({ message: 'User not found' });
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
      return res.status(400).json({ message: `You can change again in ${Math.ceil(ms / (24*60*60*1000))} day(s)` });
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

