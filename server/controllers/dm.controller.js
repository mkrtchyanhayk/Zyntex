import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

export const listConversations = async (req, res) => {
  const convos = await Conversation.find({ members: req.userId }).sort({ updatedAt: -1 }).populate('members', 'username displayName avatarUrl').populate('group', 'name avatarUrl');
  res.json(convos);
};

export const startConversation = async (req, res) => {
  const { to } = req.body; // to can be userId or username
  let other;
  if (!to) return res.status(400).json({ message: 'Recipient required' });
  if (to.match(/^[a-f\d]{24}$/i)) {
    other = await User.findById(to).select('_id');
  } else {
    other = await User.findOne({ username: to }).select('_id');
  }
  if (!other) return res.status(404).json({ message: 'Recipient not found' });
  let convo = await Conversation.findOne({ members: { $all: [req.userId, other._id], $size: 2 } });
  if (!convo) convo = await Conversation.create({ members: [req.userId, other._id] });
  res.status(201).json(convo);
};

export const listMessages = async (req, res) => {
  const { id } = req.params;
  const convo = await Conversation.findById(id);
  if (!convo || !convo.members.some((m) => m.toString() === req.userId)) return res.status(404).json({ message: 'Conversation not found' });
  const msgs = await Message.find({ conversation: id }).sort({ createdAt: 1 }).populate('sender', 'username avatarUrl');
  res.json(msgs);
};

export const sendMessage = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Text is required' });
  const convo = await Conversation.findById(id);
  if (!convo || !convo.members.some((m) => m.toString() === req.userId)) return res.status(404).json({ message: 'Conversation not found' });
  const msg = await Message.create({ conversation: id, sender: req.userId, text });
  await Conversation.findByIdAndUpdate(id, { updatedAt: new Date() });
  const populated = await msg.populate('sender', 'username avatarUrl');
  res.status(201).json(populated);
};

export const toggleReaction = async (req, res) => {
  const { id } = req.params; // message id
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ message: 'emoji required' });
  const msg = await Message.findById(id);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  const current = msg.reactions.get(emoji) || [];
  const exists = current.some((u) => u.toString() === req.userId);
  const updated = exists ? current.filter((u) => u.toString() !== req.userId) : [...current, req.userId];
  if (updated.length === 0) {
    msg.reactions.delete(emoji);
  } else {
    msg.reactions.set(emoji, updated);
  }
  await msg.save();
  const populated = await msg.populate('sender', 'username avatarUrl');
  res.json(populated);
};

