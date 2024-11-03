import { useEffect } from 'react';
import io from 'socket.io-client';

export const useSessionSocket = ({
  socket,
  setSocket,
  sessionId,
  username,
  images,
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
}) => {
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
        if (images && images.length === 0 && currentParticipant.images.length > 0) {
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
  }, [username, sessionId, images, setImages, setParticipants, setReadyCount, setCanStart, 
      setSessionStatus, setCurrentRevealIndex, setIsReady, setError, setIsLoading, setIsViewingMode]);
};