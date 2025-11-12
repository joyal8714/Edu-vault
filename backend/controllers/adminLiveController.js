// backend/controllers/adminLiveController.js (Optimized for Low Latency)

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

let ffmpegProcess = null;

const __dirname = path.resolve(path.dirname('')); 
const hlsDir = path.join(__dirname, 'hls');

function cleanAndEnsureHlsDir() {
  if (fs.existsSync(hlsDir)) {
    console.log('Cleaning existing HLS directory...');
    const files = fs.readdirSync(hlsDir);
    for (const file of files) {
      fs.unlinkSync(path.join(hlsDir, file));
    }
  } else {
    fs.mkdirSync(hlsDir, { recursive: true });
  }
}

export const startStream = (req, res) => {
  console.log('--- Reached startStream controller ---');
  if (ffmpegProcess) {
    return res.status(400).json({ message: 'Stream is already running.' });
  }

  cleanAndEnsureHlsDir();

  const videoDevice = '/dev/video0';
  const audioDevice = 'hw:2,0'; // Your specific Logi USB Headset

  // --- THIS IS THE NEW, ULTRA-LOW-LATENCY FFMPEG COMMAND ---
  const ffmpegArgs = [
    // Input Devices
    '-f', 'v4l2', '-i', videoDevice,
    '-f', 'alsa', '-i', audioDevice,

    // **CRITICAL FIX:** Enforce the most compatible formats for browsers
    '-pix_fmt', 'yuv420p',  // The most compatible pixel format
    '-ar', '44100',         // A standard audio sample rate

    // Video Codec & Performance
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency',

    // Audio Codec
    '-c:a', 'aac', '-b:a', '128k',

    // HLS Output Settings
    '-f', 'hls', '-hls_time', '2', '-hls_list_size', '5', '-hls_flags', 'delete_segments',
    path.join(hlsDir, 'stream.m3u8')
  ];


  console.log(`Starting FFmpeg with LOW LATENCY settings for audio device ${audioDevice}...`);
  ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

  // Error and status logging (no changes here)
  ffmpegProcess.stderr.on('data', data => console.log(`FFmpeg: ${data}`));
  ffmpegProcess.on('close', code => console.log(`FFmpeg process exited with code ${code}`));
  ffmpegProcess.on('error', (err) => console.error('Failed to start FFmpeg process:', err));

  setTimeout(() => res.json({ message: '🎥 Live stream started!' }), 3000);
};

// stopStream function remains the same
export const stopStream = (req, res) => {
  if (!ffmpegProcess) {
    return res.status(400).json({ message: 'No active stream to stop.' });
  }
  console.log('Stopping FFmpeg stream...');
  ffmpegProcess.kill('SIGINT');
  ffmpegProcess = null;
  res.json({ message: '⏹️ Live stream stopped.' });
};