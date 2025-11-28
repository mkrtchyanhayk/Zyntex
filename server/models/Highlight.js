import mongoose from 'mongoose';

const HighlightSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 16
    },
    coverImage: {
        type: String
    },
    stories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story'
    }],
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
HighlightSchema.index({ user: 1, order: 1 });

export default mongoose.model('Highlight', HighlightSchema);
