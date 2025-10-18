import { CommandHandler, ExecutionContext, ReferenceHandle } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';

/**
 * Replace command - performs token replacement in a template string
 */
export default class ReplaceCommand extends CommandHandler {
  name = 'replace';
  description = 'Replace tokens in a template string with referenced values';
  examples = [
    'open-tasks replace "Hello {{name}}" --ref name',
    'open-tasks replace "{{greeting}} {{name}}" --ref greeting --ref name --token message',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Replace command requires a template string argument');
    }

    let template = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Perform replacements for all references
    for (const [refToken, ref] of refs.entries()) {
      const pattern = new RegExp(`\\{\\{${refToken}\\}\\}`, 'g');
      template = template.replace(pattern, String(ref.content));
    }

    // Check for unreplaced tokens
    const unreplacedTokens = template.match(/\{\{([^}]+)\}\}/g);
    if (unreplacedTokens) {
      console.warn(
        `Warning: Unreplaced tokens found: ${unreplacedTokens.join(', ')}`
      );
    }

    // Store the result
    const decorators = token ? [new TokenDecorator(token)] : [];
    const memoryRef = await context.workflowContext.store(template, decorators);

    const outputFile = memoryRef.fileName
      ? `${context.outputDir}/${memoryRef.fileName}`
      : undefined;

    const ref = context.referenceManager.createReference(
      memoryRef.id,
      template,
      token,
      outputFile
    );

    return ref;
  }
}
