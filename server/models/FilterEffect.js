import mongoose from 'mongoose';

const FilterEffectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    displayName: String,
    category: {
        type: String,
        enum: ['beauty', 'color', 'vintage', 'fun', 'ar'],
        default: 'color'
    },
    thumbnailUrl: String,
    previewUrl: String, // Video/GIF preview
    usageCount: {
        type: Number,
        default: 0,
        index: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    settings: {
        intensity: {
            min: Number,
            max: Number,
            default: Number
        },
        adjustable: Boolean
    }
}, {
    timestamps: true
});

// Indexes
FilterEffectSchema.index({ usageCount: -1 });
FilterEffectSchema.index({ isFeatured: -1, usageCount: -1 });

export default mongoose.model('FilterEffect', FilterEffectSchema);
