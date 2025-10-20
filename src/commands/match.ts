import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';
import { TokenDecorator } from '../decorators.js';

/**
 * MatchCommand - Matches a regex pattern and assigns captures to tokens
 * 
 * This command matches a regex pattern against a StringRef and assigns the captured
 * groups to the specified tokens in order.
 * 
 * Usage in workflow:
 *   const text = await flow.run(new SetCommand('John Doe, age 30'));
 *   await flow.run(new MatchCommand(text[0], /(\w+) (\w+), age (\d+)/, ['firstName', 'lastName', 'age']));
 */
export class MatchCommand implements ICommand {
  private contentRef: StringRef;
  private regexPattern: string | RegExp;
  private tokens: string[];

  /**
   * Create a new MatchCommand
   * @param contentRef - Reference to the content to match against
   * @param regexPattern - Regular expression pattern (string or RegExp)
   * @param tokens - Array of token names to assign to captured groups
   */
  constructor(contentRef: StringRef, regexPattern: string | RegExp, tokens: string[]) {
    this.contentRef = contentRef;
    this.regexPattern = regexPattern;
    this.tokens = tokens;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    // Get the content from the workflow context
    const content = await context.get(this.contentRef);
    
    if (content === undefined) {
      throw new Error(`Content reference not found: ${this.contentRef.token || this.contentRef.id}`);
    }

    // Convert string pattern to RegExp if needed
    const regex = typeof this.regexPattern === 'string' 
      ? new RegExp(this.regexPattern) 
      : this.regexPattern;

    // Match the regex
    const match = content.match(regex);
    
    if (!match) {
      throw new Error(`No match found for pattern: ${regex}`);
    }

    // Assign captured groups to tokens
    const results: [any, IRefDecorator[]][] = [];
    
    // Start from index 1 to skip the full match (index 0)
    for (let i = 1; i < match.length && i - 1 < this.tokens.length; i++) {
      const value = match[i];
      const token = this.tokens[i - 1];
      
      if (value !== undefined && token) {
        results.push([value, [new TokenDecorator(token)]]);
      }
    }

    return results;
  }
}
