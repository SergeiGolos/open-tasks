import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fse from 'fs-extra';
import {
  IFlow,
  ICommand,
  IRefDecorator,
  StringRef,
} from './types.js';
import { TimestampedFileNameDecorator } from './decorators.js';

/**
 * Workflow context that writes outputs to timestamped files in a directory
 */
export class DirectoryOutputContext implements IFlow {
  public Tokens: Map<string, StringRef>;
  private outputDir: string;
  public verbosity?: string;
  public config?: Record<string, any>;

  constructor(public cwd: string, outputDir: string = '.open-tasks/logs', verbosity: string = 'summary', config?: Record<string, any>) {
    this.outputDir = outputDir;
    this.Tokens = new Map();
    this.verbosity = verbosity;
    this.config = config;
  }

  public async set(value: any, decorators?: IRefDecorator[]): Promise<StringRef> {
    const id = uuidv4();
    let ref: StringRef = {
      id,
      fileName: `${id}.txt`,
      timestamp: new Date(),
    };

    // Apply decorators
    if (decorators) {
      for (const decorator of decorators) {
        ref = decorator.decorate(ref);
      }
    }

    // Ensure output directory exists
    await fse.ensureDir(this.outputDir);

    // Prepare content
    const fileContent =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2);

    // Write to file
    const filePath = path.join(this.outputDir, ref.fileName!);
    await fs.writeFile(filePath, fileContent, 'utf-8');   

    // Update token index if token is present
    if (ref.token) {
      this.Tokens.set(ref.token, ref);
    }

    return ref;
  }

  public async get(ref: StringRef): Promise<string | undefined> {
    // Read from file
    if (!ref.fileName) {
      throw new Error(`Cannot get reference: fileName is missing. Ref ID: ${ref.id}, Token: ${ref.token || 'none'}`);
    }
    const filePath = path.join(this.outputDir, ref.fileName);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      return undefined;
    }
  }

  async run(command: ICommand): Promise<StringRef[]> {
    // Execute the command
    const results = await command.execute(this, []) as any as [any, IRefDecorator[]][];    
    // Results should be array of [value, decorators[]] tuples
    const refs: StringRef[] = [];
    for (const [value, decorators] of results) {     
        const ref = await this.set(value, decorators);
        refs.push(ref);    
    }
    
    return refs;
  }
  
  
  /**
   * Clear all stored values
   */
  clear(): void {    
    this.Tokens.clear();
  }
}
