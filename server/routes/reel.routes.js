import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import authJwt from '../middleware/authJwt.js';
import {
    createReel,
    getReelsFeed,
    getReel,
    toggleReelLike,
    deleteReel,
    createRemix
} from '../controllers/reel.controller.js';

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.mp4';
        cb(null, unique + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB for videos
});

router.post('/', authJwt, upload.single('video'), createReel);
router.post('/remix', authJwt, upload.single('video'), createRemix);
router.get('/feed', getReelsFeed);
router.get('/:id', getReel);
router.post('/:id/like', authJwt, toggleReelLike);
router.delete('/:id', authJwt, deleteReel);

export default router;
