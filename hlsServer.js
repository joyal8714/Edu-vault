import HlsServer from 'hls-server';
import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const server = http.createServer(app);

// Serve static folder for HLS chunks
const hlsDir = path.join(process.cwd(), 'hls');
if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir);

// Start HLS server
const hls = new HlsServer(server, {
  provider: {
    exists: (req, cb) => {
      const filePath = path.join(hlsDir, req.url);
      fs.access(filePath, fs.constants.F_OK, (err) => cb(null, !err));
    },
    getManifest: (req, cb) => {
      const filePath = path.join(hlsDir, req.url);
      fs.readFile(filePath, (err, content) => cb(err, content));
    },
    getSegment: (req, cb) => {
      const filePath = path.join(hlsDir, req.url);
      fs.readFile(filePath, (err, content) => cb(err, content));
    }
  }
});

server.listen(8000, () => console.log('HLS server running on port 8000'));
