import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Route Imports
import authRoutes from './backend/routes/authRoutes.js';
import videoRoutes from './backend/routes/videoRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';

// The new Media Server
import nms from './backend/mediaServer.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core Middleware
app.use(cors({
  origin: 'http://localhost:5000',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);

// **NEW:** Proxy for the HLS Stream
// This forwards requests from /hls to the NodeMediaServer on port 8000
app.use('/hls', createProxyMiddleware({ 
  target: 'http://localhost:8000/live', 
  changeOrigin: true,
  pathRewrite: {
    '^/hls': '/stream.m3u8', // Rewrites /hls to the correct path on the media server
  },
}));

// Static File Serving
app.use(express.static(path.join(__dirname, 'frontend')));

// Frontend Fallback Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
  // Start the Node Media Server after the Express server starts
  nms.run();
  console.log(`🎬 Node Media Server is running and listening for RTMP on port 1935`);
});