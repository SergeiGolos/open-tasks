import { CommandHandler, ExecutionContext, ReferenceHandle, ICardBuilder } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';

/**
 * Extract command - extracts text using regex patterns
 */
export default class ExtractCommand extends CommandHandler {
  name = 'extract';
  description = 'Extract text using regex patterns';
  examples = [
    'open-tasks extract "\\d+" --ref input',
    'open-tasks extract "\\w+@\\w+\\.\\w+" --ref text --all',
  ];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    cardBuilder: ICardBuilder
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Extract command requires a regex pattern argument');
    }

    const pattern = args[0];
    const extractAll = args.includes('--all');
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Get the input reference
    const refTokens = Array.from(refs.keys());
    if (refTokens.length === 0) {
      throw new Error('Extract command requires at least one --ref argument');
    }

    const inputRef = refs.get(refTokens[0]);
    if (!inputRef) {
      throw new Error(`Reference not found: ${refTokens[0]}`);
    }

    const input = String(inputRef.content);

    cardBuilder.addProgress(`Applying pattern: ${pattern}`);

    // Create regex
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, extractAll ? 'g' : '');
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${pattern}`);
    }

    // Extract matches
    let result: string;
    let matchCount = 0;
    
    if (extractAll) {
      const matches = Array.from(input.matchAll(regex));
      matchCount = matches.length;
      if (matches.length === 0) {
        result = 'No matches found';
      } else {
        result = matches
          .map((match) => {
            if (match.length > 1) {
              // Has capture groups
              return match.slice(1).join(', ');
            }
            return match[0];
          })
          .join('\n');
      }
    } else {
      const match = input.match(regex);
      matchCount = match ? 1 : 0;
      if (!match) {
        result = 'No match found';
      } else {
        if (match.length > 1) {
          // Has capture groups
          result = match.slice(1).join(', ');
        } else {
          result = match[0];
        }
      }
    }

    cardBuilder.addProgress('Storing extracted result...');

    // Store the result
    const decorators = token ? [new TokenDecorator(token)] : [];
    const memoryRef = await context.workflowContext.store(result, decorators);

    const outputFile = memoryRef.fileName
      ? `${context.outputDir}/${memoryRef.fileName}`
      : undefined;

    const ref = context.referenceManager.createReference(
      memoryRef.id,
      result,
      token,
      outputFile
    );

    // Add card with extraction details
    const resultPreview = result.length > 100 
      ? result.substring(0, 100) + '...' 
      : result;
    
    const details = [
      `Pattern: ${pattern}`,
      `Mode: ${extractAll ? 'Extract all matches' : 'Extract first match'}`,
      `Input Length: ${input.length} chars`,
      `Matches Found: ${matchCount}`,
      `Result Length: ${result.length} chars`,
      `Token: ${token || 'none'}`,
      `Reference ID: ${ref.id.substring(0, 8)}...`,
      ``,
      `Extracted:`,
      resultPreview,
    ].join('\n');
    
    const cardStyle = matchCount > 0 ? 'success' : 'warning';
    cardBuilder.addCard('🔍 Text Extraction', details, cardStyle);

    return ref;
  }
}
