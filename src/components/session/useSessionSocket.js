import { useEffect, useRef } from 'react';
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
  setIsViewingMode,
  setSelectedImage
}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"]
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setSocket(newSocket);
      if (sessionId) {
        newSocket.emit('joinSession', { sessionId, username });
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

      // Update the current user's state
      const currentParticipant = participants.find(p => p.username === username);
      if (currentParticipant) {
        setIsReady(currentParticipant.ready);
      }

      if (status === 'viewing') {
        setIsViewingMode(true);
      }
    });

    // Handle participant images event
    newSocket.on('participantImages', ({ images }) => {
      console.log('Restoring user images:', images);
      setImages(images);
    });

    newSocket.on('sessionStarted', ({ currentRevealIndex, participants, status }) => {
      console.log('Session started:', { currentRevealIndex, participants, status });
      setSessionStatus(status);
      setCurrentRevealIndex(currentRevealIndex);
      setParticipants(participants);
      setIsViewingMode(true);
    });

    newSocket.on('revealNext', ({ currentRevealIndex, participants, selectedImage }) => {
      console.log('Reveal next:', { currentRevealIndex, participants, selectedImage });
      setCurrentRevealIndex(currentRevealIndex);
      setParticipants(participants);
      setSelectedImage(selectedImage);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
      setError(message);
      setIsLoading(false);
    });

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [username, sessionId, images, setImages, setParticipants, setReadyCount, setCanStart, 
      setSessionStatus, setCurrentRevealIndex, setIsReady, setError, setIsLoading, setIsViewingMode, setSelectedImage]);
};