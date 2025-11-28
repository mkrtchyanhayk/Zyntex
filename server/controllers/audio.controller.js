import AudioLibrary from '../models/AudioLibrary.js';

export const getAudioLibrary = async (req, res) => {
    try {
        const { category, search, limit = 50 } = req.query;

        const query = {};
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { trackName: { $regex: search, $options: 'i' } },
                { artistName: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        const tracks = await AudioLibrary.find(query)
            .sort({ usageCount: -1, createdAt: -1 })
            .limit(parseInt(limit));

        res.json(tracks);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch audio library', error: err.message });
    }
};

export const getTrendingAudio = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const tracks = await AudioLibrary.find({})
            .sort({ usageCount: -1 })
            .limit(limit);

        res.json(tracks);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch trending audio', error: err.message });
    }
};

export const addAudioTrack = async (req, res) => {
    try {
        const { trackName, artistName, albumName, audioUrl, duration, genre, category, tags } = req.body;

        const track = await AudioLibrary.create({
            trackName,
            artistName,
            albumName: albumName || '',
            audioUrl,
            duration,
            genre: genre || '',
            category: category || 'popular',
            tags: tags || []
        });

        res.status(201).json(track);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add audio track', error: err.message });
    }
};
