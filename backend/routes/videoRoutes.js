
import express from 'express';
import { getVideosByUser } from '../controllers/videoController.js'; 
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-videos', authenticateJWT, getVideosByUser);

export default router;
