import { IOutputBuilder, SummaryData, VerbosityLevel } from './types.js';

/**
 * Factory function to create appropriate OutputBuilder based on verbosity level
 */
export function createOutputBuilder(verbosity: VerbosityLevel = 'summary'): IOutputBuilder {
  switch (verbosity) {
    case 'quiet':
      return new QuietOutputBuilder();
    case 'summary':
      return new SummaryOutputBuilder();
    case 'verbose':
      return new VerboseOutputBuilder();
    case 'stream':
      return new StreamingOutputBuilder();
    default:
      // Fallback to summary for unknown levels
      console.warn(`Unknown verbosity level: ${verbosity}. Using 'summary' mode.`);
      return new SummaryOutputBuilder();
  }
}

/**
 * QuietOutputBuilder - minimal output for CI/CD and scripting
 * Only shows essential summary on a single line
 */
export class QuietOutputBuilder implements IOutputBuilder {
  private summaryData?: SummaryData;

  addSection(_title: string, _content: string): void {
    // Quiet mode ignores sections
  }

  addSummary(data: SummaryData): void {
    this.summaryData = data;
  }

  addProgress(_message: string): void {
    // Quiet mode ignores progress
  }

  addError(_error: Error, _context?: Record<string, any>): void {
    // Quiet mode ignores detailed errors (they throw anyway)
  }

  build(): string {
    if (!this.summaryData) {
      return '';
    }

    const { commandName, executionTime, success } = this.summaryData;
    const icon = success ? '✓' : '✗';
    return `${icon} ${commandName} completed in ${executionTime}ms`;
  }
}

/**
 * SummaryOutputBuilder - default output mode (current behavior)
 * Shows formatted summary with command name, time, file, and reference
 */
export class SummaryOutputBuilder implements IOutputBuilder {
  private summaryData?: SummaryData;

  addSection(_title: string, _content: string): void {
    // Summary mode ignores detailed sections
  }

  addSummary(data: SummaryData): void {
    this.summaryData = data;
  }

  addProgress(_message: string): void {
    // Summary mode ignores progress messages
  }

  addError(_error: Error, _context?: Record<string, any>): void {
    // Summary mode ignores detailed errors
  }

  build(): string {
    if (!this.summaryData) {
      return '';
    }

    const { commandName, executionTime, outputFile, referenceToken, success } = this.summaryData;
    const lines: string[] = [];

    // Status line
    const icon = success ? '✓' : '✗';
    lines.push(`${icon} ${commandName} completed in ${executionTime}ms`);

    // Output file (if any)
    if (outputFile) {
      lines.push(`📁 Saved to: ${outputFile}`);
    }

    // Reference token (if any)
    if (referenceToken) {
      lines.push(`🔗 Reference: @${referenceToken}`);
    }

    return lines.join('\n');
  }
}

/**
 * VerboseOutputBuilder - detailed output for debugging
 * Shows all sections, metadata, and detailed information
 */
export class VerboseOutputBuilder implements IOutputBuilder {
  private sections: Array<{ title: string; content: string }> = [];
  private summaryData?: SummaryData;

  addSection(title: string, content: string): void {
    this.sections.push({ title, content });
  }

  addSummary(data: SummaryData): void {
    this.summaryData = data;
  }

  addProgress(_message: string): void {
    // Verbose mode doesn't show live progress (use stream for that)
    // Progress is shown after completion as part of sections
  }

  addError(error: Error, context?: Record<string, any>): void {
    let errorContent = `Error: ${error.message}`;
    if (error.stack) {
      errorContent += `\n\nStack Trace:\n${error.stack}`;
    }
    if (context) {
      errorContent += `\n\nContext:\n${JSON.stringify(context, null, 2)}`;
    }
    this.addSection('❌ Error Details', errorContent);
  }

  build(): string {
    const lines: string[] = [];

    // Add all sections first
    for (const { title, content } of this.sections) {
      lines.push(`\n${title}`);
      lines.push('─'.repeat(Math.min(title.length, 80)));
      lines.push(content);
    }

    // Add summary at the end
    if (this.summaryData) {
      const { commandName, executionTime, outputFile, referenceToken, success, metadata } = this.summaryData;
      
      lines.push('\n📊 Execution Summary');
      lines.push('─'.repeat(80));
      
      const icon = success ? '✓' : '✗';
      lines.push(`${icon} Command: ${commandName}`);
      lines.push(`⏱️  Duration: ${executionTime}ms`);
      
      if (outputFile) {
        lines.push(`📁 Output File: ${outputFile}`);
      }
      
      if (referenceToken) {
        lines.push(`🔗 Reference Token: @${referenceToken}`);
      }
      
      if (metadata && Object.keys(metadata).length > 0) {
        lines.push('\n📋 Metadata:');
        lines.push(JSON.stringify(metadata, null, 2));
      }
    }

    return lines.join('\n');
  }
}

/**
 * StreamingOutputBuilder - real-time output for long operations
 * Outputs sections immediately as they're added (no buffering)
 */
export class StreamingOutputBuilder implements IOutputBuilder {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  addSection(title: string, content: string): void {
    const elapsed = Date.now() - this.startTime;
    console.log(`\n[${elapsed}ms] ${title}`);
    console.log('─'.repeat(Math.min(title.length + 10, 80)));
    console.log(content);
  }

  addSummary(data: SummaryData): void {
    const { commandName, executionTime, outputFile, referenceToken, success } = data;
    const elapsed = Date.now() - this.startTime;
    
    console.log(`\n[${elapsed}ms] 📊 Summary`);
    console.log('─'.repeat(80));
    
    const icon = success ? '✓' : '✗';
    console.log(`${icon} ${commandName} completed in ${executionTime}ms`);
    
    if (outputFile) {
      console.log(`📁 Saved to: ${outputFile}`);
    }
    
    if (referenceToken) {
      console.log(`🔗 Reference: @${referenceToken}`);
    }
  }

  addProgress(message: string): void {
    const elapsed = Date.now() - this.startTime;
    console.log(`[${elapsed}ms] ⏳ ${message}`);
  }

  addError(error: Error, context?: Record<string, any>): void {
    const elapsed = Date.now() - this.startTime;
    console.log(`\n[${elapsed}ms] ❌ Error`);
    console.log('─'.repeat(80));
    console.log(`Error: ${error.message}`);
    
    if (error.stack) {
      console.log(`\nStack Trace:\n${error.stack}`);
    }
    
    if (context) {
      console.log(`\nContext:\n${JSON.stringify(context, null, 2)}`);
    }
  }

  build(): string {
    // Streaming builder outputs everything immediately
    // build() returns empty string since all output was already written
    return '';
  }
}
