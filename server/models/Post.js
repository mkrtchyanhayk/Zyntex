import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, default: '' },
    textContent: { type: String, default: '' },
    caption: { type: String, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: {
      type: Map,
      of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: {}
    },
    hideLikeCount: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Post', postSchema);

