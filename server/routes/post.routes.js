import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import authJwt from '../middleware/authJwt.js';
import {
  createPost,
  getFeed,
  toggleLike,
  reactToPost,
  getPostReactions,
  listComments,
  addComment,
  deleteComment,
  updateLikeVisibility,
  markSeen
} from '../controllers/post.controller.js';

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
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

router.get('/feed', authJwtOptional, getFeed);
router.post('/', authJwt, upload.array('images', 10), createPost);
router.post('/:id/like', authJwt, toggleLike);
router.post('/:id/react/:emoji', authJwt, reactToPost);
router.post('/:id/seen', authJwt, markSeen);
router.get('/:id/reactions', authJwt, getPostReactions);
router.patch('/:id/visibility', authJwt, updateLikeVisibility);
router.get('/:id/comments', listComments);
router.post('/:id/comments', authJwt, addComment);
router.delete('/:id/comments/:commentId', authJwt, deleteComment);

export default router;

