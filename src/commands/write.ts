import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';

/**
 * WriteCommand - Writes content from a StringRef to a file
 * 
 * This command writes the content of a StringRef to a specified file.
 * 
 * Usage in workflow:
 *   const contentRef = await flow.run(new SetCommand('Hello, World!'));
 *   await flow.run(new WriteCommand('output.txt', contentRef[0]));
 */
export class WriteCommand implements ICommand {
  private fileName: string;
  private contentRef: StringRef;

  /**
   * Create a new WriteCommand
   * @param fileName - The name of the file to write to
   * @param contentRef - Reference to the content to write
   */
  constructor(fileName: string, contentRef: StringRef) {
    this.fileName = fileName;
    this.contentRef = contentRef;
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

    // Resolve file path relative to cwd
    const absolutePath = path.isAbsolute(this.fileName)
      ? this.fileName
      : path.join(context.cwd, this.fileName);

    // Ensure directory exists
    await fse.ensureDir(path.dirname(absolutePath));

    // Write to file
    await fs.writeFile(absolutePath, content, 'utf-8');

    // Return the file path as confirmation
    return [[absolutePath, []]];
  }
}
