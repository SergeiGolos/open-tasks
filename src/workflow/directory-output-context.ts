import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fse from 'fs-extra';
import {
  IWorkflowContext,
  ICommand,
  IMemoryDecorator,
  MemoryRef,
} from './types.js';
import { TimestampedFileNameDecorator } from './decorators.js';

/**
 * Workflow context that writes outputs to timestamped files in a directory
 */
export class DirectoryOutputContext implements IWorkflowContext {
  private memory: Map<string, MemoryRef>;
  private tokenIndex: Map<string, string>;
  private outputDir: string;

  constructor(outputDir: string = '.open-tasks/outputs') {
    this.memory = new Map();
    this.tokenIndex = new Map();
    this.outputDir = outputDir;
  }

  async store(value: any, decorators?: IMemoryDecorator[]): Promise<MemoryRef> {
    const id = uuidv4();
    let ref: MemoryRef = {
      id,
      content: value,
      timestamp: new Date(),
    };

    // Apply decorators
    if (decorators) {
      for (const decorator of decorators) {
        ref = decorator.decorate(ref);
      }
    }

    // If no fileName was set by decorators, create a timestamped one
    if (!ref.fileName) {
      const filenameDecorator = new TimestampedFileNameDecorator(
        ref.token || ref.id
      );
      ref = filenameDecorator.decorate(ref);
    }

    // Ensure output directory exists
    await fse.ensureDir(this.outputDir);

    // Prepare content with metadata if present
    let fileContent =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2);

    // Add metadata as frontmatter if present
    if (ref.metadata && ref.metadata.length > 0) {
      const metadataYaml = this.formatMetadataAsYaml(ref.metadata);
      fileContent = `---\n${metadataYaml}---\n\n${fileContent}`;
    }

    // Write to file
    const filePath = path.join(this.outputDir, ref.fileName!);
    await fs.writeFile(filePath, fileContent, 'utf-8');

    // Store in memory
    this.memory.set(ref.id, ref);

    // Update token index if token is present
    if (ref.token) {
      this.tokenIndex.set(ref.token, ref.id);
    }

    return ref;
  }

  /**
   * Format metadata as YAML frontmatter
   */
  private formatMetadataAsYaml(metadata: any[]): string {
    const lines: string[] = ['transforms:'];
    
    for (const transform of metadata) {
      lines.push(`  - type: ${transform.type}`);
      if (transform.inputs && transform.inputs.length > 0) {
        lines.push(`    inputs: [${transform.inputs.join(', ')}]`);
      }
      if (transform.params && Object.keys(transform.params).length > 0) {
        lines.push(`    params:`);
        for (const [key, value] of Object.entries(transform.params)) {
          const valueStr = typeof value === 'string' 
            ? `"${value}"` 
            : JSON.stringify(value);
          lines.push(`      ${key}: ${valueStr}`);
        }
      }
      lines.push(`    timestamp: ${transform.timestamp.toISOString()}`);
    }
    
    return lines.join('\n') + '\n';
  }

  token(name: string): any {
    const id = this.tokenIndex.get(name);
    if (!id) {
      return undefined;
    }
    const ref = this.memory.get(id);
    return ref?.content;
  }

  async run(command: ICommand): Promise<MemoryRef[]> {
    return await command.execute(this, []);
  }

  /**
   * Get a memory reference by ID or token
   */
  get(idOrToken: string): MemoryRef | undefined {
    let ref = this.memory.get(idOrToken);
    if (ref) {
      return ref;
    }

    const id = this.tokenIndex.get(idOrToken);
    if (id) {
      return this.memory.get(id);
    }

    return undefined;
  }

  /**
   * Load content from a file and create a MemoryRef
   */
  async load(filePath: string, token?: string): Promise<MemoryRef> {
    const content = await fs.readFile(filePath, 'utf-8');
    const id = uuidv4();
    
    const ref: MemoryRef = {
      id,
      content,
      timestamp: new Date(),
      token,
      fileName: path.basename(filePath),
    };

    this.memory.set(id, ref);
    if (token) {
      this.tokenIndex.set(token, id);
    }

    return ref;
  }

  /**
   * Get the output directory path
   */
  getOutputDir(): string {
    return this.outputDir;
  }

  /**
   * List all stored references
   */
  list(): MemoryRef[] {
    return Array.from(this.memory.values());
  }

  /**
   * Clear all stored values
   */
  clear(): void {
    this.memory.clear();
    this.tokenIndex.clear();
  }
}
