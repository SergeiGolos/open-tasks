import { CommandHandler, ExecutionContext, ReferenceHandle } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';

/**
 * Example Custom Command
 * 
 * This template demonstrates how to create a custom command for open-tasks-cli.
 * Copy this file to `.open-tasks/commands/` in your project and customize it.
 * 
 * The command will be automatically discovered and available via:
 * `open-tasks example-command <args>`
 */
export default class ExampleCommand extends CommandHandler {
  // REQUIRED: The command name (used in CLI: open-tasks example-command)
  name = 'example-command';
  
  // REQUIRED: Short description shown in help text
  description = 'An example custom command template';
  
  // REQUIRED: Usage examples shown in command help
  examples = [
    'open-tasks example-command "input value"',
    'open-tasks example-command "input" --token result',
    'open-tasks example-command --ref previous-output',
  ];

  /**
   * REQUIRED: Execute method - implements the command logic
   * 
   * @param args - Command-line arguments (positional and flags)
   * @param refs - Map of reference handles passed via --ref flags
   * @param context - Execution context with shared services
   * @returns Promise<ReferenceHandle> - Result reference for chaining
   */
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    
    // ========================================
    // 1. PARSE ARGUMENTS
    // ========================================
    
    // Get positional arguments
    const inputValue = args[0];
    if (!inputValue) {
      throw new Error('Example command requires an input value');
    }
    
    // Parse optional flags
    const token = args.find((arg, i) => args[i - 1] === '--token');
    const verbose = args.includes('--verbose');
    
    if (verbose) {
      console.log(`Processing input: ${inputValue}`);
    }
    
    // ========================================
    // 2. ACCESS REFERENCES
    // ========================================
    
    // Get referenced values from previous commands
    const refTokens = Array.from(refs.keys());
    let contextData = '';
    
    if (refTokens.length > 0) {
      const firstRef = refs.get(refTokens[0]);
      if (firstRef) {
        contextData = String(firstRef.content);
        if (verbose) {
          console.log(`Using reference: ${firstRef.token || firstRef.id}`);
        }
      }
    }
    
    // ========================================
    // 3. PERFORM COMMAND LOGIC
    // ========================================
    
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
    
    if (verbose) {
      console.log('Metadata:', JSON.stringify(metadata, null, 2));
    }
    
    // ========================================
    // 4. STORE RESULT
    // ========================================
    
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
    // 6. RETURN RESULT
    // ========================================
    
    return referenceHandle;
  }
}

/**
 * ADVANCED PATTERNS
 * =================
 * 
 * ## 1. Using ICommand Interface for Composition
 * 
 * ```typescript
 * import { ICommand } from '../workflow/types.js';
 * 
 * // Execute other commands within your command
 * const results = await context.workflowContext.run(someCommandInstance);
 * ```
 * 
 * ## 2. Using Decorators
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
 * ## 3. Multiple Output Files
 * 
 * ```typescript
 * // Each store creates a file in the same timestamped directory
 * const result1 = await context.workflowContext.store(data1, [new TokenDecorator('output1')]);
 * const result2 = await context.workflowContext.store(data2, [new TokenDecorator('output2')]);
 * // Both files in: .open-tasks/outputs/{timestamp}-{command}/
 * ```
 * 
 * ## 4. File System Operations
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
 * ## 4. Error Handling
 * 
 * ```typescript
 * try {
 *   // Risky operation
 *   const data = await fetchData();
 * } catch (error) {
 *   // Write error log
 *   await context.outputHandler.writeError(error as Error, {
 *     command: this.name,
 *     args,
 *   });
 *   throw new Error(`Failed to fetch data: ${(error as Error).message}`);
 * }
 * ```
 * 
 * ## 5. Progress Indicators
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
 * ## 6. Accessing Configuration
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
 * ## 7. Child Process Execution
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
 * 4. **Add verbose logging** - Support --verbose flag for debugging
 * 5. **Document examples** - Show real usage in examples array
 * 6. **Handle edge cases** - Missing refs, empty input, etc.
 * 7. **Return consistent results** - Always return ReferenceHandle
 * 8. **Clean up resources** - Close files, connections, etc.
 * 
 * TESTING YOUR COMMAND
 * ====================
 * 
 * 1. Build the CLI: `npm run build`
 * 2. Copy to commands: `cp templates/example-command.ts .open-tasks/commands/`
 * 3. Test execution: `open-tasks example-command "test"`
 * 4. Test with refs: `open-tasks store "data" --token d && open-tasks example-command "test" --ref d`
 * 5. Check output files: `ls .open-tasks/outputs/`
 * 
 * DEPLOYING YOUR COMMAND
 * ======================
 * 
 * - **Project-specific**: Keep in `.open-tasks/commands/` (gitignored by default)
 * - **Shared across team**: Commit to version control
 * - **Reusable library**: Publish as npm package with CLI dependency
 */
