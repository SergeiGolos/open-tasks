import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';
import { TokenDecorator } from '../decorators.js';

/**
 * SetCommand - Stores a value in the workflow context
 * 
 * This is a single-responsibility command that only stores values.
 * It can be composed with other commands in a workflow pipeline.
 * 
 * Usage in workflow:
 *   const results = await flow.run(new SetCommand('Hello, World!'));
 *   const results = await flow.run(new SetCommand('value', 'my-token'));
 */
export class SetCommand implements ICommand {
  private value: any;
  private token?: string;

  /**
   * Create a new SetCommand
   * @param value - The value to store
   * @param token - Optional token to reference this value
   */
  constructor(value: any, token?: string) {
    this.value = value;
    this.token = token;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    // Return the value with optional token decorator
    const decorators: IRefDecorator[] = this.token 
      ? [new TokenDecorator(this.token)] 
      : [];
    
    return [[this.value, decorators]];
  }
}
