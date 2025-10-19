import { CommandHandler, ExecutionContext, ReferenceHandle, ICardBuilder } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';
import { formatFileSize } from '../output-utils.js';

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

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    cardBuilder: ICardBuilder
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Replace command requires a template string argument');
    }

    let template = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');
    const originalTemplate = template;

    cardBuilder.addProgress('Performing token replacements...');

    // Track replacements
    const replacements: string[] = [];

    // Perform replacements for all references
    for (const [refToken, ref] of refs.entries()) {
      const pattern = new RegExp(`\\{\\{${refToken}\\}\\}`, 'g');
      const matches = template.match(pattern);
      if (matches) {
        template = template.replace(pattern, String(ref.content));
        replacements.push(`{{${refToken}}} → ${String(ref.content).substring(0, 30)}...`);
      }
    }

    // Check for unreplaced tokens
    const unreplacedTokens = template.match(/\{\{([^}]+)\}\}/g);
    if (unreplacedTokens) {
      console.warn(
        `Warning: Unreplaced tokens found: ${unreplacedTokens.join(', ')}`
      );
    }

    cardBuilder.addProgress('Storing result...');

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

    // Add card with replacement details
    const details = [
      `Template Length: ${originalTemplate.length} chars`,
      `Result Length: ${template.length} chars`,
      `Replacements Made: ${replacements.length}`,
      `Token: ${token || 'none'}`,
      `Reference ID: ${ref.id.substring(0, 8)}...`,
      ``,
      replacements.length > 0 ? `Replacements:` : 'No replacements made',
      ...replacements.slice(0, 5).map(r => `  • ${r}`),
      replacements.length > 5 ? `  ... and ${replacements.length - 5} more` : '',
    ].filter(Boolean).join('\n');
    
    const cardStyle = unreplacedTokens ? 'warning' : 'success';
    cardBuilder.addCard('🔄 Token Replacement', details, cardStyle);

    return ref;
  }
}
