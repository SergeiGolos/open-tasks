import { promises as fs } from 'fs';
import path from 'path';
import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';
import { resolvePath } from '../utils.js';

/**
 * ReadCommand - Reads a file and stores its content
 * 
 * This command reads content from a file and stores it in the workflow context.
 * 
 * Usage in workflow:
 *   const fileRef = await flow.run(new ReadCommand('data.txt'));
 */
export class ReadCommand implements ICommand {
  private fileName: string;

  /**
   * Create a new ReadCommand
   * @param fileName - The name of the file to read
   */
  constructor(fileName: string) {
    this.fileName = fileName;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    // Resolve file path relative to cwd
    const absolutePath = resolvePath(this.fileName, context.cwd);

    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch (error) {
      throw new Error(`File not found: ${this.fileName}`);
    }

    // Read file content
    const content = await fs.readFile(absolutePath, 'utf-8');

    // Return the content with no decorators
    return [[content, []]];
  }
}
