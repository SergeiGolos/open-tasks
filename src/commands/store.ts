import { CommandHandler, ExecutionContext, ReferenceHandle, IOutputBuilder } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';
import { addProcessingDetails, formatFileSize } from '../output-utils.js';

/**
 * Store command - stores a value and creates a reference
 * Supports enhanced output control (quiet, summary, verbose)
 */
export default class StoreCommand extends CommandHandler {
  name = 'store';
  description = 'Store a value and create a reference';
  examples = [
    'open-tasks store "Hello World"',
    'open-tasks store "Hello World" --token greeting',
    'open-tasks store "Data" --token data --verbose',
  ];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Store command requires a value argument');
    }

    const value = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Get output builder for progress reporting
    const builder = this.createOutputBuilder(context);
    
    // Add progress (shown in verbose mode if command implements progressive output)
    builder.addProgress('Preparing to store value...');

    // Store using workflow context
    const decorators = token ? [new TokenDecorator(token)] : [];
    const memoryRef = await context.workflowContext.store(value, decorators);

    builder.addProgress('Value stored successfully');

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

    // Add verbose details
    if (context.verbosity === 'verbose') {
      const valueSize = new TextEncoder().encode(value).length;
      addProcessingDetails(builder, {
        'Value Length': value.length,
        'Size': formatFileSize(valueSize),
        'Token': token || 'none',
        'Reference ID': ref.id,
        'Output File': outputFile || 'none',
      });
    }

    return ref;
  }
}
