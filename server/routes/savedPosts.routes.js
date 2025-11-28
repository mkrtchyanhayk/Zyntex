import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import authJwt from '../middleware/authJwt.js';

const router = express.Router();

// Save/unsave a post
router.post('/:postId/save', authJwt, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const postId = req.params.postId;

        if (!user.savedPosts) {
            user.savedPosts = [];
        }

        const savedIndex = user.savedPosts.findIndex(id => id.toString() === postId);

        if (savedIndex > -1) {
            // Unsave
            user.savedPosts.splice(savedIndex, 1);
            await user.save();

            // Update post save count
            await Post.updateOne({ _id: postId }, { $inc: { saveCount: -1 } });

            return res.json({ saved: false });
        } else {
            // Save
            user.savedPosts.push(postId);
            await user.save();

            // Update post save count
            await Post.updateOne({ _id: postId }, { $inc: { saveCount: 1 } });

            return res.json({ saved: true });
        }
    } catch (error) {
        console.error('Save post error:', error);
        res.status(500).json({ message: 'Failed to save post' });
    }
});

// Get saved posts
router.get('/saved', authJwt, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate({
            path: 'savedPosts',
            populate: { path: 'author', select: 'username displayName avatarUrl' }
        });

        res.json(user.savedPosts || []);
    } catch (error) {
        console.error('Get saved posts error:', error);
        res.status(500).json({ message: 'Failed to get saved posts' });
    }
});

export default router;
