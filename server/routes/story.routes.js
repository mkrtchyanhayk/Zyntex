import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import authJwt from '../middleware/authJwt.js';
import {
    createStory,
    getStoriesFeed,
    getUserStories,
    viewStory,
    deleteStory,
    getStoryViewers,
    voteOnPoll,
    answerQuestion,
    answerQuiz,
    subscribeCountdown,
    respondToSlider,
    reportScreenshot,
    getQuestionResponses
} from '../controllers/story.controller.js';

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
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB for videos
});

// Story CRUD
router.post('/', authJwt, upload.single('media'), createStory);
router.get('/feed', authJwt, getStoriesFeed);
router.get('/user/:username', authJwt, getUserStories);
router.post('/:id/view', authJwt, viewStory);
router.get('/:id/viewers', authJwt, getStoryViewers);
router.delete('/:id', authJwt, deleteStory);

// Interactive features
router.post('/poll/vote', authJwt, voteOnPoll);
router.post('/question/answer', authJwt, answerQuestion);
router.get('/:id/question/responses', authJwt, getQuestionResponses);
router.post('/quiz/answer', authJwt, answerQuiz);
router.post('/:id/countdown/subscribe', authJwt, subscribeCountdown);
router.post('/slider/respond', authJwt, respondToSlider);
router.post('/:id/screenshot', authJwt, reportScreenshot);

export default router;
