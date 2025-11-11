// server.js (Final Version with Cache-Control Headers)

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Route Imports ---
import authRoutes from './backend/routes/authRoutes.js';
import videoRoutes from './backend/routes/videoRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. Core Middleware ---
app.use(cors({
  origin: 'http://localhost:5000',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// --- 2. API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);


// --- 3. Static File Routes (Correct Order) ---

// **THIS IS THE NEW CODE BLOCK TO PREVENT CACHING**
// First, define a middleware specifically for the /hls route.
app.use('/hls', (req, res, next) => {
  // Tell browsers not to cache HLS files.
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next(); // Continue to the next middleware (the static server)
});

// Now, serve the HLS directory.
app.use('/hls', express.static(path.join(__dirname, 'hls')));

// Serve the main frontend directory for CSS, JS, images, etc.
app.use(express.static(path.join(__dirname, 'frontend')));


// --- 4. Frontend Fallback Route (Must be LAST) ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));