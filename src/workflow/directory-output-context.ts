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
  private memory: Map<string, StringRef>;
  private tokenIndex: Map<string, string>;
  private outputDir: string;

  constructor(outputDir: string = '.open-tasks/outputs') {
    this.memory = new Map();
    this.tokenIndex = new Map();
    this.outputDir = outputDir;
  }

  private async store(value: any, decorators?: IRefDecorator[]): Promise<StringRef> {
    const id = uuidv4();
    let ref: StringRef = {
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

  async with(command: ICommand): Promise<StringRef[]> {
    return await command.execute(this, []);
  }
  
  
  /**
   * Clear all stored values
   */
  clear(): void {
    this.memory.clear();
    this.tokenIndex.clear();
  }
}
