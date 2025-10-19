import { promises as fs } from 'fs';
import path from 'path';
import { CommandHandler, ExecutionContext, ReferenceHandle } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';
import { addFileInfoSection, addProcessingDetails } from '../output-utils.js';

/**
 * Load command - loads content from a file
 * Supports enhanced output control (quiet, summary, verbose)
 */
export default class LoadCommand extends CommandHandler {
  name = 'load';
  description = 'Load content from a file';
  examples = [
    'open-tasks load ./file.txt',
    'open-tasks load ./file.txt --token myfile',
    'open-tasks load ./large-file.json --verbose',
  ];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Load command requires a file path argument');
    }

    const filePath = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Get output builder for progress reporting
    const builder = this.createOutputBuilder(context);

    // Resolve file path relative to cwd
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(context.cwd, filePath);

    builder.addProgress(`Checking file: ${filePath}`);

    // Check if file exists and get stats
    let stats;
    try {
      stats = await fs.stat(absolutePath);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Add file information in verbose mode
    if (context.verbosity === 'verbose') {
      addFileInfoSection(builder, absolutePath, stats.size);
    }

    builder.addProgress('Reading file content...');

    // Load using workflow context
    const memoryRef = await context.workflowContext.load(absolutePath, token);

    builder.addProgress('File loaded successfully');

    // Create reference handle
    const ref = context.referenceManager.createReference(
      memoryRef.id,
      memoryRef.content,
      token,
      absolutePath
    );

    // Add processing details in verbose mode
    if (context.verbosity === 'verbose') {
      const contentLength = typeof memoryRef.content === 'string' 
        ? memoryRef.content.length 
        : JSON.stringify(memoryRef.content).length;
      
      addProcessingDetails(builder, {
        'Content Length': contentLength,
        'Token': token || 'none',
        'Reference ID': ref.id,
      });
    }

    return ref;
  }
}
