import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';

/**
 * JsonTransformCommand - Transforms JSON content using a function
 * 
 * This command parses JSON from a StringRef, applies a transformation function,
 * and returns the result. If the result is a string, it's returned as-is.
 * Otherwise, it's JSON-serialized.
 * 
 * Usage in workflow:
 *   const jsonRef = await flow.run(new SetCommand('{"name": "John", "age": 30}'));
 *   const transformed = await flow.run(new JsonTransformCommand(jsonRef[0], (obj) => obj.name));
 */
export class JsonTransformCommand implements ICommand {
  private contentRef: StringRef;
  private transformFn: (input: any) => any;

  /**
   * Create a new JsonTransformCommand
   * @param contentRef - Reference to the JSON content to transform
   * @param transformFn - Function to transform the parsed JSON
   */
  constructor(contentRef: StringRef, transformFn: (input: any) => any) {
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

    // Parse JSON
    let parsedContent: any;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Apply the transformation
    const result = this.transformFn(parsedContent);

    // If result is a string, return as-is; otherwise, JSON-serialize
    const finalResult = typeof result === 'string' 
      ? result 
      : JSON.stringify(result, null, 2);

    // Return the transformed content
    return [[finalResult, []]];
  }
}
