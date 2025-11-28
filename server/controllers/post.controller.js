import mongoose from 'mongoose';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

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
    return null;
  }

  const updated = [...(map.get(emoji) || [])];
  updated.push(new mongoose.Types.ObjectId(userId));
  map.set(emoji, updated);
  post.markModified('reactions');
  syncLikesFromHearts(post);
  return emoji;
};

export const createPost = async (req, res) => {
  try {
    const { caption, textContent, hideLikes, mediaType, tags, location, visibility } = req.body;

    // Handle multiple images
    let images = [];
    let imageUrl = '';

    if (req.files && req.files.length > 0) {
      images = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        order: index
      }));
      imageUrl = images[0].url; // Backwards compatibility
    } else if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      images = [{ url: imageUrl, order: 0 }];
    }

    if (images.length === 0 && !textContent) {
      return res.status(400).json({ message: 'Provide an image or text content' });
    }

    // Parse tags if provided
    let taggedUsers = [];
    if (tags) {
      try {
        taggedUsers = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        // Ignore parse errors
      }
    }

    const post = await Post.create({
      imageUrl,
      images,
      textContent: textContent || '',
      caption: caption || '',
      author: req.userId,
      mediaType: mediaType || (images.length > 1 ? 'carousel' : 'image'),
      hideLikeCount: hideLikes === 'true' || hideLikes === true,
      taggedUsers,
      location: location ? JSON.parse(location) : undefined,
      visibility: visibility || 'public'
    });

    const populated = await post.populate('author', 'username displayName avatarUrl');

    // Notify tagged users
    if (taggedUsers && taggedUsers.length > 0) {
      const tagger = await User.findById(req.userId).select('username');
      for (const tag of taggedUsers) {
        if (tag.user && tag.user.toString() !== req.userId) {
          await Notification.create({
            user: tag.user,
            title: 'Tagged in Photo',
            body: `${tagger.username} tagged you in a photo`,
            link: `/posts/${post._id}`
          });
        }
      }
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post', error: err.message });
  }
};

export const getFeed = async (req, res) => {
  try {
    const posts = await Post.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $match: {
          $or: [
            { 'author.isPrivate': { $ne: true } },
            { 'author._id': req.userId ? new mongoose.Types.ObjectId(req.userId) : null },
            { 'author.followers': req.userId ? new mongoose.Types.ObjectId(req.userId) : null }
          ]
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $addFields: {
          commentCount: { $size: '$comments' }
        }
      },
      {
        $project: {
          'author.passwordHash': 0,
          'comments': 0
        }
      }
    ]);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch feed', error: err.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const added = applySingleReaction(post, req.userId, '❤️');
    await post.save();

    if (added && post.author.toString() !== req.userId) {
      const user = await User.findById(req.userId).select('username');
      await Notification.create({
        user: post.author,
        title: 'New Like',
        body: `${user.username} liked your post`,
        link: `/`
      });
    }

    res.json(post.likes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle like', error: err.message });
  }
};

export const reactToPost = async (req, res) => {
  try {
    const { id, emoji } = req.params;
    if (!allowedReactions.includes(emoji)) {
      return res.status(400).json({ message: 'Invalid reaction' });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const added = applySingleReaction(post, req.userId, emoji);
    await post.save();

    if (added && post.author.toString() !== req.userId) {
      const user = await User.findById(req.userId).select('username');
      await Notification.create({
        user: post.author,
        title: 'New Reaction',
        body: `${user.username} reacted ${emoji} to your post`,
        link: `/`
      });
    }

    res.json(post.reactions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to react', error: err.message });
  }
};

export const getPostReactions = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post.reactions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get reactions', error: err.message });
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
    const { text, parentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text required' });
    }
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      post: id,
      author: req.userId,
      text: text.trim(),
      parentId: parentId || null
    });
    const populated = await comment.populate('author', 'username displayName avatarUrl');

    if (post.author.toString() !== req.userId) {
      const user = await User.findById(req.userId).select('username');
      await Notification.create({
        user: post.author,
        title: 'New Comment',
        body: `${user.username} commented on your post`,
        link: `/`
      });
    }

    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (parentComment && parentComment.author.toString() !== req.userId) {
        const user = await User.findById(req.userId).select('username');
        await Notification.create({
          user: parentComment.author,
          title: 'New Reply',
          body: `${user.username} replied to your comment`,
          link: `/`
        });
      }
    }

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

export const markSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) return res.json({ success: true });

    await Post.updateOne(
      { _id: id },
      { $addToSet: { seenBy: userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark seen', error: err.message });
  }
};
