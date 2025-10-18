import { CommandHandler, ExecutionContext, ReferenceHandle, IOutputBuilder } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';
import { addFormattedSection, addProcessingDetails } from '../output-utils.js';

/**
 * Example Custom Command
 * 
 * This template demonstrates how to create a custom command for open-tasks-cli.
 * Copy this file to `.open-tasks/commands/` in your project and customize it.
 * 
 * The command will be automatically discovered and available via:
 * `open-tasks example-command <args>`
 * 
 * VERBOSITY LEVELS:
 * - quiet: Minimal output (one line)
 * - summary: Brief summary with key information (default)
 * - verbose: Detailed information with metadata
 * - stream: Real-time progress updates
 */
export default class ExampleCommand extends CommandHandler {
  // REQUIRED: The command name (used in CLI: open-tasks example-command)
  name = 'example-command';
  
  // REQUIRED: Short description shown in help text
  description = 'An example custom command template';
  
  // REQUIRED: Usage examples shown in command help
  examples = [
    'open-tasks example-command "input value"',
    'open-tasks example-command "input" --token result --verbose',
    'open-tasks example-command --ref previous-output --stream',
  ];

  /**
   * REQUIRED: Execute method - implements the command logic with output control
   * 
   * Uses the new executeCommand() pattern for automatic verbosity and output routing.
   * The output builder is automatically created based on CLI flags (--quiet, --verbose, --stream).
   * 
   * @param args - Command-line arguments (positional and flags)
   * @param refs - Map of reference handles passed via --ref flags
   * @param context - Execution context with shared services and verbosity settings
   * @param builder - Output builder for formatting output based on verbosity level
   * @returns Promise<ReferenceHandle> - Result reference for chaining
   */
  async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    builder: IOutputBuilder
  ): Promise<ReferenceHandle> {
    
    // ========================================
    // 1. PARSE ARGUMENTS
    // ========================================
    
    // Get positional arguments
    const inputValue = args[0];
    if (!inputValue) {
      throw new Error('Example command requires an input value');
    }
    
    // Parse optional flags (note: --verbose, --quiet, --stream are handled automatically)
    const token = args.find((arg, i) => args[i - 1] === '--token');
    
    // Report initial progress (visible in stream mode)
    builder.addProgress?.('Parsing input value...');
    
    // ========================================
    // 2. ACCESS REFERENCES
    // ========================================
    
    // Get referenced values from previous commands
    const refTokens = Array.from(refs.keys());
    let contextData = '';
    
    if (refTokens.length > 0) {
      builder.addProgress?.('Loading referenced data...');
      const firstRef = refs.get(refTokens[0]);
      if (firstRef) {
        contextData = String(firstRef.content);
        // In verbose mode, show which reference we're using
        if (context.verbosity === 'verbose') {
          builder.addSection?.('Reference Details', `Token: ${firstRef.token || firstRef.id}\nContent length: ${contextData.length} bytes`);
        }
      }
    }
    
    // ========================================
    // 3. PERFORM COMMAND LOGIC
    // ========================================
    
    builder.addProgress?.('Processing input...');
    
    // Example: Transform the input
    let result = inputValue.toUpperCase();
    
    // Example: Combine with reference data
    if (contextData) {
      result = `${result} (context: ${contextData})`;
    }
    
    // Example: Add metadata
    const metadata = {
      processedAt: new Date().toISOString(),
      inputLength: inputValue.length,
      resultLength: result.length,
    };
    
    // Show detailed processing information in verbose mode
    if (context.verbosity === 'verbose') {
      addProcessingDetails(builder, {
        'Input Length': `${inputValue.length} characters`,
        'Output Length': `${result.length} characters`,
        'Context Data': contextData ? `${contextData.length} bytes` : 'None',
        'Processed At': metadata.processedAt,
      });
    }
    
    // ========================================
    // 4. STORE RESULT
    // ========================================
    
    builder.addProgress?.('Storing result...');
    
    // Use workflow context to store the result
    // Decorators are applied BEFORE file creation
    // Output is written to: .open-tasks/outputs/{timestamp}-example-command/
    const decorators = token ? [new TokenDecorator(token)] : [];
    const memoryRef = await context.workflowContext.store(result, decorators);
    
    // ========================================
    // 5. CREATE REFERENCE HANDLE
    // ========================================
    
    // Create a reference handle for command chaining
    const outputFile = memoryRef.fileName
      ? `${context.outputDir}/${memoryRef.fileName}`
      : undefined;
    
    const referenceHandle = context.referenceManager.createReference(
      memoryRef.id,
      result,
      token,
      outputFile
    );
    
    // ========================================
    // 6. FORMAT SUMMARY
    // ========================================
    
    // Add summary information (shown in summary mode and above)
    builder.addSummary?.({
      success: true,
      operation: 'example-command',
      details: `Processed "${inputValue.substring(0, 20)}${inputValue.length > 20 ? '...' : ''}"`,
      metadata: {
        outputLength: result.length,
        token: token || memoryRef.id,
      },
    });
    
    // In verbose mode, show the output file location
    if (context.verbosity === 'verbose' && outputFile) {
      addFormattedSection(builder, 'Output File', outputFile);
    }
    
    // ========================================
    // 7. RETURN RESULT
    // ========================================
    
    return referenceHandle;
  }
}

