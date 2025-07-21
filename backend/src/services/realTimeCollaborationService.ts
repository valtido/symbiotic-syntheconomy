import { Server } from 'socket.io';
import { createServer } from 'http';
import { RitualDocument } from '../models/RitualDocument';
import { User } from '../models/User';
import { diffMatchPatch } from 'diff-match-patch';
import logger from '../utils/logger';

// Real-time collaboration service for ritual co-creation
class RealTimeCollaborationService {
  private io: Server;
  private dmp: diffMatchPatch;
  private activeDocuments: Map<string, { content: string; users: Set<string> }>;

  constructor() {
    const httpServer = createServer();
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    this.dmp = new diffMatchPatch();
    this.activeDocuments = new Map();
    this.initializeSocketHandlers();
    httpServer.listen(3001, () => logger.info('Collaboration server running on port 3001'));
  }

  // Initialize socket event handlers for real-time collaboration
  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);

      // Handle user joining a ritual document
      socket.on('join-document', async (documentId: string, userId: string) => {
        try {
          await socket.join(documentId);
          this.handleUserJoin(documentId, userId);
          const document = await RitualDocument.findById(documentId);
          socket.emit('document-content', {
            content: document?.content || '',
            version: document?.version || 0,
          });
          this.broadcastUserList(documentId);
        } catch (error) {
          logger.error(`Error joining document: ${error}`);
          socket.emit('error', 'Failed to join document');
        }
      });

      // Handle real-time content updates with diff-match-patch
      socket.on('content-update', async (documentId: string, patch: string, version: number) => {
        try {
          const docState = this.activeDocuments.get(documentId);
          if (!docState) return;

          // Apply patch to current content
          const patches = this.dmp.patch_fromText(patch);
          const [newContent, results] = this.dmp.patch_apply(patches, docState.content);
          if (results.every((r) => r)) {
            docState.content = newContent;
            await RitualDocument.findByIdAndUpdate(documentId, {
              content: newContent,
              version: version + 1,
              lastModified: new Date(),
            });
            socket.to(documentId).emit('content-update', patch, version + 1);
          } else {
            socket.emit('conflict', 'Patch application failed, please refresh');
          }
        } catch (error) {
          logger.error(`Error updating content: ${error}`);
          socket.emit('error', 'Failed to update content');
        }
      });

      // Handle user chat messages
      socket.on('chat-message', (documentId: string, userId: string, message: string) => {
        this.io.to(documentId).emit('chat-message', { userId, message, timestamp: new Date() });
      });

      // Handle user disconnection
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket.id);
        logger.info(`User disconnected: ${socket.id}`);
      });
    });
  }

  // Handle user joining a document
  private handleUserJoin(documentId: string, userId: string): void {
    if (!this.activeDocuments.has(documentId)) {
      this.activeDocuments.set(documentId, { content: '', users: new Set() });
    }
    const docState = this.activeDocuments.get(documentId);
    if (docState) {
      docState.users.add(userId);
    }
  }

  // Handle user disconnection
  private handleUserDisconnect(socketId: string): void {
    for (const [docId, docState] of this.activeDocuments.entries()) {
      for (const userId of docState.users) {
        if (userId.includes(socketId)) {
          docState.users.delete(userId);
          this.broadcastUserList(docId);
          if (docState.users.size === 0) {
            this.activeDocuments.delete(docId);
          }
          break;
        }
      }
    }
  }

  // Broadcast updated user list to all connected clients in a document
  private broadcastUserList(documentId: string): void {
    const docState = this.activeDocuments.get(documentId);
    if (docState) {
      const userList = Array.from(docState.users);
      this.io.to(documentId).emit('user-list', userList);
    }
  }

  // Get current document state (for testing or initialization)
  public getDocumentState(documentId: string): { content: string; users: string[] } | null {
    const docState = this.activeDocuments.get(documentId);
    if (!docState) return null;
    return {
      content: docState.content,
      users: Array.from(docState.users),
    };
  }
}

export default new RealTimeCollaborationService();
