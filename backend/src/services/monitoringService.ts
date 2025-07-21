import winston from 'winston';
import { Counter, Histogram } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Custom logger setup with Winston
class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console()
      ],
    });
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: any) {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }
}

// Prometheus metrics setup
class MetricsService {
  // API performance metrics
  private apiRequestDuration: Histogram<string>;
  private apiRequestCounter: Counter<string>;
  private apiErrorCounter: Counter<string>;

  // AI filter metrics
  private aiFilterAccuracy: Counter<string>;
  private aiFilterErrors: Counter<string>;

  // Blockchain transaction metrics
  private blockchainTxCounter: Counter<string>;
  private blockchainTxErrors: Counter<string>;

  constructor() {
    // API metrics
    this.apiRequestDuration = new Histogram({
      name: 'api_request_duration_seconds',
      help: 'Duration of API requests in seconds',
      labelNames: ['method', 'endpoint', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    this.apiRequestCounter = new Counter({
      name: 'api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status']
    });

    this.apiErrorCounter = new Counter({
      name: 'api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'status']
    });

    // AI filter metrics
    this.aiFilterAccuracy = new Counter({
      name: 'ai_filter_accuracy_total',
      help: 'Total correct AI filter predictions',
      labelNames: ['model', 'type']
    });

    this.aiFilterErrors = new Counter({
      name: 'ai_filter_errors_total',
      help: 'Total incorrect AI filter predictions',
      labelNames: ['model', 'type']
    });

    // Blockchain metrics
    this.blockchainTxCounter = new Counter({
      name: 'blockchain_transactions_total',
      help: 'Total number of blockchain transactions',
      labelNames: ['type', 'status']
    });

    this.blockchainTxErrors = new Counter({
      name: 'blockchain_transaction_errors_total',
      help: 'Total number of failed blockchain transactions',
      labelNames: ['type', 'error']
    });
  }

  // API metrics methods
  recordApiRequest(method: string, endpoint: string, status: number, duration: number) {
    this.apiRequestCounter.inc({ method, endpoint, status });
    this.apiRequestDuration.observe({ method, endpoint, status }, duration);
  }

  recordApiError(method: string, endpoint: string, status: number) {
    this.apiErrorCounter.inc({ method, endpoint, status });
  }

  // AI filter metrics methods
  recordAiFilterSuccess(model: string, type: string) {
    this.aiFilterAccuracy.inc({ model, type });
  }

  recordAiFilterError(model: string, type: string) {
    this.aiFilterErrors.inc({ model, type });
  }

  // Blockchain metrics methods
  recordBlockchainTx(type: string, status: string) {
    this.blockchainTxCounter.inc({ type, status });
  }

  recordBlockchainTxError(type: string, error: string) {
    this.blockchainTxErrors.inc({ type, error });
  }
}

// Monitoring middleware for Express
class MonitoringMiddleware {
  private metrics: MetricsService;

  constructor(metrics: MetricsService) {
    this.metrics = metrics;
  }

  monitorApiPerformance() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = process.hrtime();
      const endpoint = req.path;
      const method = req.method;

      res.on('finish', () => {
        const duration = this.getDurationInSeconds(start);
        this.metrics.recordApiRequest(method, endpoint, res.statusCode, duration);
        if (res.statusCode >= 400) {
          this.metrics.recordApiError(method, endpoint, res.statusCode);
        }
      });

      next();
    };
  }

  private getDurationInSeconds(start: [number, number]): number {
    const end = process.hrtime(start);
    return end[0] + end[1] / 1e9;
  }
}

// Alerting Service (basic structure - expand with specific alerting logic)
class AlertingService {
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }

  sendAlert(message: string, severity: 'low' | 'medium' | 'high', meta?: any) {
    this.logger.error(`ALERT [${severity}]: ${message}`, meta);
    // TODO: Integrate with external alerting system (e.g., Slack, PagerDuty)
  }
}

// Initialize services
export const loggerService = new LoggerService();
export const metricsService = new MetricsService();
export const monitoringMiddleware = new MonitoringMiddleware(metricsService);
export const alertingService = new AlertingService(loggerService);
