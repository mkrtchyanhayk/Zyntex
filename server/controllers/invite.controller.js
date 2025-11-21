import Invitation from '../models/Invitation.js';
import Group from '../models/Group.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

export const listMyInvites = async (req, res) => {
  const inv = await Invitation.find({ to: req.userId, status: 'pending' }).populate('from', 'username displayName avatarUrl').populate('group', 'name');
  res.json(inv);
};

export const sendInvite = async (req, res) => {
  const { to, type, groupId } = req.body;
  if (!to || !type) return res.status(400).json({ message: 'to and type required' });
  // prevent duplicate pending invites
  const existing = await Invitation.findOne({ from: req.userId, to, type, group: groupId || null, status: 'pending' });
  if (existing) return res.status(200).json(existing);
  const inv = await Invitation.create({ from: req.userId, to, type, group: groupId || null });
  res.status(201).json(inv);
};

export const counts = async (req, res) => {
  const pending = await Invitation.aggregate([
    { $match: { to: new mongoose.Types.ObjectId(req.userId), status: 'pending' } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  const out = { total: 0, dm: 0, group: 0 };
  for (const p of pending) {
    out[p._id] = p.count; out.total += p.count;
  }
  const unreadNotifications = await Notification.countDocuments({ user: req.userId, read: false });
  out.notifications = unreadNotifications;
  out.mailboxTotal = out.total + unreadNotifications;
  res.json(out);
};

export const respondInvite = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' | 'decline'
  const inv = await Invitation.findById(id);
  if (!inv || inv.to.toString() !== req.userId) return res.status(404).json({ message: 'Invite not found' });
  inv.status = action === 'accept' ? 'accepted' : 'declined';
  await inv.save();
  let conversationId = null;
  if (action === 'accept') {
    if (inv.type === 'group' && inv.group) {
      // add member to group and ensure conversation contains all members
      const group = await Group.findByIdAndUpdate(inv.group, { $addToSet: { members: req.userId } }, { new: true });
      if (!group) return res.status(404).json({ message: 'Group not found' });
      let convo = await Conversation.findOne({ group: group._id });
      if (!convo) {
        convo = await Conversation.create({ group: group._id, members: group.members });
      } else {
        await Conversation.updateOne({ _id: convo._id }, { $addToSet: { members: { $each: group.members } } });
      }
      conversationId = (convo?._id) || null;
    }
    if (inv.type === 'dm') {
      let convo = await Conversation.findOne({ members: { $all: [inv.from, inv.to], $size: 2 } });
      if (!convo) {
        convo = await Conversation.create({ members: [inv.from, inv.to] });
      }
      conversationId = convo._id;
    }
  }
  res.json({ invitation: inv, conversationId });
};

