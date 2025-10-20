import { DirectoryOutputContext } from './workflow/index.js';
import { createOutputBuilder as createOutputBuilderFactory } from './output-builders.js';
import { createCardBuilder as createCardBuilderFactory } from './card-builders.js';

/**
 * Verbosity levels for command output
 * Commands implement their own output behavior for these levels (e.g., progressive vs batch output)
 */
export type VerbosityLevel = 'quiet' | 'summary' | 'verbose';

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
 * Tree node for hierarchical card content
 */
export interface TreeNode {
  label: string;
  icon?: string;
  children?: TreeNode[];
}

/**
 * Table card content
 */
export interface TableCard {
  type: 'table';
  headers: string[];
  rows: string[][];
  footer?: string;
}

/**
 * List card content
 */
export interface ListCard {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

/**
 * Tree card content
 */
export interface TreeCard {
  type: 'tree';
  root: TreeNode;
}

/**
 * Content types that can be displayed in a card
 */
export type CardContent = 
  | string                    // Plain text card
  | Record<string, any>       // Key-value pairs (rendered as JSON)
  | TableCard                 // Structured table
  | ListCard                  // Bulleted or numbered list
  | TreeCard;                 // Hierarchical tree

/**
 * Visual style for a card
 */
export type CardStyle = 'info' | 'success' | 'warning' | 'error' | 'dim' | 'default';

/**
 * Interface for building command-specific formatted content
 * Created and managed by the framework based on ExecutionContext verbosity
 * Commands receive this and use it without worrying about output format
 */
export interface ICardBuilder {
  /**
   * Add a progress message (shown based on verbosity level)
   */
  addProgress(message: string): void;
  
  /**
   * Add a custom card to the output
   * Cards are formatted sections that display command-specific content
   * @param title - The title of the card
   * @param content - The content of the card
   * @param style - The visual style of the card (optional)
   */
  addCard(title: string, content: CardContent, style?: CardStyle): void;
  
  /**
   * Set execution summary to append to the last card
   * Called by framework before build()
   */
  setSummary(summary: SummaryData): void;
  
  /**
   * Build and return the formatted cards as a string
   * Called by framework, not by commands
   */
  build(): string;
}

/**
 * Interface for building framework-level formatted output
 * Handles system-level execution reporting: timing, status, files, errors
 */
export interface IOutputBuilder {
  /**
   * Add a section to the output (for verbose mode)
   * @deprecated Use ICardBuilder.addCard() instead for command content
   */
  addSection(title: string, content: string): void;
  
  /**
   * Add summary information (execution metadata)
   */
  addSummary(data: SummaryData): void;
  
  /**
   * Add a progress message (for verbose mode, optional progressive output)
   * @deprecated Use ICardBuilder.addProgress() instead for command progress
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
 * Loaded command representation
 * Returned by CommandLoader to be registered by the router
 */
export interface LoadedCommand {
  name: string;
  handler: CommandHandler;
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
   * Write output with routing based on output target
   */
  async writeOutputWithRouting(
    content: string,
    fileName: string,
    customPath?: string
  ): Promise<string | undefined> {
    let filePath: string | undefined;
    filePath = await this.writeOutput(content, fileName, customPath);
    console.log(content);
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
   * Framework creates both output builder (for summary) and card builder (for command content)
   */
  private async executeWithOutputControl(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const startTime = Date.now();
    const outputBuilder = this.createOutputBuilder(context);
    const cardBuilder = this.createCardBuilder(context);

    try {
      // Execute the actual command logic, passing card builder
      const result = await this.executeCommand(args, refs, context, cardBuilder);
      
      // Handle successful output (combine cards + summary)
      await this.handleOutput(result, context, startTime, outputBuilder, cardBuilder);
      
      return result;
    } catch (error) {
      // Handle error output
      await this.handleError(error as Error, context, startTime, outputBuilder, cardBuilder);
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
   * Create appropriate card builder based on verbosity level
   * Uses same verbosity resolution as output builder
   */
  protected createCardBuilder(context: ExecutionContext): ICardBuilder {
    const verbosity = context.verbosity || this.defaultVerbosity || 'summary';
    return createCardBuilderFactory(verbosity);
  }

  /**
   * Handle successful command output
   * Combines command cards with framework summary
   */
  protected async handleOutput(
    result: ReferenceHandle,
    context: ExecutionContext,
    startTime: number,
    outputBuilder: IOutputBuilder,
    cardBuilder: ICardBuilder
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
      metadata: {
        referenceId: result.id,
        timestamp: new Date().toISOString(),
      },
    };

    // Set summary on card builder (will be appended to last card)
    cardBuilder.setSummary(summaryData);

    // Add summary to output builder (for external summary output)
    outputBuilder.addSummary(summaryData);

    // Build final output: cards with embedded summary
    const cards = cardBuilder.build();
    
    // Only show the old-style summary if no cards were generated
    const summary = cards ? '' : outputBuilder.build();
    const finalOutput = cards || summary;
    
    // Route output to appropriate destination
    if (finalOutput) {      
      console.log(finalOutput);      
    }
  }

  /**
   * Handle error output
   */
  protected async handleError(
    error: Error,
    context: ExecutionContext,
    startTime: number,
    outputBuilder: IOutputBuilder,
    cardBuilder: ICardBuilder
  ): Promise<void> {
    const { calculateDuration } = await import('./utils.js');
    const executionTime = calculateDuration(startTime);

    // Add error to builder
    outputBuilder.addError(error, {
      command: this.name,
      executionTime,
    });

    // Build error output (cards + error details)
    const cards = cardBuilder.build();
    const errorOutput = outputBuilder.build();
    const finalOutput = cards ? `${cards}\n\n${errorOutput}` : errorOutput;
    
    if (finalOutput) {
      console.error(finalOutput);
    }

    // Write error file
    await context.outputHandler.writeError(error, {
      command: this.name,
      executionTime,
    });
  }

  /**
   * Subclasses implement this for command logic
   * Framework passes cardBuilder for command to create custom output cards
   * @param args - Command arguments
   * @param refs - Reference handles map
   * @param context - Execution context with configuration
   * @param cardBuilder - Card builder for creating command-specific output (managed by framework)
   */
  protected executeCommand(
    _args: string[],
    _refs: Map<string, ReferenceHandle>,
    _context: ExecutionContext,
    _cardBuilder: ICardBuilder
  ): Promise<ReferenceHandle> {
    // Default implementation - signals to use old pattern
    return Promise.resolve({} as ReferenceHandle);
  }
}
