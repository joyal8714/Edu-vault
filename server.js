// server.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
// Import routes (note the .js extension)
import authRoutes from './backend/routes/authRoutes.js';
import videoRoutes from './backend/routes/videoRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Import database connection
import db from './backend/config/db.js'; // ensure your db.js uses ESM export

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);

// Root route for testing
app.get('/', (req, res) => {
  res.sendFile(new URL('./frontend/index.html', import.meta.url));
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
