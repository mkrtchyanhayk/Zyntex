import Post from '../models/Post.js';
import User from '../models/User.js';

export const getExploreFeed = async (req, res) => {
    try {
        const { category = 'all', limit = 30 } = req.query;
        const userId = req.userId;

        // Get user's interests (users they follow, posts they've liked)
        let userInterests = [];
        if (userId) {
            const user = await User.findById(userId).select('following');
            const likedPosts = await Post.find({ likes: userId }).limit(20).select('author');
            userInterests = [...(user.following || []), ...likedPosts.map(p => p.author)];
        }

        // Base query - exclude own posts and posts from blocked users
        const baseQuery = {
            author: userId ? { $ne: userId } : { $exists: true },
            visibility: { $in: ['public', 'followers'] }
        };

        // Category filters
        if (category === 'photos') {
            baseQuery.mediaType = 'image';
        } else if (category === 'videos') {
            baseQuery.mediaType = 'video';
        } else if (category === 'reels') {
            baseQuery.mediaType = 'reel';
        }

        // Calculate trending score
        const posts = await Post.aggregate([
            { $match: baseQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorData'
                }
            },
            { $unwind: '$authorData' },
            {
                $addFields: {
                    likeCount: { $size: '$likes' },
                    engagementScore: {
                        $add: [
                            { $multiply: [{ $size: '$likes' }, 2] },
                            { $multiply: ['$viewCount', 0.1] },
                            { $multiply: ['$shareCount', 3] },
                            { $multiply: ['$saveCount', 2.5] }
                        ]
                    },
                    recencyScore: {
                        $divide: [
                            { $subtract: [new Date(), '$createdAt'] },
                            3600000 // hours
                        ]
                    },
                    isInterested: {
                        $cond: [
                            { $in: ['$author', userInterests] },
                            1,
                            0
                        ]
                    }
                }
            },
            {
                $addFields: {
                    trendingScore: {
                        $add: [
                            { $multiply: ['$engagementScore', 0.4] },
                            { $multiply: [{ $subtract: [24, '$recencyScore'] }, 0.3] },
                            { $multiply: ['$isInterested', 0.2] },
                            { $multiply: [Math.random(), 0.1] } // Diversity
                        ]
                    }
                }
            },
            { $sort: { trendingScore: -1 } },
            { $limit: parseInt(limit) },
            {
                $project: {
                    authorData: {
                        _id: 1,
                        username: 1,
                        displayName: 1,
                        avatarUrl: 1
                    },
                    imageUrl: 1,
                    images: 1,
                    mediaType: 1,
                    caption: 1,
                    textContent: 1,
                    likes: 1,
                    likeCount: 1,
                    viewCount: 1,
                    shareCount: 1,
                    saveCount: 1,
                    createdAt: 1,
                    trendingScore: 1
                }
            }
        ]);

        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch explore feed', error: err.message });
    }
};

export const getTrendingHashtags = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const timeframe = parseInt(req.query.hours) || 24;

        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - timeframe);

        // Extract hashtags from posts and count occurrences
        const trending = await Post.aggregate([
            { $match: { createdAt: { $gte: hoursAgo } } },
            {
                $project: {
                    hashtags: {
                        $regexFindAll: {
                            input: { $concat: ['$caption', ' ', '$textContent'] },
                            regex: /#(\w+)/
                        }
                    }
                }
            },
            { $unwind: '$hashtags' },
            {
                $group: {
                    _id: { $toLower: { $arrayElemAt: ['$hashtags.captures', 0] } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $project: {
                    hashtag: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.json(trending);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch trending hashtags', error: err.message });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 10;

        if (!userId) {
            // For guests, show most followed users
            const users = await User.find({})
                .sort({ 'followers.length': -1 })
                .limit(limit)
                .select('username displayName avatarUrl bio');
            return res.json(users);
        }

        const currentUser = await User.findById(userId).select('following');
        const following = currentUser.following || [];

        // Find users followed by people you follow (mutual connections)
        const suggested = await User.aggregate([
            { $match: { _id: { $nin: [...following, userId] } } },
            {
                $addFields: {
                    mutualFollowers: {
                        $size: {
                            $setIntersection: ['$followers', following]
                        }
                    }
                }
            },
            { $sort: { mutualFollowers: -1, 'followers.length': -1 } },
            { $limit: limit },
            {
                $project: {
                    username: 1,
                    displayName: 1,
                    avatarUrl: 1,
                    bio: 1,
                    mutualFollowers: 1
                }
            }
        ]);

        res.json(suggested);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch suggested users', error: err.message });
    }
};
