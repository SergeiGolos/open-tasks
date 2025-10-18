/**
 * Workflow Processing Types
 * Defines core types for the workflow processing system
 */

/**
 * Reference to a stored memory value with metadata
 */
export interface MemoryRef {
  /** Unique identifier (UUID or user-provided token) */
  id: string;
  /** Optional user-friendly token */
  token?: string;
  /** Path to persisted file (if applicable) */
  fileName?: string;
  /** In-memory content */
  content: any;
  /** Creation timestamp */
  timestamp: Date;
}

/**
 * Interface for executable commands that can be composed in workflows
 */
export interface ICommand {
  /**
   * Execute the command with the given context
   * @param context - The workflow context
   * @param args - Command arguments
   * @returns Array of memory references produced by the command
   */
  execute(context: IWorkflowContext, args: any[]): Promise<MemoryRef[]>;
}

/**
 * Interface for decorators that transform MemoryRef objects during storage
 */
export interface IMemoryDecorator {
  /**
   * Apply transformation to a MemoryRef
   * @param ref - The memory reference to transform
   * @returns Transformed memory reference
   */
  decorate(ref: MemoryRef): MemoryRef;
}

/**
 * Core workflow context interface for storing, retrieving, and executing operations
 */
export interface IWorkflowContext {
  /**
   * Store a value with optional decorators
   * @param value - The value to store
   * @param decorators - Optional decorators to apply
   * @returns Memory reference to the stored value
   */
  store(value: any, decorators?: IMemoryDecorator[]): Promise<MemoryRef>;

  /**
   * Retrieve the latest value for a given token (synchronous)
   * @param name - Token name to lookup
   * @returns The stored value or undefined if not found
   */
  token(name: string): any;

  /**
   * Execute a command with this context
   * @param command - The command to execute
   * @returns Array of memory references produced by the command
   */
  run(command: ICommand): Promise<MemoryRef[]>;
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
  outputs: MemoryRef[];
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
  refs: MemoryRef[];
  /** Start timestamp */
  startTime: Date;
  /** End timestamp */
  endTime?: Date;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
}
