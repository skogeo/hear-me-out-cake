import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
    cb(null, true);
  }
});

// Sessions storage
const sessions = new Map();

// Helper function to check session state
const checkSessionState = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) return;

  const allReady = session.participants.every(p => p.ready);
  const hasParticipants = session.participants.length > 0;
  
  if (allReady && hasParticipants && !session.canStart) {
    session.canStart = true;
    io.to(sessionId).emit('sessionUpdate', {
      participants: session.participants,
      readyCount: session.readyParticipants.size,
      canStart: true,
      status: session.status,
      currentRevealIndex: session.currentRevealIndex
    });
  } else if (!allReady && session.canStart) {
    session.canStart = false;
    io.to(sessionId).emit('sessionUpdate', {
      participants: session.participants,
      readyCount: session.readyParticipants.size,
      canStart: false,
      status: session.status,
      currentRevealIndex: session.currentRevealIndex
    });
  }
};

// Debug helper
const logSessions = () => {
  console.log('\nCurrent sessions:');
  sessions.forEach((session, id) => {
    console.log(`- Session ${id}:`, {
      participants: session.participants.map(p => ({
        username: p.username,
        ready: p.ready,
        images: p.images.length,
        connected: true
      })),
      status: session.status,
      readyCount: session.readyParticipants.size,
      canStart: session.canStart,
      currentRevealIndex: session.currentRevealIndex
    });
  });
  console.log();
};

// Routes
app.post('/api/sessions', (req, res) => {
  const sessionId = Math.random().toString(36).substring(2, 9);
  sessions.set(sessionId, {
    id: sessionId,
    participants: [],
    status: 'waiting',
    created: new Date(),
    readyParticipants: new Set(),
    canStart: false,
    currentRevealIndex: -1
  });
  
  console.log(`Created new session: ${sessionId}`);
  logSessions();
  
  res.json({ sessionId });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  console.log(`Session lookup for: ${sessionId}`);
  
  if (!session) {
    console.log(`Session not found: ${sessionId}`);
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    id: session.id,
    status: session.status,
    participantsCount: session.participants.length,
    canStart: session.canStart,
    currentRevealIndex: session.currentRevealIndex
  });
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  console.log(`File uploaded: ${fileUrl}`);
  
  res.json({ 
    filename: req.file.filename,
    url: fileUrl
  });
});

app.post('/api/sessions/:sessionId/start', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session || !session.canStart) {
    return res.status(400).json({ error: 'Cannot start session' });
  }

  session.status = 'viewing';
  session.currentRevealIndex = -1; // Will be incremented to 0 on first reveal
  
  console.log(`Starting session: ${sessionId}`);
  logSessions();

  io.to(sessionId).emit('sessionStarted', {
    currentRevealIndex: session.currentRevealIndex,
    participants: session.participants,
    status: session.status
  });
  
  res.json({ success: true });
});

app.post('/api/sessions/:sessionId/reveal', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session || session.status !== 'viewing') {
    return res.status(400).json({ error: 'Invalid session state' });
  }

  session.currentRevealIndex++;
  
  console.log(`Revealing next for session ${sessionId}, index: ${session.currentRevealIndex}`);
  logSessions();

  io.to(sessionId).emit('revealNext', {
    currentRevealIndex: session.currentRevealIndex,
    participants: session.participants
  });
  
  res.json({ success: true });
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('joinSession', ({ sessionId, username }) => {
    console.log(`Join request - Session: ${sessionId}, User: ${username}`);
    
    const session = sessions.get(sessionId);
    if (!session) {
      console.log(`Session not found for join request: ${sessionId}`);
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    // Look for existing participant
    let participant = session.participants.find(p => p.username === username);
    
    if (participant) {
      // Update socket ID for existing user
      const oldSocketId = participant.id;
      participant.id = socket.id;
      
      // Update ready participants set if needed
      if (participant.ready) {
        session.readyParticipants.delete(oldSocketId);
        session.readyParticipants.add(socket.id);
      }
      
      console.log(`User ${username} reconnected with new socket ID: ${socket.id}`);
    } else {
      // Create new participant
      participant = {
        id: socket.id,
        username,
        joinedAt: new Date(),
        ready: false,
        images: []
      };
      session.participants.push(participant);
      console.log(`New user ${username} joined session ${sessionId}`);
    }

    socket.join(sessionId);
    
    checkSessionState(sessionId);
    logSessions();

    io.to(sessionId).emit('sessionUpdate', {
      participants: session.participants,
      readyCount: session.readyParticipants.size,
      canStart: session.canStart,
      status: session.status,
      currentRevealIndex: session.currentRevealIndex
    });

    // Send the participant's images to the client
    socket.emit('participantImages', {
      images: participant.images
    });
  });

  socket.on('leaveSession', ({ sessionId }) => {
    console.log(`Leave session request - Session: ${sessionId}`);
    
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.id === socket.id);
    if (participant) {
      // Очищаем статус готовности
      session.readyParticipants.delete(socket.id);
      participant.ready = false;
      
      // Пересчитываем возможность старта
      session.canStart = session.participants.every(p => p.ready);
      
      // Покидаем комнату сокета
      socket.leave(sessionId);
      
      console.log(`User ${participant.username} logged out from session ${sessionId}`);
      
      io.to(sessionId).emit('sessionUpdate', {
        participants: session.participants,
        readyCount: session.readyParticipants.size,
        canStart: session.canStart,
        status: session.status,
        currentRevealIndex: session.currentRevealIndex
      });
      
      logSessions();
    }
  });

  socket.on('setReady', ({ sessionId, ready }) => {
    console.log(`Ready status update - Session: ${sessionId}, Ready: ${ready}`);
    
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.id === socket.id);
    if (participant) {
      participant.ready = ready;
      if (ready) {
        session.readyParticipants.add(socket.id);
      } else {
        session.readyParticipants.delete(socket.id);
        session.canStart = false;
      }

      console.log(`User ${participant.username} is ${ready ? 'ready' : 'not ready'}`);
      checkSessionState(sessionId);
      logSessions();

      io.to(sessionId).emit('sessionUpdate', {
        participants: session.participants,
        readyCount: session.readyParticipants.size,
        canStart: session.canStart,
        status: session.status,
        currentRevealIndex: session.currentRevealIndex
      });
    }
  });

  socket.on('uploadImages', ({ sessionId, images }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.id === socket.id);
    if (participant) {
      participant.images = images;
      console.log(`Updated images for ${participant.username}:`, images);
      
      io.to(sessionId).emit('sessionUpdate', {
        participants: session.participants,
        readyCount: session.readyParticipants.size,
        canStart: session.canStart,
        status: session.status,
        currentRevealIndex: session.currentRevealIndex
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    sessions.forEach((session, sessionId) => {
      const participant = session.participants.find(p => p.id === socket.id);
      if (participant) {
        // Don't remove participant, just update their ready status
        session.readyParticipants.delete(socket.id);
        participant.ready = false;
        
        // Recalculate canStart
        session.canStart = session.participants.every(p => p.ready);
        
        console.log(`User ${participant.username} disconnected from session ${sessionId}`);
        
        io.to(sessionId).emit('sessionUpdate', {
          participants: session.participants,
          readyCount: session.readyParticipants.size,
          canStart: session.canStart,
          status: session.status,
          currentRevealIndex: session.currentRevealIndex
        });
      }
    });
    
    logSessions();
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready for connections`);
});