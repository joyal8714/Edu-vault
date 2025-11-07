import express from 'express';
import upload from "../config/cloudinary.js";
import { 
  uploadVideo, grantAccess, getAllVideos, deleteVideo, getAllUsers, removeAccess 
} from '../controllers/adminController.js';
import { startStream, stopStream } from '../controllers/adminLiveController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import { hasAccessToStream } from '../middleware/videoAccessMiddleware.js';

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

// HLS Live Stream (Admin controls)
router.post('/start', authenticateJWT, isAdmin, startStream);
router.post('/stop', authenticateJWT, isAdmin, stopStream);

// HLS Live Stream (User access)
router.get('/live', authenticateJWT, hasAccessToStream, (req, res) => {
  res.json({ url: 'http://localhost:8000/stream.m3u8' });
});

export default router;
