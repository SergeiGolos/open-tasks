import { DirectoryOutputContext } from './workflow/index.js';
import { createOutputBuilder as createOutputBuilderFactory } from './output-builders.js';

/**
 * Verbosity levels for command output
 * Commands implement their own output behavior for these levels (e.g., progressive vs batch output)
 */
export type VerbosityLevel = 'quiet' | 'summary' | 'verbose';

/**
 * Output destination targets
 */
export type OutputTarget = 'screen-only' | 'log-only' | 'both' | 'file';

/**
 * Summary data for command execution
 */
export interface SummaryData {
  commandName: string;
  executionTime: number;
  outputFile?: string;
  referenceToken?: string;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Interface for building formatted command output
 */
export interface IOutputBuilder {
  /**
   * Add a section to the output (for verbose mode)
   */
  addSection(title: string, content: string): void;
  
  /**
   * Add summary information
   */
  addSummary(data: SummaryData): void;
  
  /**
   * Add a progress message (for verbose mode, optional progressive output)
   */
  addProgress(message: string): void;
  
  /**
   * Add an error message
   */
  addError(error: Error, context?: Record<string, any>): void;
  
  /**
   * Build and return the formatted output string
   */
  build(): string;
}

/**
 * Reference handle for command outputs
 */
export interface ReferenceHandle {
  id: string;
  token?: string;
  content: any;
  timestamp: Date;
  outputFile?: string;
}

/**
 * Execution context passed to all command handlers
 */
export interface ExecutionContext {
  /** Current working directory */
  cwd: string;
  /** Output directory for files */
  outputDir: string;
  /** Reference manager instance */
  referenceManager: ReferenceManager;
  /** Output handler instance */
  outputHandler: OutputHandler;
  /** Workflow context */
  workflowContext: DirectoryOutputContext;
  /** Configuration object */
  config: Record<string, any>;
  /** Verbosity level (default: 'summary') */
  verbosity?: VerbosityLevel;
  /** Output target (default: 'both') */
  outputTarget?: OutputTarget;
  /** Custom output file path (for 'file' target) */
  customOutputPath?: string;
}

/**
 * Reference manager for tracking command outputs
 */
export class ReferenceManager {
  private references: Map<string, ReferenceHandle>;
  private tokenIndex: Map<string, string>;

  constructor() {
    this.references = new Map();
    this.tokenIndex = new Map();
  }

  createReference(
    id: string,
    content: any,
    token?: string,
    outputFile?: string
  ): ReferenceHandle {
    const ref: ReferenceHandle = {
      id,
      token,
      content,
      timestamp: new Date(),
      outputFile,
    };

    this.references.set(id, ref);
    if (token) {
      if (this.tokenIndex.has(token)) {
        console.warn(
          `Warning: Token "${token}" already exists. Overwriting with new reference.`
        );
      }
      this.tokenIndex.set(token, id);
    }

    return ref;
  }

  getReference(idOrToken: string): ReferenceHandle | undefined {
    // Try direct ID lookup
    let ref = this.references.get(idOrToken);
    if (ref) return ref;

    // Try token lookup
    const id = this.tokenIndex.get(idOrToken);
    if (id) return this.references.get(id);

    return undefined;
  }

  listReferences(): ReferenceHandle[] {
    return Array.from(this.references.values());
  }
}

/**
 * Output handler for writing files and formatting terminal output
 */
export class OutputHandler {
  constructor(private outputDir: string) {}

  /**
   * Determine if output should be written to screen/terminal
   */
  shouldOutputToScreen(target: OutputTarget = 'both'): boolean {
    return target === 'screen-only' || target === 'both' || target === 'file';
  }

  /**
   * Determine if output should be written to file
   */
  shouldOutputToFile(target: OutputTarget = 'both'): boolean {
    return target === 'log-only' || target === 'both' || target === 'file';
  }

  /**
   * Write output with routing based on output target
   */
  async writeOutputWithRouting(
    content: string,
    fileName: string,
    outputTarget: OutputTarget = 'both',
    customPath?: string
  ): Promise<string | undefined> {
    let filePath: string | undefined;

    // Write to file if needed
    if (this.shouldOutputToFile(outputTarget)) {
      filePath = await this.writeOutput(content, fileName, customPath);
    }

    // Write to screen if needed
    if (this.shouldOutputToScreen(outputTarget)) {
      console.log(content);
    }

    return filePath;
  }

