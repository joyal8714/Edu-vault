// server.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import authRoutes from './backend/routes/authRoutes.js';
import videoRoutes from './backend/routes/videoRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

// HLS folder (stream output)
app.use('/hls', express.static(path.join(__dirname, 'hls')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ------------------ LIVE STREAM LOGIC ------------------ //
let ffmpegProcess = null;

app.post('/api/admin/live/start', (req, res) => {
  if (ffmpegProcess) {
    return res.status(400).json({ message: 'Live stream is already running', url: '/hls/stream.m3u8' });
  }

  // Ensure HLS folder exists
  import('fs').then(fs => {
    const hlsDir = path.join(__dirname, 'hls');
    if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir);

    ffmpegProcess = spawn('ffmpeg', [
      '-f', 'v4l2',
      '-i', '/dev/video0',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-f', 'hls',
      '-hls_time', '4',
      '-hls_list_size', '5',
      path.join(hlsDir, 'stream.m3u8')
    ]);

    ffmpegProcess.stderr.on('data', data => console.log(data.toString()));

    ffmpegProcess.on('close', code => {
      console.log(`FFmpeg exited with code ${code}`);
      ffmpegProcess = null;
    });

    res.json({ message: 'Live stream started', url: '/hls/stream.m3u8' });
  });
});

app.post('/api/admin/live/stop', (req, res) => {
  if (!ffmpegProcess) {
    return res.status(400).json({ message: 'No live stream running' });
  }
  ffmpegProcess.kill('SIGINT');
  ffmpegProcess = null;
  res.json({ message: 'Live stream stopped' });
});

// -------------------------------------------------------- //

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
