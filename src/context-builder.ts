import { ExecutionContext, VerbosityLevel } from './types.js';
import { ConsoleOutputBuilder } from './output-builders.js';
import { DirectoryOutputContext } from './directory-output-context.js';

/**
 * Builds execution context from resolved options
 */
export class ContextBuilder {
  constructor(
    private readonly cwd: string,
    private readonly config: Record<string, any>
  ) {}

  /**
   * Builds a complete execution context for command execution
   */
  build(outputDir: string, verbosity: VerbosityLevel): ExecutionContext {
    const workflowContext = new DirectoryOutputContext(this.cwd, outputDir, verbosity);
    const outputSynk = new ConsoleOutputBuilder(verbosity);

    return {
      cwd: this.cwd,
      outputDir,
      workflowContext,
      outputSynk,
      config: this.config,
      verbosity
    };
  }
}
