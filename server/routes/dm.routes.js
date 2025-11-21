import { Router } from 'express';
import authJwt from '../middleware/authJwt.js';
import { listConversations, startConversation, listMessages, sendMessage, toggleReaction } from '../controllers/dm.controller.js';

const router = Router();

router.get('/conversations', authJwt, listConversations);
router.post('/conversations', authJwt, startConversation);
router.get('/conversations/:id/messages', authJwt, listMessages);
router.post('/conversations/:id/messages', authJwt, sendMessage);
router.post('/messages/:id/reactions', authJwt, toggleReaction);

export default router;

