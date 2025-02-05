const express = require('express');
const { createServer } = require('http');
const cors = require('cors');
const { initSocketServer } = require('./socket');
const { initializeDirectories } = require('./utils/fileHandlers');
const routes = require('./routes');

const app = express();
const server = createServer(app);

const corsOptions = {
  origin: ['http://localhost:5173', 'https://hear-me-out-cake.skogeo.me'], // Add your frontend URLs here
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Initialize upload directories
initializeDirectories();

// Initialize Socket.IO
const io = initSocketServer(server);

// Routes
app.use('/api', (req, res, next) => {
  req.io = io;
  next();
}, routes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready for connections`);
});