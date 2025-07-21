// ritualSecurity.ts - Security utilities for encrypting ritual data, managing access, and audit trails

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Types for ritual data and access control
interface RitualData {
  id: string;
  name: string;
  description: string;
  sensitiveInfo: string;
  timestamp: Date;
}

interface AccessControl {
  userId: string;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
}

interface AuditLog {
  action: string;
  userId: string;
  timestamp: Date;
  details: string;
}

// Configuration for security settings
const SECURITY_CONFIG = {
  encryptionAlgorithm: 'aes-256-cbc',
  key: Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-bytes-long-secure!', 'utf8'), // 32 bytes for AES-256
  ivLength: 16, // Initialization vector length for AES
  auditLogPath: path.join(__dirname, 'audit_logs'),
};

// Ensure audit log directory exists
if (!fs.existsSync(SECURITY_CONFIG.auditLogPath)) {
  fs.mkdirSync(SECURITY_CONFIG.auditLogPath, { recursive: true });
}

class RitualSecurity {
  private auditLogs: AuditLog[] = [];

  constructor() {
    console.log('RitualSecurity initialized');
  }

  // Encryption for sensitive ritual data
  public encryptData(data: string): string {
    const iv = crypto.randomBytes(SECURITY_CONFIG.ivLength);
    const cipher = crypto.createCipheriv(
      SECURITY_CONFIG.encryptionAlgorithm,
      SECURITY_CONFIG.key,
      iv
    );
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decryption for sensitive ritual data
  public decryptData(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      SECURITY_CONFIG.encryptionAlgorithm,
      SECURITY_CONFIG.key,
      iv
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Authentication: Verify user credentials (mock implementation)
  public authenticateUser(userId: string, password: string): boolean {
    // Mock authentication logic (replace with real auth system)
    const isValid = userId.length > 0 && password.length >= 8;
    if (isValid) {
      this.logAudit('authenticate', userId, 'User authenticated successfully');
    } else {
      this.logAudit('authenticate_failed', userId, 'Authentication failed');
    }
    return isValid;
  }

  // Authorization: Check user access based on role and permissions
  public authorizeAccess(
    accessControl: AccessControl,
    requiredPermission: string
  ): boolean {
    const hasPermission = accessControl.permissions.includes(requiredPermission);
    const isAdmin = accessControl.role === 'admin';
    const authorized = isAdmin || hasPermission;
    this.logAudit(
      'authorize',
      accessControl.userId,
      `Access check for ${requiredPermission}: ${authorized ? 'Granted' : 'Denied'}`
    );
    return authorized;
  }

  // Audit Trail: Log actions for tracking
  private logAudit(action: string, userId: string, details: string): void {
    const log: AuditLog = {
      action,
      userId,
      timestamp: new Date(),
      details,
    };
    this.auditLogs.push(log);
    this.writeAuditLog(log);
  }

  // Write audit log to file
  private writeAuditLog(log: AuditLog): void {
    const logFilePath = path.join(
      SECURITY_CONFIG.auditLogPath,
      `audit_${new Date().toISOString().split('T')[0]}.log`
    );
    const logEntry = `[${log.timestamp.toISOString()}] ${log.action} by ${log.userId}: ${log.details}\n`;
    fs.appendFileSync(logFilePath, logEntry, { flag: 'a+' });
  }

  // Get audit logs for review
  public getAuditLogs(date: string): string {
    const logFilePath = path.join(SECURITY_CONFIG.auditLogPath, `audit_${date}.log`);
    try {
      return fs.readFileSync(logFilePath, 'utf8');
    } catch (error) {
      return `No logs found for ${date}`;
    }
  }

  // Securely store ritual data
  public secureRitualData(ritual: RitualData): RitualData {
    const securedRitual = { ...ritual };
    securedRitual.sensitiveInfo = this.encryptData(ritual.sensitiveInfo);
    this.logAudit('secure_data', 'system', `Ritual ${ritual.id} sensitive data encrypted`);
    return securedRitual;
  }

  // Retrieve and decrypt ritual data
  public retrieveRitualData(securedRitual: RitualData): RitualData {
    const decryptedRitual = { ...securedRitual };
    decryptedRitual.sensitiveInfo = this.decryptData(securedRitual.sensitiveInfo);
    this.logAudit('retrieve_data', 'system', `Ritual ${securedRitual.id} sensitive data decrypted`);
    return decryptedRitual;
  }
}

// Example usage
if (require.main === module) {
  const security = new RitualSecurity();

  // Test encryption and decryption
  const testData = 'Secret Ritual Information';
  const encrypted = security.encryptData(testData);
  console.log('Encrypted:', encrypted);
  const decrypted = security.decryptData(encrypted);
  console.log('Decrypted:', decrypted);

  // Test authentication
  const userId = 'testUser';
  const password = 'securePass123';
  console.log('Authentication:', security.authenticateUser(userId, password));

  // Test authorization
  const accessControl: AccessControl = {
    userId,
    role: 'user',
    permissions: ['read_ritual'],
  };
  console.log(
    'Authorization (read_ritual):',
    security.authorizeAccess(accessControl, 'read_ritual')
  );
  console.log(
    'Authorization (write_ritual):',
    security.authorizeAccess(accessControl, 'write_ritual')
  );

  // Test ritual data security
  const ritual: RitualData = {
    id: 'ritual_001',
    name: 'Test Ritual',
    description: 'A test ritual',
    sensitiveInfo: 'Secret Chant',
    timestamp: new Date(),
  };
  const secured = security.secureRitualData(ritual);
  console.log('Secured Ritual:', secured);
  const retrieved = security.retrieveRitualData(secured);
  console.log('Retrieved Ritual:', retrieved);

  // Test audit logs
  const today = new Date().toISOString().split('T')[0];
  console.log('Audit Logs for today:', security.getAuditLogs(today));
}

export default RitualSecurity;
