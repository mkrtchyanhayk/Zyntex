import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import authJwt from '../middleware/authJwt.js';
import { createGroup, listMyGroups, updateGroup, getOrCreateGroupConversation } from '../controllers/group.controller.js';

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

router.get('/', authJwt, listMyGroups);
router.post('/', authJwt, upload.single('avatar'), createGroup);
router.put('/:id', authJwt, upload.single('avatar'), updateGroup);
router.get('/:id/conversation', authJwt, getOrCreateGroupConversation);

export default router;

