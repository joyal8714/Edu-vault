// server.js (Final Definitive Version with Correct Fallback Route)

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// --- Route Imports ---
import authRoutes from './backend/routes/authRoutes.js';
import videoRoutes from './backend/routes/videoRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. Core Middleware ---
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- 2. API Routes ---
// API routes must be handled first.
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);

// --- 3. Static File Serving ---
// This serves all files (CSS, JS, images) from your 'frontend' folder.
app.use(express.static(path.join(__dirname, 'frontend')));

// --- 4. Frontend Fallback Route (Must be LAST) ---
// **THIS IS THE FINAL FIX**
// This route now catches any request that was NOT an API call and NOT a static file
// and sends the correct HTML file. It handles /admin.html, /dashboard.html, etc.
app.get('/', (req, res) => {
  // Use path.resolve to prevent path traversal security vulnerabilities
  const safePath = path.resolve(path.join(__dirname, 'frontend', req.path));

  // Check if the requested path is for an HTML file within the frontend directory
  if (safePath.startsWith(path.join(__dirname, 'frontend')) && req.path.endsWith('.html')) {
    res.sendFile(safePath);
  } else {
    // For any other path (like '/login' or '/'), default to index.html
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
  }
});

// --- 5. Create HTTP and WebSocket Servers ---
const server = createServer(app);
const wss = new WebSocketServer({ server });

let broadcasterSocket = null; // Holds the single broadcaster's connection
const viewers = new Map();     // Stores all connected viewers by their unique ID

wss.on('connection', (ws) => {
    const clientId = uuidv4();
    ws.id = clientId;
    console.log(`Client connected: ${clientId}`);

    ws.on('message', (messageAsString) => {
        const message = JSON.parse(messageAsString);

        switch (message.type) {
            case 'broadcaster':
                broadcasterSocket = ws;
                console.log(`Broadcaster registered: ${ws.id}`);
                viewers.forEach(viewerWs => {
                    viewerWs.send(JSON.stringify({ type: 'broadcaster_ready' }));
                });
                break;
            case 'viewer':
                viewers.set(clientId, ws);
                console.log(`Viewer registered: ${ws.id}`);
                if (broadcasterSocket) {
                    ws.send(JSON.stringify({ type: 'broadcaster_ready' }));
                }
                break;
            case 'offer':
                if (broadcasterSocket) {
                    broadcasterSocket.send(JSON.stringify({ type: 'offer', offer: message.offer, viewerId: ws.id }));
                }
                break;
            case 'answer':
                const targetViewer = viewers.get(message.target);
                if (targetViewer) {
                    targetViewer.send(JSON.stringify({ type: 'answer', answer: message.answer }));
                }
                break;
            case 'candidate':
                const targetId = message.target;
                let targetSocket = (targetId === 'broadcaster') ? broadcasterSocket : viewers.get(targetId);
                if (targetSocket) {
                    targetSocket.send(JSON.stringify({ type: 'candidate', candidate: message.candidate, senderId: ws.id }));
                }
                break;
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        if (ws === broadcasterSocket) {
            console.log('Broadcaster has disconnected.');
            broadcasterSocket = null;
            viewers.forEach(viewerWs => {
                viewerWs.send(JSON.stringify({ type: 'disconnect' }));
            });
        } else {
            viewers.delete(clientId);
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server (HTTP & WebSocket) is running on http://localhost:${PORT}`);
});