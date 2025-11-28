import mongoose from 'mongoose';

const LiveStreamSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    thumbnail: {
        type: String
    },
    streamKey: {
        type: String,
        required: true,
        unique: true
    },
    streamUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['practice', 'live', 'ended'],
        default: 'practice'
    },
    viewers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    peakViewers: {
        type: Number,
        default: 0
    },
    totalViews: {
        type: Number,
        default: 0
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: String,
        timestamp: Date
    }],
    questions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        question: String,
        answered: {
            type: Boolean,
            default: false
        },
        timestamp: Date
    }],
    guestInvites: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'kicked'],
            default: 'pending'
        }
    }],
    badges: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: Number,
        timestamp: Date
    }],
    startedAt: Date,
    endedAt: Date,
    duration: Number, // in seconds
    recordingUrl: String,
    visibility: {
        type: String,
        enum: ['public', 'followers', 'practice'],
        default: 'public'
    }
}, {
    timestamps: true
});

// Indexes
LiveStreamSchema.index({ status: 1, createdAt: -1 });
LiveStreamSchema.index({ author: 1, status: 1 });

export default mongoose.model('LiveStream', LiveStreamSchema);
