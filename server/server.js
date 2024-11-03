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

// In-memory sessions storage
const sessions = new Map();

// Debug helper
const logSessions = () => {
  console.log('\nCurrent sessions:');
  sessions.forEach((session, id) => {
    console.log(`- Session ${id}:`, {
      participants: session.participants.map(p => p.username),
      readyCount: session.readyParticipants.size
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
    readyParticipants: new Set()
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
    participantsCount: session.participants.length,
    status: session.status
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

    // Remove user if they were in any other sessions
    sessions.forEach((s, sid) => {
      const idx = s.participants.findIndex(p => p.username === username);
      if (idx !== -1) {
        s.participants.splice(idx, 1);
        s.readyParticipants.delete(socket.id);
        io.to(sid).emit('sessionUpdate', {
          participants: s.participants,
          readyCount: s.readyParticipants.size
        });
      }
    });

    // Add to new session
    socket.join(sessionId);
    session.participants.push({
      id: socket.id,
      username,
      joinedAt: new Date(),
      ready: false,
      images: []
    });

    console.log(`User ${username} joined session ${sessionId}`);
    logSessions();

    io.to(sessionId).emit('sessionUpdate', {
      participants: session.participants,
      readyCount: session.readyParticipants.size
    });
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
      }

      console.log(`User ${participant.username} is ${ready ? 'ready' : 'not ready'}`);
      logSessions();

      io.to(sessionId).emit('sessionUpdate', {
        participants: session.participants,
        readyCount: session.readyParticipants.size
      });

      // Check if all participants are ready
      if (session.participants.length > 0 && 
          session.participants.every(p => p.ready)) {
        console.log('All participants are ready!');
        io.to(sessionId).emit('allReady');
      }
    }
  });

  socket.on('uploadImages', ({ sessionId, images }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.id === socket.id);
    if (participant) {
      participant.images = images;
      io.to(sessionId).emit('sessionUpdate', {
        participants: session.participants,
        readyCount: session.readyParticipants.size
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    sessions.forEach((session, sessionId) => {
      const index = session.participants.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        const participant = session.participants[index];
        console.log(`User ${participant.username} left session ${sessionId}`);
        
        session.participants.splice(index, 1);
        session.readyParticipants.delete(socket.id);
        
        io.to(sessionId).emit('sessionUpdate', {
          participants: session.participants,
          readyCount: session.readyParticipants.size
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