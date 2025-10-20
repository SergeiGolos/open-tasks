import { DirectoryOutputContext, IWorkflowContext } from './workflow/index.js';
import { OutputHandler } from './OutputHandler.js';
import { CommandHandler } from './CommandHandler.js';

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
  /** Output handler instance */
  outputHandler: OutputHandler;
  /** Workflow context */
  workflowContext: IWorkflowContext;
  /** Configuration object */
  config: Record<string, any>;
  /** Verbosity level (default: 'summary') */
  verbosity?: VerbosityLevel;  
}