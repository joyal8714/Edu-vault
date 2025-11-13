import express from 'express';
import upload from "../config/cloudinary.js";
import { 
  uploadVideo, grantAccess, getAllVideos, deleteVideo, getAllUsers, removeAccess 
} from '../controllers/adminController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Video Upload
router.post("/upload-video", authenticateJWT, isAdmin, upload.single("video"), uploadVideo);

// Grant/Remove Access
router.post('/grant-access', authenticateJWT, isAdmin, grantAccess);
router.post('/remove-access', authenticateJWT, isAdmin, removeAccess);

// Get Videos & Users
router.get('/all-videos', authenticateJWT, isAdmin, getAllVideos);
router.get('/users', authenticateJWT, isAdmin, getAllUsers);

// Delete Video
router.delete('/delete-video/:id', authenticateJWT, isAdmin, deleteVideo);

// NOTE: The /start and /stop routes have been removed.

export default router;