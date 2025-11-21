import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['dm', 'group'], required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
  },
  { timestamps: true }
);

export default mongoose.model('Invitation', invitationSchema);

