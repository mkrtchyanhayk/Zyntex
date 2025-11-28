import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import authJwt from '../middleware/authJwt.js';
import { getMe, updateMe, getByUsername, getUserPosts, searchUsers, changeUsername, toggleFollow, getStats } from '../controllers/user.controller.js';
import authJwtOptional from '../middleware/authJwtOptional.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

router.get('/me', authJwt, getMe);
router.get('/me/stats', authJwt, getStats);
router.put('/me', authJwt, upload.single('avatar'), updateMe);
router.get('/search', searchUsers);
router.patch('/me/username', authJwt, changeUsername);
router.post('/:username/follow', authJwt, toggleFollow);
router.get('/:username', getByUsername);
router.get('/:username/posts', authJwtOptional, getUserPosts);

export default router;

