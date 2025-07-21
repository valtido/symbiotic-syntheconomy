// Ritual Security Utilities for Symbiotic Syntheconomy
// This module provides encryption, access control, and audit trail functionalities for ritual data.

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Types for ritual data and access control
interface RitualData {
  id: string;
  name: string;
  description: string;
  sensitiveInfo: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AccessControl {
  userId: string;
  role: 'admin' | 'participant' | 'observer';
  permissions: string[];
}

interface AuditLog {
  action: string;
  userId: string;
  timestamp: Date;
  details: string;
}

// Security configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const AUDIT_LOG_PATH = path.join(__dirname, 'audit_logs.json');

class RitualSecurity {
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.loadAuditLogs();
  }

  // Encryption and Decryption
  public encryptData(data: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  public decryptData(encryptedData: string): string {
    try {
      const textParts = encryptedData.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Access Control
  public checkAccess(access: AccessControl, requiredPermission: string): boolean {
    if (access.role === 'admin') return true;
    return access.permissions.includes(requiredPermission);
  }

  // Audit Trail
  public logAction(action: string, userId: string, details: string): void {
    const log: AuditLog = {
      action,
      userId,
      timestamp: new Date(),
      details,
    };
    this.auditLogs.push(log);
    this.saveAuditLogs();
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  private loadAuditLogs(): void {
    try {
      if (fs.existsSync(AUDIT_LOG_PATH)) {
        const data = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
        this.auditLogs = JSON.parse(data);
      }
    } catch (error) {
      console.error(`Failed to load audit logs: ${error.message}`);
      this.auditLogs = [];
    }
  }

  private saveAuditLogs(): void {
    try {
      fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(this.auditLogs, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to save audit logs: ${error.message}`);
    }
  }

  // Authentication (simple token-based for demo)
  public generateAuthToken(userId: string): string {
    const payload = { userId, timestamp: Date.now() };
    return this.encryptData(JSON.stringify(payload));
  }

  public validateAuthToken(token: string): { userId: string } | null {
    try {
      const decrypted = this.decryptData(token);
      const payload = JSON.parse(decrypted);
      // Simple validation (e.g., check timestamp for expiration if needed)
      return { userId: payload.userId };
    } catch (error) {
      console.error(`Token validation failed: ${error.message}`);
      return null;
    }
  }
}

// Example usage
export const security = new RitualSecurity();

// Test function for demonstration
export function runSecurityTests() {
  console.log('Running Ritual Security Tests...');

  // Test Encryption/Decryption
  const testData = 'Sensitive Ritual Data';
  const encrypted = security.encryptData(testData);
  const decrypted = security.decryptData(encrypted);
  console.log('Encryption Test:', testData === decrypted ? 'Passed' : 'Failed');
  console.log('Encrypted:', encrypted);
  console.log('Decrypted:', decrypted);

  // Test Access Control
  const userAccess: AccessControl = {
    userId: 'user123',
    role: 'participant',
    permissions: ['read', 'participate'],
  };
  const hasAccess = security.checkAccess(userAccess, 'read');
  console.log('Access Control Test:', hasAccess ? 'Passed' : 'Failed');

  // Test Audit Log
  security.logAction('ritual_access', 'user123', 'User accessed ritual data');
  console.log('Audit Logs:', security.getAuditLogs());

  // Test Authentication
  const token = security.generateAuthToken('user123');
  const authResult = security.validateAuthToken(token);
  console.log('Auth Token Test:', authResult?.userId === 'user123' ? 'Passed' : 'Failed');
}

if (require.main === module) {
  runSecurityTests();
}
