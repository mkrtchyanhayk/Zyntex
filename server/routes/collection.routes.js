import { Router } from 'express';
import authJwt from '../middleware/authJwt.js';
import {
    createCollection,
    getCollections,
    getCollection,
    addPostToCollection,
    removePostFromCollection,
    updateCollection,
    deleteCollection
} from '../controllers/collection.controller.js';

const router = Router();

router.post('/', authJwt, createCollection);
router.get('/', authJwt, getCollections);
router.get('/:id', authJwt, getCollection);
router.post('/add', authJwt, addPostToCollection);
router.delete('/:collectionId/posts/:postId', authJwt, removePostFromCollection);
router.patch('/:id', authJwt, updateCollection);
router.delete('/:id', authJwt, deleteCollection);

export default router;
