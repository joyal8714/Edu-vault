// backend/routes/videoRoutes.js
import express from 'express';
import { getVideosByUser } from '../controllers/videoController.js'; // <-- note .js extension
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-videos', authenticateJWT, getVideosByUser);

export default router;
