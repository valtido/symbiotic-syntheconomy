import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { validateRitualESEP, validateRitualCEDA } from '../utils/validationUtils';
import { logger } from '../config/logger';

// Streaming Validation Service for real-time ritual feedback
class StreamingValidationService {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, string> = new Map();

  constructor(port: number) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });
    server.listen(port, () => {
      logger.info(`Streaming Validation Service started on port ${port}`);
    });
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New client connected for streaming validation');
      const clientId = this.generateClientId();
      this.clients.set(ws, clientId);

      ws.on('message', (data: WebSocket.Data) => this.handleMessage(ws, data));
      ws.on('close', () => this.handleDisconnect(ws));
      ws.on('error', (error) => logger.error(`WebSocket error for client ${clientId}:`, error));

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        clientId: clientId,
      }));
    });
  }

  private handleMessage(ws: WebSocket, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      const { ritualText, context } = message;

      if (!ritualText) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Ritual text is required',
        }));
        return;
      }

      // Perform real-time validation for ESEP and CEDA compliance
      this.streamValidationResults(ws, ritualText, context);
    } catch (error) {
      logger.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }));
    }
  }

  private async streamValidationResults(ws: WebSocket, ritualText: string, context?: any): Promise<void> {
    // Stream ESEP validation results
    ws.send(JSON.stringify({
      type: 'validation_start',
      category: 'ESEP',
      status: 'processing',
    }));

    const esepResult = await validateRitualESEP(ritualText, context);
    ws.send(JSON.stringify({
      type: 'validation_result',
      category: 'ESEP',
      status: 'completed',
      result: esepResult,
    }));

    // Stream CEDA validation results
    ws.send(JSON.stringify({
      type: 'validation_start',
      category: 'CEDA',
      status: 'processing',
    }));

    const cedaResult = await validateRitualCEDA(ritualText, context);
    ws.send(JSON.stringify({
      type: 'validation_result',
      category: 'CEDA',
      status: 'completed',
      result: cedaResult,
    }));
  }

  private handleDisconnect(ws: WebSocket): void {
    const clientId = this.clients.get(ws);
    this.clients.delete(ws);
    logger.info(`Client disconnected: ${clientId}`);
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  public close(): void {
    this.wss.close(() => {
      logger.info('Streaming Validation Service closed');
    });
  }
}

// Export a singleton instance or factory function
export const createStreamingValidationService = (port: number = 8081): StreamingValidationService => {
  return new StreamingValidationService(port);
};
