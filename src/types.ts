import { TaskHandler } from './task-handler.js';

/**
 * Verbosity levels for command output
 * Commands implement their own output behavior for these levels (e.g., progressive vs batch output)
 */
export type VerbosityLevel = 'quiet' | 'summary' | 'verbose';

/**
 * Loaded command representation
 * Returned by CommandLoader to be registered by the router
 */

export interface ITaskHandler {
  description: string;
  examples: string[];
  name: string;

  execute(
    args: string[],
    context: ExecutionContext
  ): Promise<ReferenceHandle>
}

export interface LoadedCommand {
  name: string;
  handler: ITaskHandler;
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
  /** Output handler instance */
  outputSynk: IOutputSynk;
  /** Workflow context */
  workflowContext: IFlow;
  /** Configuration object */
  config: Record<string, any>;
  /** Verbosity level (default: 'summary') */
  verbosity?: VerbosityLevel;  
}




/*************************/
/*************************/
/**  Output Interfaces  **/
/*************************/
/*************************/
/*************************/


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
  name: string;
  type: 'MessageCard' | 'TableCard' | 'ListCard' | 'TreeCard' | 'KeyValueCard' | string;   
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
export interface IOutputSynk {
    
  /// writes a message to the output
  write(message: string, verbosity?: VerbosityLevel): void;
  
  /**
   * writes a card to the output 
   */
  write(card: ICardBuilder, verbosity?: VerbosityLevel): void;  
}


/**
 * Metadata about a transform or operation applied to content
 */
export interface TransformMetadata {
  /** Type of transform (e.g., 'TokenReplace', 'Extract', 'RegexMatch') */
  type: string;
  /** Input token(s) used */
  inputs?: string[];
  /** Parameters passed to the transform */
  params?: Record<string, any>;
  /** Timestamp when transform was applied */
  timestamp: Date;
}

/**
 * Reference to a stored memory value with metadata
 */
export interface StringRef {
  /** Unique identifier (UUID or user-provided token) */
  id: string;
  /** Optional user-friendly token */
  token?: string;
  /** Creation timestamp */
  timestamp: Date;
  /** Path to persisted file (if applicable) */
  fileName: string;  
}

/**
 * Interface for executable commands that can be composed in workflows
 */
export interface ICommand {
  /**
   * Execute the command with the given context
   * @param context - The workflow context
   * @param args - Command arguments
   * @param cardBuilder - Optional card builder for creating formatted output (provided by framework)
   * @returns Array of tuples [value, decorators[]] to be stored with optional decorators
   */
  execute(
    context: IFlow, 
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]>;
}
  
/**
 * Interface for decorators that transform StringRef objects during storage
 */
export interface IRefDecorator {
  /**
   * Apply transformation to a StringRef
   * @param ref - The memory reference to transform
   * @returns Transformed memory reference
   */
  decorate(ref: StringRef): StringRef;
}

/**
 * Core workflow context interface for storing, retrieving, and executing operations
 */
export interface IFlow {
  cwd: string;
  
  /**
   * Configuration object with runtime options (verbosity, dryRun, etc.)
   */
  config?: Record<string, any>;
  
  /**
   * Stores a value with optional decorators
   * @param value - The value to store
   * @param decorators - Optional array of decorators to apply
   * @returns The stored memory reference
   */  
  set(value: any, decorators?: IRefDecorator[]): Promise<StringRef>;

  /**
   * Retrieves a stored value by its reference
   * @param ref - The memory reference to retrieve
   * @returns The stored value or undefined if not found
   */
  get(ref: StringRef): Promise<string | undefined>;


  /**
   * Execute a command with this context
   * @param command - The command to execute
   * @returns Array of memory references produced by the command
   */
  run(command: ICommand): Promise<StringRef[]>;
}

/**
 * Task execution result with metadata
 */
export interface TaskOutcome {
  /** Task identifier */
  id: string;
  /** Task name */
  name: string;
  /** Execution logs */
  logs: string[];
  /** Errors encountered */
  errors: string[];
  /** Success status */
  success: boolean;
  /** Output references */
  outputs: StringRef[];
}

/**
 * Log entry for command execution
 */
export interface TaskLog {
  /** Log entry ID */
  id: string;
  /** Command type */
  command: string;
  /** Command arguments */
  args: any[];
  /** Memory references used */
  refs: StringRef[];
  /** Start timestamp */
  startTime: Date;
  /** End timestamp */
  endTime?: Date;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
}
