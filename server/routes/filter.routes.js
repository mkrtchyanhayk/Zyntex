import { Router } from 'express';
import authJwt from '../middleware/authJwt.js';
import {
    getFilters,
    getTrendingFilters,
    createFilter
} from '../controllers/filter.controller.js';

const router = Router();

router.get('/', getFilters);
router.get('/trending', getTrendingFilters);
router.post('/', authJwt, createFilter);

export default router;
