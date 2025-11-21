import Group from '../models/Group.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';

export const createGroup = async (req, res) => {
  try {
    let { name, memberIds } = req.body;
    if (!name || !/^[a-zA-Z0-9\s\-_]{3,50}$/.test(name)) {
      return res.status(400).json({ message: 'Group name must be 3-50 chars, alphanumeric with spaces, hyphens, underscores' });
    }
    try {
      if (typeof memberIds === 'string') {
        memberIds = JSON.parse(memberIds);
      }
    } catch (_) {
      memberIds = [];
    }
    const uniqueInvitees = (memberIds || []).filter((id, idx, arr) => id !== req.userId && arr.indexOf(id) === idx);
    const group = await Group.create({ name, members: [req.userId], admins: [req.userId], createdBy: req.userId, avatarUrl: req.file ? `/uploads/${req.file.filename}` : '' });
    // Create invites for others
    await Promise.all(uniqueInvitees.map((to) => Invitation.create({ from: req.userId, to, type: 'group', group: group._id })));
    const populated = await group.populate('members', 'username displayName avatarUrl');
    res.status(201).json({ ...populated.toObject(), conversationId: null });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create group', error: err.message });
  }
};

export const listMyGroups = async (req, res) => {
  const groups = await Group.find({ members: req.userId }).populate('members', 'username displayName avatarUrl').populate('admins', 'username');
  // Fetch conversation ids
  const convos = await Conversation.find({ group: { $in: groups.map(g => g._id) } }).select('group _id');
  const map = new Map(convos.map(c => [c.group.toString(), c._id]));
  res.json(groups.map(g => ({ ...g.toObject(), conversationId: map.get(g._id.toString()) })));
};

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const group = await Group.findById(id);
    if (!group || !group.admins.some((a) => a.toString() === req.userId)) {
      return res.status(403).json({ message: 'Only admins can update group' });
    }
    const update = {};
    if (name && /^[a-zA-Z0-9\s\-_]{3,50}$/.test(name)) update.name = name;
    if (req.file) update.avatarUrl = `/uploads/${req.file.filename}`;
    const updated = await Group.findByIdAndUpdate(id, update, { new: true }).populate('members', 'username displayName avatarUrl');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update group', error: err.message });
  }
};

export const getOrCreateGroupConversation = async (req, res) => {
  const { id } = req.params;
  let convo = await Conversation.findOne({ group: id });
  if (!convo) {
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    convo = await Conversation.create({ group: id, members: group.members });
  }
  res.json(convo);
};

