import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    walletAddress: string;
    username: string;
    isVerified: boolean;
  };
}

export interface JWTPayload {
  id: string;
  walletAddress: string;
  username: string;
  isVerified: boolean;
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  request: AuthenticatedRequest,
  reply: FastifyReply,
) => {
  const authHeader = request.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return reply.status(401).send({
      error: 'Access token required',
      message: 'Please provide a valid authentication token',
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    request.user = {
      id: decoded.id,
      walletAddress: decoded.walletAddress,
      username: decoded.username,
      isVerified: decoded.isVerified,
    };
  } catch (error) {
    return reply.status(403).send({
      error: 'Invalid token',
      message: 'The provided token is invalid or expired',
    });
  }
};

export const requireAuth = async (
  request: AuthenticatedRequest,
  reply: FastifyReply,
) => {
  await authenticateToken(request, reply);
};

export const requireVerifiedUser = async (
  request: AuthenticatedRequest,
  reply: FastifyReply,
) => {
  await authenticateToken(request, reply);

  if (!request.user?.isVerified) {
    return reply.status(403).send({
      error: 'Verification required',
      message: 'This action requires a verified account',
    });
  }
};

export const optionalAuth = async (
  request: AuthenticatedRequest,
  reply: FastifyReply,
) => {
  const authHeader = request.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return; // Skip authentication if secret not configured
      }

      const decoded = jwt.verify(token, secret) as JWTPayload;
      request.user = {
        id: decoded.id,
        walletAddress: decoded.walletAddress,
        username: decoded.username,
        isVerified: decoded.isVerified,
      };
    } catch (error) {
      // Silently fail for optional auth
      return;
    }
  }
};

export const requireWalletSignature = async (
  request: AuthenticatedRequest,
  reply: FastifyReply,
) => {
  const { signature, message, walletAddress } = request.body as any;

  if (!signature || !message || !walletAddress) {
    return reply.status(400).send({
      error: 'Missing signature data',
      message: 'Signature, message, and wallet address are required',
    });
  }

  try {
    // Verify wallet signature (simplified - in production, use proper verification)
    const expectedMessage = `Authenticate to GRC: ${Date.now()}`;

    if (message !== expectedMessage) {
      return reply.status(400).send({
        error: 'Invalid message',
        message: 'Message does not match expected format',
      });
    }

    // In a real implementation, you would verify the signature here
    // using ethers.js or similar library

    request.user = {
      id: walletAddress, // Use wallet address as ID for now
      walletAddress,
      username: `user_${walletAddress.slice(0, 8)}`,
      isVerified: false,
    };
  } catch (error) {
    return reply.status(400).send({
      error: 'Invalid signature',
      message: 'Could not verify wallet signature',
    });
  }
};

export const rateLimit = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
};

export const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Helper function to generate JWT token
export const generateToken = (
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper function to verify JWT token
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.verify(token, secret) as JWTPayload;
};
