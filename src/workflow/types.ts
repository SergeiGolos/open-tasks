/**
 * Workflow Processing Types
 * Defines core types for the workflow processing system
 */

import { ICardBuilder } from "../types";

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
  /** Path to persisted file (if applicable) */
  fileName?: string;
  /** In-memory content */
  content: any;
  /** Creation timestamp */
  timestamp: Date;
  /** Metadata about transforms applied to this content */
  metadata?: TransformMetadata[];
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
   * @returns Array of memory references produced by the command
   */
  execute(
    context: IFlow, 
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<StringRef[]>;
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
  
  /**
   * Execute a command with this context
   * @param command - The command to execute
   * @returns Array of memory references produced by the command
   */
  with(command: ICommand): Promise<StringRef[]>;
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
