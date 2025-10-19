import { promises as fs } from 'fs';
import path from 'path';
import { CommandHandler, ExecutionContext, ReferenceHandle, ICardBuilder } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';
import { formatFileSize } from '../output-utils.js';

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
    context: ExecutionContext,
    cardBuilder: ICardBuilder
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Load command requires a file path argument');
    }

    const filePath = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Resolve file path relative to cwd
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(context.cwd, filePath);

    cardBuilder.addProgress(`Checking file: ${filePath}`);

    // Check if file exists and get stats
    let stats;
    try {
      stats = await fs.stat(absolutePath);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    cardBuilder.addProgress('Reading file content...');

    // Load using workflow context
    const memoryRef = await context.workflowContext.load(absolutePath, token);

    cardBuilder.addProgress('File loaded successfully');

    // Create reference handle
    const ref = context.referenceManager.createReference(
      memoryRef.id,
      memoryRef.content,
      token,
      absolutePath
    );

    // Add card with file details
    const contentLength = typeof memoryRef.content === 'string' 
      ? memoryRef.content.length 
      : JSON.stringify(memoryRef.content).length;
    
    const contentPreview = typeof memoryRef.content === 'string'
      ? memoryRef.content.substring(0, 100) + (memoryRef.content.length > 100 ? '...' : '')
      : JSON.stringify(memoryRef.content, null, 2).substring(0, 100) + '...';
    
    const details = [
      `File: ${path.basename(absolutePath)}`,
      `Path: ${path.dirname(absolutePath)}`,
      `Size: ${formatFileSize(stats.size)}`,
      `Content Length: ${contentLength} chars`,
      `Token: ${token || 'none'}`,
      `Reference ID: ${ref.id.substring(0, 8)}...`,
      ``,
      `Preview:`,
      contentPreview,
    ].join('\n');
    
    cardBuilder.addCard('📂 File Loaded', details, 'success');

    return ref;
  }
}
