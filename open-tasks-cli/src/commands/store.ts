import { v4 as uuidv4 } from 'uuid';
import { CommandHandler, ExecutionContext, ReferenceHandle } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';

/**
 * Store command - stores a value and creates a reference
 */
export default class StoreCommand extends CommandHandler {
  name = 'store';
  description = 'Store a value and create a reference';
  examples = [
    'open-tasks store "Hello World"',
    'open-tasks store "Hello World" --token greeting',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Store command requires a value argument');
    }

    const value = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Store using workflow context
    const decorators = token ? [new TokenDecorator(token)] : [];
    const memoryRef = await context.workflowContext.store(value, decorators);

    // Create reference handle
    const outputFile = memoryRef.fileName
      ? `${context.outputDir}/${memoryRef.fileName}`
      : undefined;

    const ref = context.referenceManager.createReference(
      memoryRef.id,
      value,
      token,
      outputFile
    );

    return ref;
  }
}
