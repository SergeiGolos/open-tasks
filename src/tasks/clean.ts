import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { ExecutionContext, ReferenceHandle, ITaskHandler, IFlow, IOutputSynk } from '../types.js';
import { MessageCard } from '../cards/MessageCard.js';

/**
 * Clean command - cleans up old log files with configurable retention
 */
export default class CleanCommand implements ITaskHandler {
  name = 'clean';
  description = 'Clean up old log files with configurable retention';
  examples = [
    'ot clean',
    'ot clean --days 7',
    'ot clean --days 30 --verbose',
  ];

  async execute(args: string[], context: ExecutionContext): Promise<ReferenceHandle> {
    const verbosity = context.verbosity || 'summary';
    
    // Parse --days argument
    const daysIndex = args.indexOf('--days');
    const retentionDays = daysIndex !== -1 && args[daysIndex + 1] 
      ? parseInt(args[daysIndex + 1], 10) 
      : 7; // Default to 7 days

    if (isNaN(retentionDays) || retentionDays < 0) {
      throw new Error('Invalid --days value. Must be a non-negative number.');
    }

    const logsDir = path.join(context.cwd, '.open-tasks', 'logs');

    // Check if logs directory exists
    context.outputSynk.write('Checking logs directory...');
    const logsDirExists = await fse.pathExists(logsDir);
    if (!logsDirExists) {
      const message = 'No logs directory found. Nothing to clean.';
      
      if (verbosity !== 'quiet') {
        console.log(new MessageCard('ℹ️ Clean Complete', message, 'info').build());
      }

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

    context.outputSynk.write('Scanning log directories...');
    
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
          
          if (verbosity === 'verbose') {
            context.outputSynk.write(`Deleted: ${dir.name} (${this.formatSize(size)})`);
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
        if (verbosity === 'verbose') {
          context.outputSynk.write(`Warning: Could not process ${dir.name}: ${error}`);
        }
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
      ...(deletedDirs.length > 0 && verbosity !== 'quiet' 
        ? ['Deleted Directories:', ...deletedDirs.slice(0, 10).map(d => `  - ${d}`)] 
        : []),
      ...(deletedDirs.length > 10 ? [`  ... and ${deletedDirs.length - 10} more`] : []),
    ].join('\n');

    if (verbosity !== 'quiet') {
      console.log(new MessageCard('🧹 Clean Complete', details, 'success').build());
    }

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
