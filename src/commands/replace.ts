import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';

/**
 * ReplaceCommand - Performs string replacement on a template
 * 
 * This is a single-responsibility command that replaces placeholders in a template.
 * It can be composed with other commands in a workflow pipeline.
 * 
 * Usage in workflow:
 *   const template = await flow.run(new SetCommand('Hello, {{name}}!'));
 *   const result = await flow.run(new ReplaceCommand(template[0], { name: 'World' }));
 */
export class ReplaceCommand implements ICommand {
  private templateRef: StringRef;
  private replacements: Record<string, string>;

  /**
   * Create a new ReplaceCommand
   * @param templateRef - Reference to the template string
   * @param replacements - Key-value pairs for replacements
   */
  constructor(templateRef: StringRef, replacements: Record<string, string>) {
    this.templateRef = templateRef;
    this.replacements = replacements;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    // Get the template from the workflow context
    const template = await context.get(this.templateRef);
    
    if (template === undefined) {
      throw new Error(`Template reference not found: ${this.templateRef.token || this.templateRef.id}`);
    }

    // Perform replacements
    let result = template;
    for (const [key, value] of Object.entries(this.replacements)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }

    // Return the result with no decorators
    return [[result, []]];
  }
}