/**
 * ADVANCED PATTERNS
 * =================
 * 
 * ## 1. Output Control with Verbosity Levels
 * 
 * The new executeCommand() method provides automatic output formatting:
 * 
 * ```typescript
 * // Use addProgress for real-time updates (visible in stream mode)
 * builder.addProgress?.('Processing step 1...');
 * 
 * // Use addSection for detailed information (visible in verbose mode)
 * builder.addSection?.('Details', 'Detailed information here');
 * 
 * // Use addSummary for final results (visible in summary mode and above)
 * builder.addSummary?.({
 *   success: true,
 *   operation: 'command-name',
 *   details: 'Brief description of what happened',
 * });
 * 
 * // Check verbosity level explicitly if needed
 * if (context.verbosity === 'verbose') {
 *   // Add detailed logging
 * }
 * ```
 * 
 * ## 2. Using ICommand Interface for Composition
 * 
 * ```typescript
 * import { ICommand } from '../workflow/types.js';
 * 
 * // Execute other commands within your command
 * const results = await context.workflowContext.run(someCommandInstance);
 * ```
 * 
 * ## 3. Using Decorators
 * 
 * ```typescript
 * import { TokenDecorator, FileNameDecorator, MetadataDecorator } from '../workflow/decorators.js';
 * 
 * // Decorators run BEFORE file creation
 * const ref = await context.workflowContext.store(data, [
 *   new TokenDecorator('mytoken'),
 *   new FileNameDecorator('custom-name.txt'),
 *   new MetadataDecorator({ source: 'api', version: 1 })
 * ]);
 * // File written to: .open-tasks/outputs/{timestamp}-{command}/custom-name.txt
 * ```
 * 
 * ## 4. Multiple Output Files
 * 
 * ```typescript
 * // Each store creates a file in the same timestamped directory
 * const result1 = await context.workflowContext.store(data1, [new TokenDecorator('output1')]);
 * const result2 = await context.workflowContext.store(data2, [new TokenDecorator('output2')]);
 * // Both files in: .open-tasks/outputs/{timestamp}-{command}/
 * ```
 * 
 * ## 5. File System Operations
 * 
 * ```typescript
 * import { promises as fs } from 'fs';
 * import path from 'path';
 * 
 * // Read additional files
 * const configPath = path.join(context.cwd, 'config.json');
 * const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
 * 
 * // Write custom output files
 * await context.outputHandler.writeOutput(content, 'custom-name.txt');
 * ```
 * 
 * ## 6. Error Handling
 * 
 * ```typescript
 * try {
 *   // Risky operation
 *   const data = await fetchData();
 * } catch (error) {
 *   // Errors are automatically formatted by the framework
 *   // Just throw with a descriptive message
 *   throw new Error(`Failed to fetch data: ${(error as Error).message}`);
 * }
 * ```
 * 
 * ## 7. Progress Indicators (Legacy Pattern)
 * 
 * Note: With the new output control system, prefer using builder.addProgress()
 * instead of third-party progress indicators for consistent output.
 * 
 * ```typescript
 * import ora from 'ora';
 * 
 * const spinner = ora('Processing data...').start();
 * try {
 *   await longRunningOperation();
 *   spinner.succeed('Processing complete!');
 * } catch (error) {
 *   spinner.fail('Processing failed');
 *   throw error;
 * }
 * ```
 * 
 * ## 8. Accessing Configuration
 * 
 * ```typescript
 * // Access project configuration
 * const customSetting = context.config.myCustomSetting;
 * 
 * // Load custom config file
 * const configPath = path.join(context.cwd, '.open-tasks', 'my-config.json');
 * const myConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));
 * ```
 * 
 * ## 9. Child Process Execution
 * 
 * ```typescript
 * import { exec } from 'child_process';
 * import { promisify } from 'util';
 * 
 * const execAsync = promisify(exec);
 * 
 * const { stdout, stderr } = await execAsync('some-command', {
 *   cwd: context.cwd,
 *   timeout: 30000,
 * });
 * ```
 * 
 * BEST PRACTICES
 * ==============
 * 
 * 1. **Always validate inputs** - Check arguments before processing
 * 2. **Provide helpful errors** - Include context in error messages
 * 3. **Use tokens for results** - Make outputs easy to reference
 * 4. **Use builder methods** - Let the framework handle output formatting
 * 5. **Add progress messages** - Use builder.addProgress() for long operations
 * 6. **Document examples** - Show real usage in examples array with verbosity flags
 * 7. **Handle edge cases** - Missing refs, empty input, etc.
 * 8. **Return consistent results** - Always return ReferenceHandle
 * 9. **Clean up resources** - Close files, connections, etc.
 * 10. **Test all verbosity levels** - Ensure command works with --quiet, --summary, --verbose, --stream
 * 
 * TESTING YOUR COMMAND
 * ====================
 * 
 * 1. Build the CLI: `npm run build`
 * 2. Copy to commands: `cp templates/example-command.ts .open-tasks/commands/`
 * 3. Test basic execution: `open-tasks example-command "test"`
 * 4. Test verbosity levels:
 *    - `open-tasks example-command "test" --quiet`
 *    - `open-tasks example-command "test" --summary` (default)
 *    - `open-tasks example-command "test" --verbose`
 *    - `open-tasks example-command "test" --stream`
 * 5. Test output routing:
 *    - `open-tasks example-command "test" --screen-only`
 *    - `open-tasks example-command "test" --log-only`
 *    - `open-tasks example-command "test" --file output.txt`
 * 6. Test with refs: `open-tasks store "data" --token d && open-tasks example-command "test" --ref d --verbose`
 * 7. Check output files: `ls .open-tasks/outputs/`
 * 
 * DEPLOYING YOUR COMMAND
 * ======================
 * 
 * - **Project-specific**: Keep in `.open-tasks/commands/` (gitignored by default)
 * - **Shared across team**: Commit to version control
 * - **Reusable library**: Publish as npm package with CLI dependency
 */
