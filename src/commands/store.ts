import path from 'path';
import { CommandHandler, ExecutionContext, ReferenceHandle, ICardBuilder } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';
import { formatFileSize } from '../output-utils.js';

/**
 * Store command - stores a value and creates a reference
 * Demonstrates new card builder pattern
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
    context: ExecutionContext,
    cardBuilder: ICardBuilder
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Store command requires a value argument');
    }

    const value = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Add progress using card builder (shown based on verbosity)
    cardBuilder.addProgress('Preparing to store value...');

    // Store using workflow context
    const decorators = token ? [new TokenDecorator(token)] : [];
    const memoryRef = await context.workflowContext.store(value, decorators);

    cardBuilder.addProgress('Value stored successfully');

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

    // Add card with processing details (shown in verbose mode)
    const valueSize = new TextEncoder().encode(value).length;
    
    // Format details as a clean key-value display
    const details = [
      `Value Length: ${value.length}`,
      `Size: ${formatFileSize(valueSize)}`,
      `Token: ${token || 'none'}`,
      `Reference ID: ${ref.id.substring(0, 8)}...`,
      `Output File: ${outputFile ? path.basename(outputFile) : 'none'}`,
    ].join('\n');
    
    cardBuilder.addCard('⚙️  Processing Details', details, 'info');

    return ref;
  }
}

