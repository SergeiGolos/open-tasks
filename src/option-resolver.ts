import path from 'path';
import { VerbosityLevel } from './types.js';
import { formatError } from './formatters.js';

/**
 * Handles CLI option parsing and validation
 */
export class OptionResolver {
  /**
   * Resolves verbosity level from global options
   * @throws Error if multiple verbosity flags are specified
   */
  resolveVerbosity(globalOpts: any): VerbosityLevel {
    this.validateVerbosityFlags(globalOpts);
    
    if (globalOpts.quiet) return 'quiet';
    if (globalOpts.summary) return 'summary';
    if (globalOpts.verbose) return 'verbose';
    
    return 'summary'; // default
  }

  /**
   * Resolves output directory from options or config
   */
  resolveOutputDir(cwd: string, globalOpts: any, config: Record<string, any>): string {
    if (globalOpts.dir) {
      return path.resolve(cwd, globalOpts.dir);
    }
    return path.join(cwd, config.outputDir);
  }

  /**
   * Validates that only one verbosity flag is specified
   * @throws Error if multiple verbosity flags are present
   */
  validateVerbosityFlags(globalOpts: any): void {
    const verbosityFlags = [
      globalOpts.quiet,
      globalOpts.summary,
      globalOpts.verbose
    ].filter(Boolean);
    
    if (verbosityFlags.length > 1) {
      console.error(formatError('Error: Only one verbosity flag (--quiet, --summary, --verbose) can be specified'));
      process.exit(1);
    }
  }
}
