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

    throw new Error(`Command ${this.name} must implement execute() or executeCommand()`);
  }

  /**
   * Subclasses implement this for command logic
   * Framework passes cardBuilder for command to create custom output cards
   * @param args - Command arguments
   * @param refs - Reference handles map
   * @param context - Execution context with configuration
   * @param cardBuilder - Card builder for creating command-specific output (managed by framework)
   */
  protected abstract executeCommand(
    args: string[],
    config: Record<string, any>,
    workflowContext: IWorkflowContext,
    cardBuilder: ICardBuilder
  ): Promise<ReferenceHandle>;

  /**
   * Execute with timing and output control (new pattern)
   * Framework creates both output builder (for summary) and card builder (for command content)
   */
  private async executeWithOutputControl(
    args: string[],
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const startTime = Date.now();
    const outputBuilder = this.createOutputBuilder(context);
    const cardBuilder = this.createCardBuilder(context);

    try {
      // Execute the actual command logic, passing card builder
      const result = await this.executeCommand(args, context.config, context.workflowContext, cardBuilder);

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
}
