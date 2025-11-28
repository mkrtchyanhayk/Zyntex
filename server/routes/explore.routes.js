import { Router } from 'express';
import authJwtOptional from '../middleware/authJwtOptional.js';
import {
    getExploreFeed,
    getTrendingHashtags,
    getSuggestedUsers
} from '../controllers/explore.controller.js';

const router = Router();

router.get('/feed', authJwtOptional, getExploreFeed);
router.get('/trending', getTrendingHashtags);
router.get('/users', authJwtOptional, getSuggestedUsers);

export default router;
