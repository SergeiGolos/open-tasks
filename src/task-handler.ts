import { OutputBuilder } from './output-builders.js';
import { VerbosityLevel, ExecutionContext, ReferenceHandle, ICardBuilder, IOutputSynk, SummaryData } from './types.js';
import { IFlow } from './workflow/types.js';

/**
 * Base class for command handlers
 */

export abstract class TaskHandler {
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
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    
    const verbosity = context.verbosity || this.defaultVerbosity || 'summary';
    const outputBuilder: IOutputSynk = new OutputBuilder(verbosity);

    return await this.executeCommand(
      args,
      context.config,
      context.workflowContext,
      outputBuilder
    );    
  }

  /**
   * Subclasses implement this for command logic
   * Framework passes cardBuilder for command to create custom output cards
   * @param args - Command arguments   
   * @param context - Execution context with configuration
   * @param cardBuilder - Card builder for creating command-specific output (managed by framework)
   */
  protected abstract executeCommand(
    args: string[],
    config: Record<string, any>,
    workflowContext: IFlow,
    outputBuilder: IOutputSynk    
  ): Promise<ReferenceHandle>;
}
