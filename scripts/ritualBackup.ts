// Ritual Backup System for Symbiotic Syntheconomy
// Automatically backs up ritual data to local storage and cloud services

import fs from 'fs';
import path from 'path';
import { schedule } from 'node-cron';
import axios from 'axios';

// Configuration interfaces
interface BackupConfig {
  localPath: string;
  cloudUrl: string;
  backupFrequency: string; // cron format
  maxLocalBackups: number;
}

interface RitualData {
  id: string;
  name: string;
  timestamp: number;
  data: any;
}

// Backup Service Class
class RitualBackupService {
  private config: BackupConfig;
  private backupInProgress: boolean = false;

  constructor(config: BackupConfig) {
    this.config = config;
    this.initialize();
  }

  // Initialize backup system and schedule
  private initialize(): void {
    // Ensure local backup directory exists
    if (!fs.existsSync(this.config.localPath)) {
      fs.mkdirSync(this.config.localPath, { recursive: true });
    }

    // Schedule backups based on frequency
    schedule(this.config.backupFrequency, async () => {
      if (!this.backupInProgress) {
        console.log('Starting scheduled backup...');
        await this.performBackup();
      } else {
        console.log('Backup already in progress, skipping...');
      }
    });

    console.log('Ritual Backup Service initialized with schedule:', this.config.backupFrequency);
  }

  // Perform backup of ritual data
  public async performBackup(): Promise<boolean> {
    this.backupInProgress = true;
    try {
      const ritualData = this.collectRitualData();
      const timestamp = new Date().toISOString();
      const backupFileName = `ritual_backup_${timestamp}.json`;
      const backupPath = path.join(this.config.localPath, backupFileName);

      // Local backup
      await this.saveLocalBackup(ritualData, backupPath);
      console.log(`Local backup created: ${backupPath}`);

      // Cloud backup
      await this.saveCloudBackup(ritualData, timestamp);
      console.log('Cloud backup completed');

      // Clean up old backups
      this.cleanupOldBackups();

      return true;
    } catch (error) {
      console.error('Backup failed:', error);
      return false;
    } finally {
      this.backupInProgress = false;
    }
  }

  // Collect ritual data (mock implementation - replace with actual data source)
  private collectRitualData(): RitualData[] {
    return [
      {
        id: 'ritual_001',
        name: 'Sample Ritual',
        timestamp: Date.now(),
        data: { key: 'value' }
      }
    ];
  }

  // Save backup to local storage
  private async saveLocalBackup(data: RitualData[], filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Save backup to cloud service
  private async saveCloudBackup(data: RitualData[], timestamp: string): Promise<void> {
    try {
      await axios.post(this.config.cloudUrl, {
        timestamp,
        data
      });
    } catch (error) {
      console.error('Cloud backup failed:', error);
      throw error;
    }
  }

  // Cleanup old local backups
  private cleanupOldBackups(): void {
    fs.readdir(this.config.localPath, (err, files) => {
      if (err) {
        console.error('Error reading backup directory:', err);
        return;
      }

      const backupFiles = files.filter(f => f.startsWith('ritual_backup_'));
      if (backupFiles.length > this.config.maxLocalBackups) {
        const filesToDelete = backupFiles
          .sort()
          .slice(0, backupFiles.length - this.config.maxLocalBackups);

        filesToDelete.forEach(file => {
          const filePath = path.join(this.config.localPath, file);
          fs.unlink(filePath, err => {
            if (err) console.error(`Error deleting old backup ${file}:`, err);
            else console.log(`Deleted old backup: ${file}`);
          });
        });
      }
    });
  }

  // Restore from local backup
  public async restoreFromLocalBackup(fileName: string): Promise<RitualData[]> {
    const filePath = path.join(this.config.localPath, fileName);
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading backup file:', err);
          reject(err);
          return;
        }
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing backup data:', error);
          reject(error);
        }
      });
    });
  }

  // Verify backup integrity
  public async verifyBackup(fileName: string): Promise<boolean> {
    try {
      await this.restoreFromLocalBackup(fileName);
      console.log(`Backup verification successful for: ${fileName}`);
      return true;
    } catch (error) {
      console.error(`Backup verification failed for: ${fileName}`, error);
      return false;
    }
  }
}

// Usage Example
const backupService = new RitualBackupService({
  localPath: './backups',
  cloudUrl: 'https://example.com/api/backups',
  backupFrequency: '0 0 * * *', // Daily at midnight
  maxLocalBackups: 7
});

// Export for external use
export default RitualBackupService;
