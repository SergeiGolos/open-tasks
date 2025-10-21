import chalk from 'chalk';
import { ICardBuilder, IOutputSynk, VerbosityLevel } from "./types";

export class ConsoleOutputBuilder implements IOutputSynk {
  private cards: ICardBuilder[];
  private logs: string[] = [];
  private filesCreated: string[] = [];
  
  constructor(private verbosity: VerbosityLevel) {
    this.cards = [];
  }

  // === Legacy methods - kept for backward compatibility ===
  
  write(card: ICardBuilder | string, verbosity: VerbosityLevel): void {       
    if (typeof card === 'string') {
      if (this.shouldWrite(verbosity || 'verbose')) { 
        console.log(card);
      }
      return;      
    }

    if (this.shouldWrite(verbosity)) {
      this.cards.push(card);
      // Check if it's a card builder or a plain object
      if (typeof card.build === 'function') {
        console.log(card.build());
      } else {
        // Handle plain object cards from user commands
        console.log(JSON.stringify(card, null, 2));
      }
    }
  }

  private shouldWrite(verbosity: VerbosityLevel): boolean {
    // Verbosity hierarchy:
    // - quiet: Only show cards marked as 'quiet'
    // - summary: Show cards marked as 'summary' or 'quiet'
    // - verbose: Show all cards
    
    if (this.verbosity === 'verbose') {
      return true; // Show all cards
    }
    
    if (this.verbosity === 'summary') {
      return verbosity === 'summary' || verbosity === 'quiet';
    }
    
    if (this.verbosity === 'quiet') {
      return verbosity === 'quiet';
    }
    
    return false;
  }

  build(): string {      
    return this.cards.reduce((acc, card) => {
      return acc + card.build() + '\n';
    }, '');
  }
  
  // === QUIET level methods - always visible ===
  
  writeCommandStart(name: string): void {
    if (this.shouldShow('quiet')) {
      const output = chalk.bold(`\n▶️  ${name}`);
      console.log(output);
      this.logs.push(`Command: ${name}`);
    }
  }
  
  writeCommandEnd(duration: number): void {
    if (this.shouldShow('quiet')) {
      const timeStr = duration < 1000 
        ? `${duration}ms` 
        : `${(duration / 1000).toFixed(2)}s`;
      console.log(chalk.gray(`⏱️  Completed in ${timeStr}`));
      
      if (this.filesCreated.length > 0) {
        console.log(chalk.gray(`📁 Files: ${this.filesCreated.join(', ')}`));
      }
      
      this.logs.push(`Duration: ${duration}ms`);
      this.logs.push(`Files: ${this.filesCreated.join(', ')}`);
    }
  }
  
  writeFileCreated(path: string): void {
    this.filesCreated.push(path);
    this.logs.push(`File: ${path}`);
  }
  
  // === SUMMARY level - cards ===
  
  writeCard(card: ICardBuilder): void {
    if (this.shouldShow('summary')) {
      this.cards.push(card);
      if (typeof card.build === 'function') {
        console.log(card.build());
      } else {
        console.log(JSON.stringify(card, null, 2));
      }
      this.logs.push(card.build());
    }
  }
  
  // === VERBOSE level - between-card messages ===
  
  writeProgress(message: string): void {
    if (this.shouldShow('verbose')) {
      console.log(chalk.blue('ℹ️  ') + message);
      this.logs.push(`[INFO] ${message}`);
    }
  }
  
  writeInfo(message: string): void {
    if (this.shouldShow('verbose')) {
      console.log(chalk.blue('ℹ️  ') + message);
      this.logs.push(`[INFO] ${message}`);
    }
  }
  
  writeWarning(message: string): void {
    if (this.shouldShow('verbose')) {
      console.log(chalk.yellow('⚠️  ') + message);
      this.logs.push(`[WARN] ${message}`);
    }
  }
  
  writeError(message: string): void {
    if (this.shouldShow('verbose')) {
      console.log(chalk.red('❌ ') + message);
      this.logs.push(`[ERROR] ${message}`);
    }
  }
  
  // === Helper methods ===
  
  private shouldShow(level: VerbosityLevel): boolean {
    const levels: Record<VerbosityLevel, number> = { 
      quiet: 0, 
      summary: 1, 
      verbose: 2 
    };
    return levels[this.verbosity] >= levels[level];
  }
  
  getLogs(): string[] {
    return this.logs;
  }
}
