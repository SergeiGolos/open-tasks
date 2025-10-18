import { DirectoryOutputContext } from './workflow/index.js';

/**
 * Verbosity levels for command output
 */
export type VerbosityLevel = 'quiet' | 'summary' | 'verbose' | 'stream';

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
   * Add a section to the output (for verbose/stream modes)
   */
  addSection(title: string, content: string): void;
  
  /**
   * Add summary information
   */
  addSummary(data: SummaryData): void;
  
  /**
   * Add a progress message (for stream mode)
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

  async writeOutput(
    content: string,
    fileName: string
  ): Promise<string> {
    const path = await import('path');
    const fse = (await import('fs-extra')).default;
    
    const filePath = path.join(this.outputDir, fileName);
    await fse.ensureDir(this.outputDir);
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

  abstract execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
