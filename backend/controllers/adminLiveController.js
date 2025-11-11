// backend/controllers/adminLiveController.js

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

let ffmpegProcess = null;

const __dirname = path.resolve(path.dirname('')); 
const hlsDir = path.join(__dirname, 'hls');

// --- THIS IS THE NEW, CORRECTED HELPER FUNCTION ---
// It now cleans the directory before starting a new stream.
function cleanAndEnsureHlsDir() {
  if (fs.existsSync(hlsDir)) {
    // If directory exists, delete all files inside it
    console.log('Cleaning existing HLS directory...');
    const files = fs.readdirSync(hlsDir);
    for (const file of files) {
      fs.unlinkSync(path.join(hlsDir, file));
    }
    console.log('HLS directory cleaned successfully.');
  } else {
    // If directory doesn't exist, create it
    fs.mkdirSync(hlsDir, { recursive: true });
    console.log('Created HLS directory:', hlsDir);
  }
}

// Controller to start the live stream
export const startStream = (req, res) => {
  // We added a log here in the previous step, which is great for debugging.
  console.log('--- 4. SUCCESS! Reached startStream controller. ---');

  if (ffmpegProcess) {
    return res.status(400).json({ message: 'Stream is already running.' });
  }

  // Use the new, correct function here
  cleanAndEnsureHlsDir();

  const webcamDevice = '/dev/video0'; 

  const ffmpegArgs = [
    '-f', 'v4l2', '-i', webcamDevice,
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency',
    '-f', 'hls', '-hls_time', '4', '-hls_list_size', '5', '-hls_flags', 'delete_segments',
    path.join(hlsDir, 'stream.m3u8')
  ];

  console.log('Starting FFmpeg process...');
  ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

  ffmpegProcess.stderr.on('data', data => {
    console.log(`FFmpeg: ${data}`);
  });

  ffmpegProcess.on('close', code => {
    console.log(`FFmpeg process exited with code ${code}`);
    ffmpegProcess = null;
  });

  ffmpegProcess.on('error', (err) => {
    console.error('Failed to start FFmpeg process:', err);
    ffmpegProcess = null;
  });

  setTimeout(() => {
    res.json({ message: '🎥 Live stream started!' });
  }, 2500);
};

// Controller to stop the live stream
export const stopStream = (req, res) => {
  if (!ffmpegProcess) {
    return res.status(400).json({ message: 'No active stream to stop.' });
  }

  console.log('Stopping FFmpeg stream...');
  ffmpegProcess.kill('SIGINT');
  ffmpegProcess = null;
  
  res.json({ message: '⏹️ Live stream stopped.' });
};