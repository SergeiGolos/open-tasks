import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { ReferenceHandle, IFlow, IOutputSynk } from '../types.js';
import { MessageCard } from '../cards/MessageCard.js';
import { TaskHandler } from '../task-handler.js';
import { TaskLogger } from '../logging/index.js';

/**
 * Clean command - cleans up old log files with configurable retention
 */
export default class CleanCommand extends TaskHandler {
  name = 'clean';
  description = 'Clean up old log files with configurable retention';
  examples = [
    'ot clean',
    'ot clean --days 7',
    'ot clean --days 30 --verbose',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: IFlow,
    synk: IOutputSynk
  ): Promise<ReferenceHandle> {
    const logger = new TaskLogger(synk, this.name);
    
    // Parse --days argument
    const daysIndex = args.indexOf('--days');
    const retentionDays = daysIndex !== -1 && args[daysIndex + 1] 
      ? parseInt(args[daysIndex + 1], 10) 
      : 7; // Default to 7 days

    if (isNaN(retentionDays) || retentionDays < 0) {
      logger.error('Invalid --days value. Must be a non-negative number.');
      throw new Error('Invalid --days value. Must be a non-negative number.');
    }

    const logsDir = path.join(flow.cwd, '.open-tasks', 'logs');

    // Check if logs directory exists
    logger.progress('Checking logs directory...');
    const logsDirExists = await fse.pathExists(logsDir);
    if (!logsDirExists) {
      const message = 'No logs directory found. Nothing to clean.';
      
      logger.card(new MessageCard('ℹ️ Clean Complete', message, 'info'));
      logger.complete();

      return {
        id: 'clean-result',
        content: message,
        token: 'clean',
        timestamp: new Date(),
      };
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.progress('Scanning log directories...');
    
    // Get all directories in logs
    const entries = await fs.readdir(logsDir, { withFileTypes: true });
    const directories = entries.filter(entry => entry.isDirectory());

    let deletedCount = 0;
    let deletedSize = 0;
    const deletedDirs: string[] = [];

    for (const dir of directories) {
      const dirPath = path.join(logsDir, dir.name);
      
      try {
        // Get directory stats to check modified time
        const stats = await fs.stat(dirPath);
        
        if (stats.mtime < cutoffDate) {
          // Calculate directory size before deletion
          const size = await this.getDirectorySize(dirPath);
          
          // Delete directory
          await fse.remove(dirPath);
          
          deletedCount++;
          deletedSize += size;
          deletedDirs.push(dir.name);
          logger.fileCreated(dir.name); // Track deleted directory
          
          logger.info(`Deleted: ${dir.name} (${this.formatSize(size)})`);
        }
      } catch (error) {
        // Skip directories that can't be accessed
        logger.warning(`Could not process ${dir.name}: ${error}`);
      }
    }

    const message = [
      `Cleaned ${deletedCount} old log ${deletedCount === 1 ? 'directory' : 'directories'}`,
      `Retention: ${retentionDays} days`,
      `Space freed: ${this.formatSize(deletedSize)}`,
      `Cutoff date: ${cutoffDate.toISOString().split('T')[0]}`,
    ].join('\n');

    const details = [
      `Logs Directory: ${logsDir}`,
      `Retention Days: ${retentionDays}`,
      `Cutoff Date: ${cutoffDate.toISOString()}`,
      `Directories Scanned: ${directories.length}`,
      `Directories Deleted: ${deletedCount}`,
      `Space Freed: ${this.formatSize(deletedSize)}`,
      '',
      ...(deletedDirs.length > 0 
        ? ['Deleted Directories:', ...deletedDirs.slice(0, 10).map(d => `  - ${d}`)] 
        : []),
      ...(deletedDirs.length > 10 ? [`  ... and ${deletedDirs.length - 10} more`] : []),
    ].join('\n');

    logger.card(new MessageCard('🧹 Clean Complete', details, 'success'));
    logger.complete();

    return {
      id: 'clean-result',
      content: message,
      token: 'clean',
      timestamp: new Date(),
    };
  }

  /**
   * Get the total size of a directory recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let size = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          size += await this.getDirectorySize(entryPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(entryPath);
          size += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors for individual files/directories
    }

    return size;
  }

  /**
   * Format bytes to human-readable size
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
  }
}
