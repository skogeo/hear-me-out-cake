const express = require('express');
const { createServer } = require('http');
const cors = require('cors');
const { initSocketServer } = require('./socket');
const { initializeDirectories } = require('./utils/fileHandlers');
const routes = require('./routes');

const app = express();
const server = createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', routes);

// Initialize upload directories
initializeDirectories();

// Initialize Socket.IO
initSocketServer(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready for connections`);
});