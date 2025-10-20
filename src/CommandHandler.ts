import { createCardBuilder as createCardBuilderFactory } from './card-builders';
import { createOutputBuilder as createOutputBuilderFactory } from './output-builders';
import { VerbosityLevel, ExecutionContext, ReferenceHandle, ICardBuilder, IOutputBuilder, SummaryData } from './types';
import { IWorkflowContext } from './workflow/types.js';

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
    context: ExecutionContext
  ): Promise<ReferenceHandle> {

    const startTime = Date.now();
    const verbosity = context.verbosity || this.defaultVerbosity || 'summary';
    const outputBuilder: IOutputBuilder = createOutputBuilderFactory(verbosity);

    try {
      return await this.executeCommand(
        args,
        context.config,
        context.workflowContext,
        outputBuilder
      );
    } catch (error: any) {
      outputBuilder.addError(error, {
        command: this.name ,  
        startTime: startTime
     }); 
     return { id: 'error-id', content: error.message, timestamp: new Date() };
    }    
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
    workflowContext: IWorkflowContext,
    outputBuilder: IOutputBuilder    
  ): Promise<ReferenceHandle>;
}
