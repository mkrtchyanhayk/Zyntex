import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    // Legacy single image field
    imageUrl: { type: String, default: '' },

    // New multi-image support
    images: [{
      url: { type: String, required: true },
      width: Number,
      height: Number,
      order: { type: Number, default: 0 }
    }],

    // Media type
    mediaType: { type: String, enum: ['image', 'video', 'carousel', 'text'], default: 'image' },

    // Content
    textContent: { type: String, default: '' },
    caption: { type: String, default: '' },

    // Author
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Engagement
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: {
      type: Map,
      of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: {}
    },

    // Photo tagging
    taggedUsers: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      coordinates: {
        x: { type: Number, min: 0, max: 100 },
        y: { type: Number, min: 0, max: 100 }
      }
    }],

    // Analytics
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },

    // Settings
    hideLikeCount: { type: Boolean, default: false },
    commentsDisabled: { type: Boolean, default: false },
    location: {
      name: String,
      latitude: Number,
      longitude: Number
    },

    // Visibility
    visibility: { type: String, enum: ['public', 'followers', 'close-friends', 'private'], default: 'public' }
  },
  { timestamps: true }
);

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'taggedUsers.user': 1 });

export default mongoose.model('Post', postSchema);
