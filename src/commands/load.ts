import { promises as fs } from 'fs';
import path from 'path';
import { ExecutionContext, ReferenceHandle, IOutputSynk, IFlow, ITaskHandler } from '../types.js';
import { TaskHandler } from '../task-handler.js';
import { TokenDecorator } from '../decorators.js';
import { formatFileSize } from '../output-utils.js';
import { MessageCard, KeyValueCard } from '../cards/index.js';

/**
 * Load command - loads content from a file
 * Supports enhanced output control (quiet, summary, verbose)
 */
export default class LoadCommand implements ITaskHandler {
  name = 'load';
  description = 'Load content from a file';
  examples = [
    'open-tasks load ./file.txt',
    'open-tasks load ./file.txt --token myfile',
    'open-tasks load ./large-file.json --verbose',
  ];

  async execute(
    args: string[],
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const verbosity = context.verbosity || 'summary';
    
    if (args.length === 0) {
      throw new Error('Load command requires a file path argument');
    }

    const filePath = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Resolve file path relative to cwd
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(context.cwd, filePath);

    // Check if file exists and get stats
    let stats;
    try {
      stats = await fs.stat(absolutePath);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file content
    const content = await fs.readFile(absolutePath, 'utf-8');

    // Store using workflow context
    const StringRef = await context.workflowContext.set(content, token ? [new TokenDecorator(token)] : []);

    // Create reference handle
    const ref: ReferenceHandle = {
      id: StringRef.id,
      content: content,
      token: token,
      timestamp: new Date(),
      outputFile: absolutePath,
    };

    // Add card with file details
    const contentLength = content.length;
    
    const contentPreview = content.length > 100 
      ? content.substring(0, 100) + '...'
      : content;
    
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
    
    if (verbosity !== 'quiet') {
      console.log(new MessageCard('📂 File Loaded', details, 'success').build());
    }

    return ref;
  }
}
