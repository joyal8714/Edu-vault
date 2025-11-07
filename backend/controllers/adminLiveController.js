import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

const hlsDir = path.join(process.cwd(), 'hls');
if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir);

let currentStream = null;

export const startStream = (req, res) => {
  if (currentStream) {
    return res.status(400).json({ message: 'Stream already running' });
  }

  // Linux webcam input
  const webcamDevice = '/dev/video0'; // change if needed

  currentStream = ffmpeg(webcamDevice)
    .inputFormat('v4l2')
    .videoCodec('libx264')
    .addOptions([
      '-preset veryfast',
      '-tune zerolatency',
      '-hls_time 4',
      '-hls_list_size 5',
      '-f hls'
    ])
    .output(path.join(hlsDir, 'stream.m3u8'))
    .on('start', (cmd) => console.log('FFmpeg started:', cmd))
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      currentStream = null;
    })
    .on('end', () => {
      console.log('FFmpeg stream ended');
      currentStream = null;
    })
    .run();

  res.json({ message: 'Live stream started', url: 'http://localhost:8000/stream.m3u8' });
};

export const stopStream = (req, res) => {
  if (currentStream) {
    currentStream.kill('SIGINT');
    currentStream = null;
    res.json({ message: 'Stream stopped' });
  } else {
    res.status(400).json({ message: 'No active stream' });
  }
};
