import { promises as fs } from 'fs';
import path from 'path';
import { CommandHandler, ExecutionContext, ReferenceHandle } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';

/**
 * Load command - loads content from a file
 */
export default class LoadCommand extends CommandHandler {
  name = 'load';
  description = 'Load content from a file';
  examples = [
    'open-tasks load ./file.txt',
    'open-tasks load ./file.txt --token myfile',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
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

    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Load using workflow context
    const memoryRef = await context.workflowContext.load(absolutePath, token);

    // Create reference handle
    const ref = context.referenceManager.createReference(
      memoryRef.id,
      memoryRef.content,
      token,
      absolutePath
    );

    return ref;
  }
}
