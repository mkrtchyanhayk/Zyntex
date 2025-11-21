import { Router } from 'express';
import authJwt from '../middleware/authJwt.js';
import { listNotifications, markNotificationRead } from '../controllers/notification.controller.js';

const router = Router();

router.get('/', authJwt, listNotifications);
router.patch('/:id/read', authJwt, markNotificationRead);

export default router;


