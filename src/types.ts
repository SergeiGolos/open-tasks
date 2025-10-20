import { DirectoryOutputContext, IFlow } from './workflow/index.js';
import { OutputHandler } from './OutputHandler.js';
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
export interface LoadedCommand {
  name: string;
  handler: TaskHandler;
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
  outputHandler: OutputHandler;
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
  write(message: string, verbosity: VerbosityLevel): void;
  
  /**
   * writes a card to the output
   */
  write(card: ICardBuilder, verbosity: VerbosityLevel): void;  
}