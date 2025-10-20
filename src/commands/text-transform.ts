import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';

/**
 * TextTransformCommand - Transforms string content using a function
 * 
 * This command applies a transformation function to string content from a StringRef.
 * 
 * Usage in workflow:
 *   const text = await flow.run(new SetCommand('hello world'));
 *   const upper = await flow.run(new TextTransformCommand(text[0], (s) => s.toUpperCase()));
 */
export class TextTransformCommand implements ICommand {
  private contentRef: StringRef;
  private transformFn: (input: string) => string;

  /**
   * Create a new TextTransformCommand
   * @param contentRef - Reference to the content to transform
   * @param transformFn - Function to transform the string
   */
  constructor(contentRef: StringRef, transformFn: (input: string) => string) {
    this.contentRef = contentRef;
    this.transformFn = transformFn;
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

    // Apply the transformation
    const result = this.transformFn(content);

    // Return the transformed content
    return [[result, []]];
  }
}
