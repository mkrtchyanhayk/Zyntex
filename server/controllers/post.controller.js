import mongoose from 'mongoose';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';

const allowedReactions = ['❤️', '👍', '😂', '😮', '😢', '😡', '🔥'];

const ensureReactionMap = (post) => {
  if (post.reactions instanceof Map) {
    return post.reactions;
  }
  const map = new Map();
  Object.entries(post.reactions || {}).forEach(([emoji, users]) => {
    map.set(
      emoji,
      (users || []).map((id) =>
        id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id)
      )
    );
  });
  post.reactions = map;
  post.markModified('reactions');
  return map;
};

const syncLikesFromHearts = (post) => {
  const map = ensureReactionMap(post);
  const hearts = map.get('❤️') || [];
  post.likes = hearts;
};

const removeUserFromAllReactions = (post, userId) => {
  const map = ensureReactionMap(post);
  const userStr = userId.toString();
  let removedEmoji = null;

  for (const [emoji, users = []] of map.entries()) {
    const filtered = users.filter((id) => id.toString() !== userStr);
    if (filtered.length !== users.length) {
      removedEmoji = emoji;
      if (filtered.length) {
        map.set(emoji, filtered);
      } else {
        map.delete(emoji);
      }
      post.markModified('reactions');
    }
  }

  return removedEmoji;
};

const applySingleReaction = (post, userId, emoji) => {
  const map = ensureReactionMap(post);
  const removedEmoji = removeUserFromAllReactions(post, userId);

  if (removedEmoji === emoji) {
    syncLikesFromHearts(post);
    return;
  }

  const updated = [...(map.get(emoji) || [])];
  updated.push(new mongoose.Types.ObjectId(userId));
  map.set(emoji, updated);
  post.markModified('reactions');
  syncLikesFromHearts(post);
};

export const createPost = async (req, res) => {
  try {
    const { caption, textContent, hideLikes } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || '';
    if (!imageUrl && !textContent) {
      return res.status(400).json({ message: 'Provide an image or text content' });
    }

    const post = await Post.create({
      imageUrl,
      textContent: textContent || '',
      caption: caption || '',
      author: req.userId,
      hideLikeCount: hideLikes === 'true' || hideLikes === true
    });
    const populated = await post.populate('author', 'username displayName avatarUrl');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post', error: err.message });
  }
};

export const getFeed = async (_req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username displayName avatarUrl')
      .lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch feed', error: err.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    applySingleReaction(post, userId, '❤️');
    await post.save();
    const populated = await post.populate('author', 'username displayName avatarUrl');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle like', error: err.message });
  }
};

export const reactToPost = async (req, res) => {
  try {
    const { id, emoji } = req.params;
    const userId = req.userId;
    if (!allowedReactions.includes(emoji)) {
      return res.status(400).json({ message: 'Unsupported reaction' });
    }
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    applySingleReaction(post, userId, emoji);
    await post.save();
    const populated = await post.populate('author', 'username displayName avatarUrl');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to react to post', error: err.message });
  }
};

export const getPostReactions = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const response = [];
    const entries = post.reactions?.entries ? Array.from(post.reactions.entries()) : Object.entries(post.reactions || {});
    for (const [emoji, userIds] of entries) {
      const users = await User.find({ _id: { $in: userIds } }).select('username displayName avatarUrl');
      response.push({ emoji, count: users.length, users });
    }
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reactions', error: err.message });
  }
};

export const updateLikeVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { hideLikes } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    post.hideLikeCount = hideLikes === 'true' || hideLikes === true;
    await post.save();
    const populated = await post.populate('author', 'username displayName avatarUrl');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update visibility', error: err.message });
  }
};

export const listComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ post: id })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatarUrl');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load comments', error: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text required' });
    }
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = await Comment.create({ post: id, author: req.userId, text: text.trim() });
    const populated = await comment.populate('author', 'username displayName avatarUrl');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const comment = await Comment.findOne({ _id: commentId, post: id });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment', error: err.message });
  }
};