  async writeOutput(
    content: string,
    fileName: string,
    customPath?: string
  ): Promise<string> {
    const path = await import('path');
    const fse = (await import('fs-extra')).default;
    
    const targetDir = customPath ? path.dirname(customPath) : this.outputDir;
    const targetFileName = customPath ? path.basename(customPath) : fileName;
    const filePath = path.join(targetDir, targetFileName);
    
    await fse.ensureDir(targetDir);
    await fse.writeFile(filePath, content, 'utf-8');
    
    return filePath;
  }

  async writeError(
    error: Error,
    context: Record<string, any>
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const fileName = `${timestamp}-error.txt`;
    
    const content = [
      'ERROR REPORT',
      '============',
      '',
      `Time: ${new Date().toISOString()}`,
      `Error: ${error.message}`,
      '',
      'Stack Trace:',
      error.stack || 'No stack trace available',
      '',
      'Context:',
      JSON.stringify(context, null, 2),
    ].join('\n');

    return await this.writeOutput(content, fileName);
  }

  getOutputDir(): string {
    return this.outputDir;
  }
}

/**
 * Base class for command handlers
 */
export abstract class CommandHandler {
  abstract name: string;
  abstract description: string;
  abstract examples: string[];
  
  /**
   * Optional default verbosity level for this command
   * Can be overridden by CLI flags
   */
  protected defaultVerbosity?: VerbosityLevel;

  /**
   * Main execute method - can be overridden for backward compatibility
   * or use the new executeCommand pattern for enhanced output control
   */
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // Check if subclass implements executeCommand (new pattern)
    if (this.executeCommand !== CommandHandler.prototype.executeCommand) {
      return this.executeWithOutputControl(args, refs, context);
    }
    
    // Fallback to direct execution for backward compatibility
    // Subclasses can override this execute method directly
    throw new Error(`Command ${this.name} must implement execute() or executeCommand()`);
  }

  /**
   * Execute with timing and output control (new pattern)
   */
  private async executeWithOutputControl(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const startTime = Date.now();
    const builder = this.createOutputBuilder(context);

    try {
      // Execute the actual command logic
      const result = await this.executeCommand(args, refs, context);
      
      // Handle successful output
      await this.handleOutput(result, context, startTime, builder);
      
      return result;
    } catch (error) {
      // Handle error output
      await this.handleError(error as Error, context, startTime, builder);
      throw error;
    }
  }

  /**
   * Create appropriate output builder based on verbosity level
   * Resolution hierarchy: context.verbosity (CLI flag) → command defaultVerbosity → 'summary'
   */
  protected createOutputBuilder(context: ExecutionContext): IOutputBuilder {
    const verbosity = context.verbosity || this.defaultVerbosity || 'summary';
    return createOutputBuilderFactory(verbosity);
  }

  /**
   * Handle successful command output
   */
  protected async handleOutput(
    result: ReferenceHandle,
    context: ExecutionContext,
    startTime: number,
    builder: IOutputBuilder
  ): Promise<void> {
    const { calculateDuration } = await import('./utils.js');
    const executionTime = calculateDuration(startTime);

    // Build summary data
    const summaryData: SummaryData = {
      commandName: this.name,
      executionTime,
      outputFile: result.outputFile,
      referenceToken: result.token,
      success: true,
    };

    // Add summary to builder
    builder.addSummary(summaryData);

    // Build and route output
    const output = builder.build();
    if (output) {
      const outputTarget = context.outputTarget || 'both';
      
      if (context.outputHandler.shouldOutputToScreen(outputTarget)) {
        console.log(output);
      }
    }
  }

  /**
   * Handle error output
   */
  protected async handleError(
    error: Error,
    context: ExecutionContext,
    startTime: number,
    builder: IOutputBuilder
  ): Promise<void> {
    const { calculateDuration } = await import('./utils.js');
    const executionTime = calculateDuration(startTime);

    // Add error to builder
    builder.addError(error, {
      command: this.name,
      executionTime,
    });

    // Build and output error
    const output = builder.build();
    if (output) {
      console.error(output);
    }

    // Write error file
    await context.outputHandler.writeError(error, {
      command: this.name,
      executionTime,
    });
  }

  /**
   * Subclasses can implement this for the new output control pattern
   * Leave unimplemented to use the old execute() override pattern
   */
  protected executeCommand(
    _args: string[],
    _refs: Map<string, ReferenceHandle>,
    _context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // Default implementation - signals to use old pattern
    return Promise.resolve({} as ReferenceHandle);
  }
}
