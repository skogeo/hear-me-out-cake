import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import ImageUploader from './ImageUploader';
import CakeViewer from './CakeViewer';
import { Loader2 } from 'lucide-react';

function SessionManager() {
  const [mode, setMode] = useState('initial'); // initial, create, join, active
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

  // Восстанавливаем сессию из localStorage при загрузке
  useEffect(() => {
    const savedSession = localStorage.getItem('sessionData');
    if (savedSession) {
      const { sessionId, username } = JSON.parse(savedSession);
      setSessionId(sessionId);
      setUsername(username);
      if (sessionId && username) {
        setMode('active');
      }
    }
  }, []);

  // Socket setup
  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setSocket(newSocket);

      // Переподключаемся к сессии, если есть сохранённые данные
      const savedSession = localStorage.getItem('sessionData');
      if (savedSession) {
        const { sessionId, username } = JSON.parse(savedSession);
        if (sessionId && username) {
          console.log('Reconnecting to session:', { sessionId, username });
          newSocket.emit('joinSession', { sessionId, username });
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('sessionUpdate', ({ 
      participants, 
      readyCount, 
      canStart, 
      status,
      currentRevealIndex 
    }) => {
      console.log('Session update received:', { 
        participants, 
        readyCount, 
        canStart, 
        status,
        currentRevealIndex 
      });
      
      setParticipants(participants);
      setReadyCount(readyCount);
      setCanStart(canStart);
      setSessionStatus(status);
      setCurrentRevealIndex(currentRevealIndex);

      // Обновляем состояние текущего пользователя
      const currentParticipant = participants.find(p => p.username === username);
      if (currentParticipant) {
        setIsReady(currentParticipant.ready);
        if (images.length === 0 && currentParticipant.images.length > 0) {
          console.log('Restoring user images:', currentParticipant.images);
          setImages(currentParticipant.images);
        }
      }

      if (status === 'viewing') {
        setIsViewingMode(true);
      }
    });

    newSocket.on('sessionStarted', ({ currentRevealIndex, participants, status }) => {
      console.log('Session started:', { currentRevealIndex, participants, status });
      setSessionStatus(status);
      setCurrentRevealIndex(currentRevealIndex);
      setParticipants(participants);
      setIsViewingMode(true);
    });

    newSocket.on('revealNext', ({ currentRevealIndex, participants }) => {
      console.log('Reveal next:', { currentRevealIndex, participants });
      setCurrentRevealIndex(currentRevealIndex);
      setParticipants(participants);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
      setError(message);
      setIsLoading(false);
    });

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
    };
  }, [username, images.length]); // Зависимости обновлены

  const createSession = async () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.post('http://localhost:3001/api/sessions');
      const { sessionId } = response.data;
      
      console.log('Session created:', sessionId);
      setSessionId(sessionId);

      // Сохраняем данные сессии
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
      console.log('Attempting to join session:', inputSessionId);
      
      const response = await axios.get(`http://localhost:3001/api/sessions/${inputSessionId}`);
      
      if (response.data) {
        console.log('Session found, joining...');
        
        if (!socket) {
          throw new Error('Socket connection not established');
        }

        // Сохраняем данные сессии
        localStorage.setItem('sessionData', JSON.stringify({ 
          sessionId: inputSessionId, 
          username 
        }));

        socket.emit('joinSession', {
          sessionId: inputSessionId,
          username: username.trim()
        });
        
        setMode('active');
      }
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
      await axios.post(`http://localhost:3001/api/sessions/${sessionId}/start`);
    } catch (err) {
      console.error('Start session error:', err);
      setError('Failed to start session');
    }
  };

  const handleRevealNext = async () => {
    try {
      setError('');
      await axios.post(`http://localhost:3001/api/sessions/${sessionId}/reveal`);
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

  const resetState = () => {
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

  // Render conditions
  if (mode === 'initial') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center mb-6">Choose an option</h2>
        <button
          onClick={() => setMode('create')}
          className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
        >
          Create New Session
        </button>
        <button
          onClick={() => setMode('join')}
          className="w-full bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600"
        >
          Join Existing Session
        </button>
      </div>
    );
  }

  if (mode === 'create' || mode === 'join') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center mb-6">
          {mode === 'create' ? 'Create Session' : 'Join Session'}
        </h2>
        
        <input
          type="text"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {mode === 'join' && (
          <input
            type="text"
            placeholder="Session ID"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {error && (
          <div className="p-2 text-sm text-red-600 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setMode('initial')}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Back
          </button>
          <button
            onClick={mode === 'create' ? createSession : joinSession}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Loading...' : mode === 'create' ? 'Create' : 'Join'}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'active' && isViewingMode) {
    return (
      <CakeViewer
        participants={participants}
        sessionId={sessionId}
        currentRevealIndex={currentRevealIndex}
        onRevealNext={handleRevealNext}
        onFinish={resetState}
      />
    );
  }

  if (mode === 'active') {
    return (
      <div className="space-y-6">
        {/* User info panel */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Your Profile:</h3>
              <p className="text-blue-700">{username}</p>
            </div>
            <div className="text-sm text-blue-600">
              {isReady ? 'Ready to share' : 'Not ready yet'}
            </div>
          </div>
        </div>

        {/* Session ID panel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-1">Session ID:</h3>
          <div className="flex items-center gap-2">
            <code className="bg-white px-2 py-1 rounded border flex-1">
              {sessionId}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(sessionId)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Upload section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Your Crushes</h3>
            <span className="text-sm text-gray-500">
              {images.length} of 3 images uploaded
            </span>
          </div>
          <ImageUploader 
            onImageUpload={handleImageUpload}
            maxImages={3}
            existingImages={images}
          />
        </div>

        {/* Participants list */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">
            Participants ({participants.length})
          </h3>
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  participant.username === username 
                    ? 'border-2 border-blue-300 bg-blue-50' 
                    : participant.ready 
                      ? 'bg-green-50' 
                      : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{participant.username}</span>
                  {participant.username === username && (
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                      You
                    </span>
                  )}
                  {participant.images.length > 0 && (
                    <span className="text-xs text-gray-500">
                      ({participant.images.length} images)
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    participant.ready ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      {participant.ready ? '✓ Ready' : 'Not Ready'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
    
            {/* Ready status and controls */}
            <div className="border-t pt-4">
              <div className="text-center text-sm text-gray-600 mb-3">
                {readyCount} of {participants.length} participants ready
              </div>
              <button
                onClick={toggleReady}
                disabled={images.length === 0}
                className={`w-full py-2 rounded-lg transition-colors ${
                  isReady 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
                } text-white disabled:bg-gray-300`}
              >
                {isReady ? 'Cancel Ready' : 'Mark as Ready'}
              </button>
              {images.length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Upload at least one image to mark as ready
                </p>
              )}
            </div>
    
            {/* Start button */}
            {canStart && (
              <div className="border-t pt-4">
                <button
                  onClick={handleStart}
                  className="w-full py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
                >
                  Start Viewing Session
                </button>
              </div>
            )}
    
            {/* Error display */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
          </div>
        );
      }
    
      return null;
    }
    
    export default SessionManager;