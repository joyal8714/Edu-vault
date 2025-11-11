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
    // --- Input Analysis Flags (Process Immediately) ---
    '-probesize', '32',        // Analyze only a tiny amount of data
    '-analyzeduration', '0',   // Don't spend time analyzing the stream duration
    '-fflags', 'nobuffer',     // Do not buffer input data, process it as it arrives

    // --- Input Devices ---
    '-f', 'v4l2',
    '-i', videoDevice,
    '-f', 'alsa',
    '-i', audioDevice,

    // --- Codecs and Performance ---
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-b:v', '2000k',           // Set a target video bitrate (e.g., 2 Mbps) for stability
    '-c:a', 'aac',
    '-b:a', '128k',
    '-threads', '2',           // Use a specific number of CPU threads

    // --- HLS Output Settings (Smaller Chunks for Less Delay) ---
    '-f', 'hls',
    '-hls_time', '2',          // Create smaller 2-second chunks
    '-hls_list_size', '3',     // Keep only the last 3 chunks in the playlist
    '-hls_flags', 'delete_segments',
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