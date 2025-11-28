import { Router } from 'express';
import authJwt from '../middleware/authJwt.js';
import {
    createHighlight,
    getHighlights,
    addStoryToHighlight,
    removeStoryFromHighlight,
    updateHighlight,
    deleteHighlight
} from '../controllers/highlight.controller.js';

const router = Router();

router.post('/', authJwt, createHighlight);
router.get('/user/:username', getHighlights);
router.post('/add', authJwt, addStoryToHighlight);
router.delete('/:highlightId/stories/:storyId', authJwt, removeStoryFromHighlight);
router.patch('/:id', authJwt, updateHighlight);
router.delete('/:id', authJwt, deleteHighlight);

export default router;
