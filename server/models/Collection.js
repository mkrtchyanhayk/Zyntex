import mongoose from 'mongoose';

const CollectionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    coverImage: {
        type: String
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'private'
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
CollectionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Collection', CollectionSchema);
