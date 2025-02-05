const express = require('express');
const router = express.Router();
const SessionManager = require('../services/SessionManager');
const uploadRoutes = require('./upload');

router.use(uploadRoutes);

router.post('/sessions', (req, res) => {
  const sessionId = Math.random().toString(36).substring(2, 9);
  const session = SessionManager.createSession(sessionId);
  res.json({ sessionId });
});

router.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = SessionManager.getSession(sessionId);
  
  if (!session) {
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

router.post('/sessions/:sessionId/start', (req, res) => {
  const { sessionId } = req.params;
  const session = SessionManager.getSession(sessionId);
  
  if (!session || !session.canStart) {
    return res.status(400).json({ error: 'Cannot start session' });
  }

  session.status = 'viewing';
  session.currentRevealIndex = -1;
  
  // Emit session started event through socket
  res.json({ success: true });
});

module.exports = router;