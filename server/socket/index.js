const { Server } = require('socket.io');
const SessionManager = require('../services/SessionManager');

const corsOptions = {
  origin: ['http://localhost:5173', 'https://hear-me-out-cake.skogeo.me'], // Add your frontend URLs here
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

function initSocketServer(server) {
  const io = new Server(server, {
    cors: corsOptions
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('joinSession', (data) => SessionManager.handleJoinSession(io, socket, data));
    socket.on('leaveSession', (data) => SessionManager.handleLeaveSession(io, socket, data));
    socket.on('setReady', (data) => SessionManager.handleSetReady(io, socket, data));
    socket.on('uploadImages', (data) => SessionManager.handleUploadImages(io, socket, data));
    socket.on('disconnect', () => SessionManager.handleDisconnect(io, socket));
  });

  return io;
}

module.exports = { initSocketServer };