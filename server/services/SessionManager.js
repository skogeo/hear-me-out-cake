// src/services/SessionManager.js
const { PrismaClient } = require('@prisma/client');

class SessionManager {
  static prisma = new PrismaClient();
  static sessions = new Map();

  static async createSession(sessionId) {
    const session = await this.prisma.session.create({
      data: {
        id: sessionId,
        status: 'waiting',
        created: new Date(),
        currentRevealIndex: -1,
        canStart: false
      }
    });

    session.participants = [];
    session.readyParticipants = new Set();
    this.sessions.set(sessionId, session);

    return session;
  }

  static async getSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          include: {
            images: true
          }
        }
      }
    });

    if (!session) return null;

    session.readyParticipants = new Set(
      session.participants
        .filter(p => p.ready)
        .map(p => p.socketId)
    );

    this.sessions.set(sessionId, session);
    return session;
  }

  static async handleJoinSession(io, socket, { sessionId, username }) {
    const session = await this.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    let participant = session.participants.find(p => p.username === username);
    
    if (participant) {
      const oldSocketId = participant.socketId;
      
      await this.prisma.participant.update({
        where: { id: participant.id },
        data: { socketId: socket.id }
      });

      participant.socketId = socket.id;
      
      if (participant.ready) {
        session.readyParticipants.delete(oldSocketId);
        session.readyParticipants.add(socket.id);
      }
    } else {
      const newParticipant = await this.prisma.participant.create({
        data: {
          id: Math.random().toString(36).substring(2, 15),
          socketId: socket.id,
          username,
          joinedAt: new Date(),
          ready: false,
          sessionId: session.id
        },
        include: {
          images: true
        }
      });

      session.participants.push(newParticipant);
      participant = newParticipant;
    }

    socket.join(sessionId);
    await this.checkSessionState(io, sessionId);
    
    socket.emit('participantImages', {
      images: participant.images.map(img => img.imageUrl)
    });
  }

  static async handleSetReady(io, socket, { sessionId, ready }) {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.socketId === socket.id);
    if (participant) {
      await this.prisma.participant.update({
        where: { id: participant.id },
        data: { ready }
      });

      participant.ready = ready;
      
      if (ready) {
        session.readyParticipants.add(socket.id);
      } else {
        session.readyParticipants.delete(socket.id);
        session.canStart = false;
      }

      await this.checkSessionState(io, sessionId);
    }
  }

  static async handleUploadImages(io, socket, { sessionId, images }) {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.socketId === socket.id);
    if (participant) {
      // Удаляем старые изображения
      await this.prisma.participantImage.deleteMany({
        where: { participantId: participant.id }
      });

      // Добавляем новые
      await this.prisma.participantImage.createMany({
        data: images.map(imageUrl => ({
          imageUrl,
          participantId: participant.id
        }))
      });

      // Обновляем кэш
      participant.images = await this.prisma.participantImage.findMany({
        where: { participantId: participant.id }
      });

      this.emitSessionUpdate(io, session);
    }
  }

  static async checkSessionState(io, sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const allReady = session.participants.every(p => p.ready);
    const hasParticipants = session.participants.length > 0;
    const shouldBeReady = allReady && hasParticipants;

    if (shouldBeReady !== session.canStart) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { canStart: shouldBeReady }
      });
      session.canStart = shouldBeReady;
    }

    this.emitSessionUpdate(io, session);
  }

  static emitSessionUpdate(io, session) {
    io.to(session.id).emit('sessionUpdate', {
      participants: session.participants,
      readyCount: session.readyParticipants.size,
      canStart: session.canStart,
      status: session.status,
      currentRevealIndex: session.currentRevealIndex
    });
  }

  static async cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) {
    const cutoffDate = new Date(Date.now() - maxAge);
    await this.prisma.session.deleteMany({
      where: {
        created: {
          lt: cutoffDate
        }
      }
    });
  }
}

module.exports = SessionManager;