import Highlight from '../models/Highlight.js';
import Story from '../models/Story.js';
import User from '../models/User.js';

export const createHighlight = async (req, res) => {
    try {
        const { title, storyIds, coverImage } = req.body;

        const highlight = await Highlight.create({
            user: req.userId,
            title,
            stories: storyIds || [],
            coverImage: coverImage || ''
        });

        res.status(201).json(highlight);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create highlight', error: err.message });
    }
};

export const getHighlights = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const highlights = await Highlight.find({ user: user._id })
            .populate('stories')
            .sort({ order: 1 });

        res.json(highlights);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch highlights', error: err.message });
    }
};

export const addStoryToHighlight = async (req, res) => {
    try {
        const { highlightId, storyId } = req.body;

        const highlight = await Highlight.findById(highlightId);
        if (!highlight) return res.status(404).json({ message: 'Highlight not found' });

        if (highlight.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!highlight.stories.includes(storyId)) {
            highlight.stories.push(storyId);
            await highlight.save();
        }

        res.json(highlight);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add story', error: err.message });
    }
};

export const removeStoryFromHighlight = async (req, res) => {
    try {
        const { highlightId, storyId } = req.params;

        const highlight = await Highlight.findById(highlightId);
        if (!highlight) return res.status(404).json({ message: 'Highlight not found' });

        if (highlight.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        highlight.stories = highlight.stories.filter(id => id.toString() !== storyId);
        await highlight.save();

        res.json(highlight);
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove story', error: err.message });
    }
};

export const updateHighlight = async (req, res) => {
    try {
        const { title, coverImage, order } = req.body;

        const highlight = await Highlight.findById(req.params.id);
        if (!highlight) return res.status(404).json({ message: 'Highlight not found' });

        if (highlight.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (title) highlight.title = title;
        if (coverImage) highlight.coverImage = coverImage;
        if (order !== undefined) highlight.order = order;

        await highlight.save();
        res.json(highlight);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update highlight', error: err.message });
    }
};

export const deleteHighlight = async (req, res) => {
    try {
        const highlight = await Highlight.findById(req.params.id);
        if (!highlight) return res.status(404).json({ message: 'Highlight not found' });

        if (highlight.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await highlight.deleteOne();
        res.json({ message: 'Highlight deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete highlight', error: err.message });
    }
};
