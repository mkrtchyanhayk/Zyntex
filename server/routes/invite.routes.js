import { Router } from 'express';
import authJwt from '../middleware/authJwt.js';
import { listMyInvites, sendInvite, respondInvite, counts } from '../controllers/invite.controller.js';

const router = Router();

router.get('/', authJwt, listMyInvites);
router.get('/counts', authJwt, counts);
router.post('/', authJwt, sendInvite);
router.post('/:id/respond', authJwt, respondInvite);

export default router;

