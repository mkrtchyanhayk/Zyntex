import { Router } from 'express';
import authJwt from '../middleware/authJwt.js';
import {
    getAudioLibrary,
    getTrendingAudio,
    addAudioTrack
} from '../controllers/audio.controller.js';

const router = Router();

router.get('/library', getAudioLibrary);
router.get('/trending', getTrendingAudio);
router.post('/add', authJwt, addAudioTrack);

export default router;
