import { VerbosityLevel, ExecutionContext, ReferenceHandle, IOutputSynk, ITaskHandler } from './types.js';
import { IFlow } from './types.js';

/**
 * Base class for command handlers
 */

export abstract class TaskHandler implements ITaskHandler {
  abstract name: string;
  abstract description: string;
  abstract examples: string[];

  /**
   * Main execute method - can be overridden for backward compatibility
   * or use the new executeCommand pattern for enhanced output control
   */
  async execute(
    args: string[],    
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    
    return await this.executeCommand(
      context.config,
      args,      
      context.workflowContext,
      context.outputSynk
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
    config: Record<string, any>,
    args: string[],    
    flow: IFlow,
    synk: IOutputSynk    
  ): Promise<ReferenceHandle>;
}
