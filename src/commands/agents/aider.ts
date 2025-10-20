import { IAgentConfig } from './base.js';

/**
 * Configuration for Aider CLI
 * Implements IAgentConfig to define how Aider commands are built and executed
 */
export class AiderConfig implements IAgentConfig {
  /** Model to use (can be from any provider via litellm) */
  model?: string;
  
  /** Files to edit */
  files?: string[];
  
  /** Read-only files for context */
  readFiles?: string[];
  
  /** Working directory for the agent */
  workingDirectory?: string;
  
  /** Auto-commit changes */
  autoCommit?: boolean;
  
  /** Commit message template */
  commitMessage?: string;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Edit format (whole, diff, udiff) */
  editFormat?: 'whole' | 'diff' | 'udiff';
  
  /** Enable repository map */
  useRepoMap?: boolean;

  /**
   * Build command-line arguments for Aider CLI
   */
  buildCommand(prompt: string): { command: string; args: string[] } {
    const args: string[] = ['--message', prompt];
    
    if (this.model) {
      args.push('--model', this.model);
    }
    
    if (this.files && this.files.length > 0) {
      args.push(...this.files);
    }
    
    if (this.readFiles && this.readFiles.length > 0) {
      this.readFiles.forEach(file => {
        args.push('--read', file);
      });
    }
    
    if (this.autoCommit === false) {
      args.push('--no-auto-commits');
    }
    
    if (this.commitMessage) {
      args.push('--commit-prompt', this.commitMessage);
    }
    
    if (this.editFormat) {
      args.push('--edit-format', this.editFormat);
    }
    
    if (this.useRepoMap) {
      args.push('--map-tokens', '2048');
    }

    return { command: 'aider', args };
  }

  /**
   * Get environment variables for Aider
   */
  getEnvironment(): Record<string, string> {
    return {};
  }
}

/**
 * Builder for Aider configuration
 */
export class AiderConfigBuilder {
  private config: AiderConfig = new AiderConfig();

  withModel(model: string): this {
    this.config.model = model;
    return this;
  }

  withFiles(...files: string[]): this {
    this.config.files = [...(this.config.files || []), ...files];
    return this;
  }

  withReadOnlyFiles(...files: string[]): this {
    this.config.readFiles = [...(this.config.readFiles || []), ...files];
    return this;
  }

  inDirectory(dir: string): this {
    this.config.workingDirectory = dir;
    return this;
  }

  withAutoCommit(message?: string): this {
    this.config.autoCommit = true;
    this.config.commitMessage = message;
    return this;
  }

  withoutAutoCommit(): this {
    this.config.autoCommit = false;
    return this;
  }

  withTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  withEditFormat(format: 'whole' | 'diff' | 'udiff'): this {
    this.config.editFormat = format;
    return this;
  }

  withRepoMap(): this {
    this.config.useRepoMap = true;
    return this;
  }

  build(): AiderConfig {
    return this.config;
  }
}
