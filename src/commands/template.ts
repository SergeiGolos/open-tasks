import { promises as fs } from 'fs';
import path from 'path';
import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';

/**
 * TemplateCommand - Processes templates with token replacement
 * 
 * This command reads a template (from file or StringRef) and performs token lookup
 * and replacement using values from the IFlow context.
 * 
 * Usage in workflow:
 *   // From file
 *   const result = await flow.run(new TemplateCommand('template.html'));
 *   
 *   // From StringRef
 *   const templateRef = await flow.run(new SetCommand('Hello {{name}}!'));
 *   const result = await flow.run(new TemplateCommand(templateRef[0]));
 */
export class TemplateCommand implements ICommand {
  private source: string | StringRef;

  /**
   * Create a new TemplateCommand
   * @param source - Either a filename or a StringRef to process as template
   */
  constructor(source: string | StringRef) {
    this.source = source;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    let template: string;

    // Determine if source is a filename or StringRef
    // StringRef has an 'id' property, regular strings don't
    if (typeof this.source === 'string') {
      // It's a string - could be a template string or a filename
      // Try to read as file first, if it fails, treat as template string
      const absolutePath = path.isAbsolute(this.source)
        ? this.source
        : path.join(context.cwd, this.source);

      try {
        await fs.access(absolutePath);
        template = await fs.readFile(absolutePath, 'utf-8');
      } catch (error) {
        // Not a file, treat as template string directly
        template = this.source;
      }
    } else {
      // Get from StringRef
      const content = await context.get(this.source);
      if (content === undefined) {
        throw new Error(`Template reference not found: ${this.source.token || this.source.id}`);
      }
      template = content;
    }

    // Process template - find all {{token}} patterns and replace with values from context
    let result = template;
    
    // Find all {{token}} patterns
    const tokenPattern = /\{\{([^}]+)\}\}/g;
    const matches = template.matchAll(tokenPattern);
    
    for (const match of matches) {
      const tokenName = match[1].trim();
      
      // Try to get the token from context
      // Check if context has a Tokens map (DirectoryOutputContext does)
      if ('Tokens' in context && context.Tokens instanceof Map) {
        const tokenRef = context.Tokens.get(tokenName);
        if (tokenRef) {
          const tokenValue = await context.get(tokenRef);
          if (tokenValue !== undefined) {
            result = result.replace(match[0], tokenValue);
          }
        }
      }
    }

    // Return the processed template
    return [[result, []]];
  }
}
