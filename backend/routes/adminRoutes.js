import express from 'express';
import { uploadVideo, grantAccess, getAllVideos,deleteVideo,getAllUsers } from '../controllers/adminController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
const router = express.Router();

router.post('/upload-video', authenticateJWT, isAdmin, uploadVideo);

// Grant user access
router.post('/grant-access', authenticateJWT, isAdmin, grantAccess);
router.get('/all-videos', authenticateJWT, isAdmin, getAllVideos);
router.delete('/delete-video/:id', authenticateJWT, isAdmin, deleteVideo);
router.get('/users', authenticateJWT, isAdmin, getAllUsers); 
export default router; 
