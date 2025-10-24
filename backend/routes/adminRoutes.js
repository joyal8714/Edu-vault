import express from 'express';
import { uploadVideo, grantAccess } from '../controllers/adminController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
const router = express.Router();

router.post('/upload-video', authenticateJWT, isAdmin, uploadVideo);

// Grant user access
router.post('/grant-access', authenticateJWT, isAdmin, grantAccess);

export default router; 
