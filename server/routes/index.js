const express = require('express');
const router = express.Router();
const SessionManager = require('../services/SessionManager');
const uploadRoutes = require('./upload');

router.use(uploadRoutes);

router.post('/sessions', async (req, res) => {
  const sessionId = Math.random().toString(36).substring(2, 9);
  const session = await SessionManager.createSession(sessionId);
  res.json({ sessionId });
});

router.get('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const session = await SessionManager.getSession(sessionId);
  
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

router.post('/sessions/:sessionId/start', async (req, res) => {
  const { sessionId } = req.params;
  const io = req.io; // Получаем объект io из запроса
  try {
    await SessionManager.handleStartSession(io, sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(400).json({ error: 'Cannot start session' });
  }
});

router.post('/sessions/:sessionId/reveal', async (req, res) => {
  const { sessionId } = req.params;
  const io = req.io; // Получаем объект io из запроса
  try {
    const result = await SessionManager.handleRevealNext(io, sessionId);
    res.json(result);
  } catch (error) {
    console.error('Reveal next error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;