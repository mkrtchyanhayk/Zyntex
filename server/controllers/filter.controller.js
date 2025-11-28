import FilterEffect from '../models/FilterEffect.js';

export const getFilters = async (req, res) => {
    try {
        const { category, featured } = req.query;

        const query = {};
        if (category) query.category = category;
        if (featured === 'true') query.isFeatured = true;

        const filters = await FilterEffect.find(query)
            .sort({ isFeatured: -1, usageCount: -1 })
            .populate('creator', 'username displayName avatarUrl');

        res.json(filters);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch filters', error: err.message });
    }
};

export const getTrendingFilters = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const filters = await FilterEffect.find({})
            .sort({ usageCount: -1 })
            .limit(limit)
            .populate('creator', 'username displayName avatarUrl');

        res.json(filters);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch trending filters', error: err.message });
    }
};

export const createFilter = async (req, res) => {
    try {
        const { name, displayName, category, thumbnailUrl, previewUrl, settings } = req.body;

        const filter = await FilterEffect.create({
            name,
            displayName: displayName || name,
            category: category || 'color',
            thumbnailUrl,
            previewUrl,
            creator: req.userId,
            settings: settings || { adjustable: true }
        });

        res.status(201).json(filter);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create filter', error: err.message });
    }
};
