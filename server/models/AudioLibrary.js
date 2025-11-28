import mongoose from 'mongoose';

const AudioLibrarySchema = new mongoose.Schema({
    trackName: {
        type: String,
        required: true,
        index: true
    },
    artistName: {
        type: String,
        required: true,
        index: true
    },
    albumName: String,
    albumCover: String,
    audioUrl: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // in seconds
        required: true
    },
    genre: String,
    category: {
        type: String,
        enum: ['trending', 'popular', 'new', 'mood', 'genre'],
        default: 'popular'
    },
    usageCount: {
        type: Number,
        default: 0,
        index: true
    },
    tags: [String],
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
AudioLibrarySchema.index({ usageCount: -1 });
AudioLibrarySchema.index({ createdAt: -1 });
AudioLibrarySchema.index({ tags: 1 });

export default mongoose.model('AudioLibrary', AudioLibrarySchema);
