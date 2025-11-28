import mongoose from 'mongoose';

const ReelSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String
    },
    caption: {
        type: String,
        default: ''
    },
    audioUrl: {
        type: String
    },
    audioName: {
        type: String
    },
    duration: {
        type: Number // in seconds
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    views: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    saves: {
        type: Number,
        default: 0
    },
    taggedUsers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: Number // seconds into video
    }],
    hashtags: [{
        type: String
    }],
    isRemix: {
        type: Boolean,
        default: false
    },
    originalReel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reel'
    },
    visibility: {
        type: String,
        enum: ['public', 'followers', 'private'],
        default: 'public'
    },
    allowComments: {
        type: Boolean,
        default: true
    },
    allowRemix: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
ReelSchema.index({ createdAt: -1 });
ReelSchema.index({ author: 1, createdAt: -1 });
ReelSchema.index({ views: -1 });
ReelSchema.index({ hashtags: 1 });

export default mongoose.model('Reel', ReelSchema);
