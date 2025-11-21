import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null }
  },
  { timestamps: true }
);

conversationSchema.index({ members: 1 });

export default mongoose.model('Conversation', conversationSchema);

