// backend/routes/adminRoutes.js

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

// --- Video and User Management Routes ---
router.post("/upload-video", authenticateJWT, isAdmin, upload.single("video"), uploadVideo);
router.post('/grant-access', authenticateJWT, isAdmin, grantAccess);
router.post('/remove-access', authenticateJWT, isAdmin, removeAccess);
router.get('/all-videos', authenticateJWT, isAdmin, getAllVideos);
router.get('/users', authenticateJWT, isAdmin, getAllUsers);
router.delete('/delete-video/:id', authenticateJWT, isAdmin, deleteVideo);

// --- Live Stream Routes ---
router.get('/live', authenticateJWT, hasAccessToStream, (req, res) => {
  res.json({ url: 'http://localhost:5000/hls/stream.m3u8' });
});

// **ADD LOGGING MIDDLEWARE HERE**
router.post('/start', (req, res, next) => {
    console.log('--- 1. Request received for /api/admin/start ---');
    next(); // Pass control to the next middleware in the chain
}, authenticateJWT, isAdmin, startStream);

router.post('/stop', (req, res, next) => {
    console.log('--- 1. Request received for /api/admin/stop ---');
    next();
}, authenticateJWT, isAdmin, stopStream);

export default router;