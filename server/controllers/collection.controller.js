import Collection from '../models/Collection.js';
import Post from '../models/Post.js';

export const createCollection = async (req, res) => {
    try {
        const { name, description, visibility } = req.body;

        const collection = await Collection.create({
            user: req.userId,
            name,
            description: description || '',
            visibility: visibility || 'private'
        });

        res.status(201).json(collection);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create collection', error: err.message });
    }
};

export const getCollections = async (req, res) => {
    try {
        const collections = await Collection.find({ user: req.userId })
            .sort({ order: 1, createdAt: -1 });

        res.json(collections);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch collections', error: err.message });
    }
};

export const getCollection = async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id)
            .populate({
                path: 'posts',
                populate: { path: 'author', select: 'username displayName avatarUrl' }
            });

        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (collection.user.toString() !== req.userId && collection.visibility === 'private') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(collection);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch collection', error: err.message });
    }
};

export const addPostToCollection = async (req, res) => {
    try {
        const { collectionId, postId } = req.body;

        const collection = await Collection.findById(collectionId);
        if (!collection) return res.status(404).json({ message: 'Collection not found' });

        if (collection.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (!collection.posts.includes(postId)) {
            collection.posts.push(postId);
            await collection.save();
        }

        res.json(collection);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add post', error: err.message });
    }
};

export const removePostFromCollection = async (req, res) => {
    try {
        const { collectionId, postId } = req.params;

        const collection = await Collection.findById(collectionId);
        if (!collection) return res.status(404).json({ message: 'Collection not found' });

        if (collection.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        collection.posts = collection.posts.filter(id => id.toString() !== postId);
        await collection.save();

        res.json(collection);
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove post', error: err.message });
    }
};

export const updateCollection = async (req, res) => {
    try {
        const { name, description, visibility, coverImage } = req.body;

        const collection = await Collection.findById(req.params.id);
        if (!collection) return res.status(404).json({ message: 'Collection not found' });

        if (collection.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (name) collection.name = name;
        if (description !== undefined) collection.description = description;
        if (visibility) collection.visibility = visibility;
        if (coverImage) collection.coverImage = coverImage;

        await collection.save();
        res.json(collection);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update collection', error: err.message });
    }
};

export const deleteCollection = async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection) return res.status(404).json({ message: 'Collection not found' });

        if (collection.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await collection.deleteOne();
        res.json({ message: 'Collection deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete collection', error: err.message });
    }
};
