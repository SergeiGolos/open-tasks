import { IOutputSynk, ICardBuilder } from '../types.js';

/**
 * TaskLogger - Utility class for consistent task-level logging
 * 
 * Automatically tracks:
 * - Command start (QUIET level)
 * - Command end with execution time (QUIET level)
 * - Files created (QUIET level)
 * 
 * Provides methods for:
 * - Cards (SUMMARY level)
 * - Progress/info/warning/error messages (VERBOSE level)
 */
export class TaskLogger {
  private startTime: number;
  
  constructor(
    private outputSynk: IOutputSynk,
    private commandName: string
  ) {
    this.startTime = Date.now();
    // Automatically log command start (QUIET level)
    this.outputSynk.writeCommandStart(commandName);
  }
  
  // === QUIET level - file tracking ===
  
  /**
   * Track a file created by this command
   * Will be shown in all verbosity modes
   */
  fileCreated(path: string): void {
    this.outputSynk.writeFileCreated(path);
  }
  
  // === SUMMARY level - cards ===
  
  /**
   * Write a card (summary level)
   * Shown in summary and verbose modes
   */
  card(card: ICardBuilder): void {
    this.outputSynk.writeCard(card);
  }
  
  // === VERBOSE level - between-card messages ===
  
  /**
   * Write a progress message (verbose level)
   * Shown only in verbose mode
   */
  progress(message: string): void {
    this.outputSynk.writeProgress(message);
  }
  
  /**
   * Write an info message (verbose level)
   * Shown only in verbose mode
   */
  info(message: string): void {
    this.outputSynk.writeInfo(message);
  }
  
  /**
   * Write a warning message (verbose level)
   * Shown only in verbose mode
   */
  warning(message: string): void {
    this.outputSynk.writeWarning(message);
  }
  
  /**
   * Write an error message (verbose level)
   * Shown only in verbose mode
   */
  error(message: string): void {
    this.outputSynk.writeError(message);
  }
  
  // === Command completion ===
  
  /**
   * Mark command as complete and log execution time
   * Call this at the end of your command
   */
  complete(): void {
    const duration = Date.now() - this.startTime;
    this.outputSynk.writeCommandEnd(duration);
  }
}
