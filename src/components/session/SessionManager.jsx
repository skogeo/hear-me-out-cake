import { useState } from 'react';
import { useSessionSocket } from './useSessionSocket';
import { sessionApi } from './sessionApi';
import { InitialView } from './InitialView';
import { JoinForm } from './JoinForm';
import { ActiveSession } from './ActiveSession';
import CakeViewer from '../CakeViewer';

function SessionManager() {
  // State
  const [mode, setMode] = useState('initial');
  const [sessionId, setSessionId] = useState('');
  const [username, setUsername] = useState('');
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('waiting');
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);
  const [isViewingMode, setIsViewingMode] = useState(false);

  // Setup socket connection
  useSessionSocket({
    socket,
    setSocket,
    sessionId,
    username,
    setParticipants,
    setReadyCount,
    setCanStart,
    setSessionStatus,
    setCurrentRevealIndex,
    setIsReady,
    setImages,
    setError,
    setIsLoading,
    setIsViewingMode
  });

  // Action handlers
  const createSession = async () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const { sessionId } = await sessionApi.create();
      setSessionId(sessionId);

      // Save session data
      localStorage.setItem('sessionData', JSON.stringify({ sessionId, username }));

      if (socket) {
        socket.emit('joinSession', { 
          sessionId, 
          username: username.trim() 
        });
      }
      
      setMode('active');
    } catch (err) {
      console.error('Create session error:', err);
      setError('Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  const joinSession = async () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!sessionId.trim()) {
      setError('Please enter session ID');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const inputSessionId = sessionId.trim();
      await sessionApi.join(inputSessionId);
      
      if (!socket) {
        throw new Error('Socket connection not established');
      }

      // Save session data
      localStorage.setItem('sessionData', JSON.stringify({ 
        sessionId: inputSessionId, 
        username 
      }));

      socket.emit('joinSession', {
        sessionId: inputSessionId,
        username: username.trim()
      });
      
      setMode('active');
    } catch (err) {
      console.error('Join session error:', err);
      if (err.response?.status === 404) {
        setError('Session not found. Please check the ID and try again.');
      } else if (!socket) {
        setError('Connection error. Please try again.');
      } else {
        setError(err.message || 'Failed to join session');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (newImage) => {
    console.log('New image uploaded:', newImage);
    setImages(prev => {
      const newImages = [...prev, newImage];
      if (socket) {
        socket.emit('uploadImages', {
          sessionId,
          images: newImages
        });
      }
      return newImages;
    });
  };

  const handleStart = async () => {
    try {
      setError('');
      await sessionApi.start(sessionId);
    } catch (err) {
      console.error('Start session error:', err);
      setError('Failed to start session');
    }
  };

  const handleRevealNext = async () => {
    try {
      setError('');
      await sessionApi.reveal(sessionId);
    } catch (err) {
      console.error('Reveal next error:', err);
      setError('Failed to reveal next');
    }
  };

  const toggleReady = () => {
    if (images.length === 0) {
      setError('Please upload at least one image before marking as ready');
      return;
    }
    
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    if (socket) {
      socket.emit('setReady', { sessionId, ready: newReadyState });
    }
  };

  const handleLogout = () => {
    if (socket && sessionId) {
      socket.emit('leaveSession', { sessionId });
    }
    localStorage.removeItem('sessionData');
    setMode('initial');
    setSessionId('');
    setUsername('');
    setParticipants([]);
    setError('');
    setIsReady(false);
    setReadyCount(0);
    setImages([]);
    setIsLoading(false);
    setCanStart(false);
    setSessionStatus('waiting');
    setCurrentRevealIndex(-1);
    setIsViewingMode(false);
  };

  // Render based on current mode
  if (mode === 'initial') {
    return (
      <InitialView 
        onCreateClick={() => setMode('create')}
        onJoinClick={() => setMode('join')}
      />
    );
  }

  if (mode === 'create' || mode === 'join') {
    return (
      <JoinForm
        mode={mode}
        username={username}
        sessionId={sessionId}
        error={error}
        isLoading={isLoading}
        onUsernameChange={(e) => setUsername(e.target.value)}
        onSessionIdChange={(e) => setSessionId(e.target.value)}
        onBack={() => setMode('initial')}
        onSubmit={mode === 'create' ? createSession : joinSession}
      />
    );
  }

  if (mode === 'active' && isViewingMode) {
    return (
      <CakeViewer
        participants={participants}
        sessionId={sessionId}
        currentRevealIndex={currentRevealIndex}
        onRevealNext={handleRevealNext}
        onFinish={handleLogout}
      />
    );
  }

  if (mode === 'active') {
    return (
      <ActiveSession
        username={username}
        sessionId={sessionId}
        participants={participants}
        images={images}
        isReady={isReady}
        readyCount={readyCount}
        canStart={canStart}
        error={error}
        onImageUpload={handleImageUpload}
        onToggleReady={toggleReady}
        onStart={handleStart}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}

export default SessionManager;