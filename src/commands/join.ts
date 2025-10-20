import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';

/**
 * JoinCommand - Joins an array of strings and StringRefs into a single string
 * 
 * This command takes an array of mixed strings and StringRefs and concatenates
 * them into a single string.
 * 
 * Usage in workflow:
 *   const part1 = await flow.run(new SetCommand('Hello'));
 *   const part2 = await flow.run(new SetCommand('World'));
 *   const joined = await flow.run(new JoinCommand([part1[0], ' ', part2[0]]));
 */
export class JoinCommand implements ICommand {
  private parts: (string | StringRef)[];

  /**
   * Create a new JoinCommand
   * @param parts - Array of strings and StringRefs to join
   */
  constructor(parts: (string | StringRef)[]) {
    this.parts = parts;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    const resolvedParts: string[] = [];

    // Resolve each part
    for (const part of this.parts) {
      if (typeof part === 'string') {
        // Direct string
        resolvedParts.push(part);
      } else {
        // StringRef - get from context
        const content = await context.get(part);
        if (content === undefined) {
          throw new Error(`Reference not found: ${part.token || part.id}`);
        }
        resolvedParts.push(content);
      }
    }

    // Join all parts
    const result = resolvedParts.join('');

    // Return the joined string
    return [[result, []]];
  }
}
