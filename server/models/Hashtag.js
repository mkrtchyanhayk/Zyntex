import mongoose from 'mongoose';

const hashtagSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, lowercase: true, trim: true },
        count: { type: Number, default: 1 },
        lastUsed: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

hashtagSchema.index({ name: 1 });
hashtagSchema.index({ count: -1 });
hashtagSchema.index({ lastUsed: -1 });

export default mongoose.model('Hashtag', hashtagSchema);
