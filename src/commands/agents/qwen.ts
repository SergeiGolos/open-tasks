import { IAgentConfig } from './base.js';

/**
 * Configuration for Qwen Code CLI
 * Implements IAgentConfig to define how Qwen commands are built and executed
 */
export class QwenConfig implements IAgentConfig {
  /** Specific Qwen model */
  model?: 'qwen3-coder' | 'qwen-coder-plus' | 'qwen-coder-turbo';
  
  /** Additional file paths to include as context */
  contextFiles?: string[];
  
  /** Working directory for the agent */
  workingDirectory?: string;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Enable planning mode */
  planningMode?: boolean;

  /** Dry-run mode - echo command instead of executing it */
  dryRun?: boolean;

  /**
   * Build command-line arguments for Qwen Code CLI
   */
  buildCommand(prompt: string): { command: string; args: string[] } {
    const args: string[] = ['-p', prompt];
    
    if (this.model) {
      args.push('--model', this.model);
    }
    
    if (this.contextFiles && this.contextFiles.length > 0) {
      args.push(...this.contextFiles);
    }
    
    if (this.planningMode) {
      args.push('--plan');
    }

    return { command: 'qwen', args };
  }

  /**
   * Get environment variables for Qwen
   */
  getEnvironment(): Record<string, string> {
    return {};
  }
}

/**
 * Builder for Qwen configuration
 */
export class QwenConfigBuilder {
  private config: QwenConfig = new QwenConfig();

  withModel(model: 'qwen3-coder' | 'qwen-coder-plus' | 'qwen-coder-turbo'): this {
    this.config.model = model;
    return this;
  }

  withContextFiles(...files: string[]): this {
    this.config.contextFiles = [...(this.config.contextFiles || []), ...files];
    return this;
  }

  inDirectory(dir: string): this {
    this.config.workingDirectory = dir;
    return this;
  }

  withTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  withPlanningMode(): this {
    this.config.planningMode = true;
    return this;
  }

  withDryRun(): this {
    this.config.dryRun = true;
    return this;
  }

  build(): QwenConfig {
    return this.config;
  }
}
