import Reel from '../models/Reel.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const createReel = async (req, res) => {
    try {
        const { caption, audioUrl, audioName, duration, tags, hashtags, allowComments, allowRemix, visibility } = req.body;
        const videoUrl = req.file ? `/uploads/${req.file.filename}` : '';

        if (!videoUrl) {
            return res.status(400).json({ message: 'Video file required' });
        }

        const taggedUsers = tags ? JSON.parse(tags) : [];

        const reel = await Reel.create({
            author: req.userId,
            videoUrl,
            caption: caption || '',
            audioUrl,
            audioName,
            duration: parseFloat(duration) || 0,
            taggedUsers,
            hashtags: hashtags ? JSON.parse(hashtags) : [],
            allowComments: allowComments !== 'false',
            allowRemix: allowRemix !== 'false',
            visibility: visibility || 'public'
        });

        const populated = await reel.populate('author', 'username displayName avatarUrl');

        // Notify tagged users
        if (taggedUsers && taggedUsers.length > 0) {
            const tagger = await User.findById(req.userId).select('username');
            for (const tag of taggedUsers) {
                if (tag.user && tag.user.toString() !== req.userId) {
                    await Notification.create({
                        user: tag.user,
                        title: 'Tagged in Reel',
                        body: `${tagger.username} tagged you in a reel`,
                        link: `/reels/${reel._id}`
                    });
                }
            }
        }

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create reel', error: err.message });
    }
};

export const getReelsFeed = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0;

        const reels = await Reel.find({ visibility: { $in: ['public', 'followers'] } })
            .populate('author', 'username displayName avatarUrl')
            .sort({ createdAt: -1, views: -1 })
            .limit(limit)
            .skip(skip);

        res.json(reels);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch reels', error: err.message });
    }
};

export const getReel = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id)
            .populate('author', 'username displayName avatarUrl');

        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        // Increment view count
        reel.views += 1;
        await reel.save();

        res.json(reel);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch reel', error: err.message });
    }
};

export const toggleReelLike = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });

        const likeIndex = reel.likes.findIndex(id => id.toString() === req.userId);

        if (likeIndex > -1) {
            reel.likes.splice(likeIndex, 1);
        } else {
            reel.likes.push(req.userId);

            // Notify author
            if (reel.author.toString() !== req.userId) {
                const user = await User.findById(req.userId).select('username');
                await Notification.create({
                    user: reel.author,
                    title: 'Reel Like',
                    body: `${user.username} liked your reel`,
                    link: `/reels/${reel._id}`
                });
            }
        }

        await reel.save();
        res.json({ likes: reel.likes });
    } catch (err) {
        res.status(500).json({ message: 'Failed to like reel', error: err.message });
    }
};

export const deleteReel = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });

        if (reel.author.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await reel.deleteOne();
        res.json({ message: 'Reel deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete reel', error: err.message });
    }
};

export const createRemix = async (req, res) => {
    try {
        const { originalReelId, caption } = req.body;
        const videoUrl = req.file ? `/uploads/${req.file.filename}` : '';

        if (!videoUrl) {
            return res.status(400).json({ message: 'Video file required' });
        }

        const originalReel = await Reel.findById(originalReelId);
        if (!originalReel || !originalReel.allowRemix) {
            return res.status(400).json({ message: 'Cannot remix this reel' });
        }

        const reel = await Reel.create({
            author: req.userId,
            videoUrl,
            caption: caption || '',
            isRemix: true,
            originalReel: originalReelId,
            audioUrl: originalReel.audioUrl,
            audioName: originalReel.audioName
        });

        const populated = await reel.populate('author', 'username displayName avatarUrl');

        // Notify original author
        if (originalReel.author.toString() !== req.userId) {
            const user = await User.findById(req.userId).select('username');
            await Notification.create({
                user: originalReel.author,
                title: 'Reel Remixed',
                body: `${user.username} remixed your reel`,
                link: `/reels/${reel._id}`
            });
        }

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create remix', error: err.message });
    }
};
