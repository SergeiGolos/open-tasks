import { IAgentConfig } from './base.js';

/**
 * Configuration for llm CLI
 * Implements IAgentConfig to define how llm commands are built and executed
 */
export class LlmConfig implements IAgentConfig {
  /** Model to use (any model supported by llm) */
  model?: string;
  
  /** Working directory for the agent */
  workingDirectory?: string;
  
  /** Temperature for model responses (0.0 to 1.0) */
  temperature?: number;
  
  /** System prompt */
  system?: string;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Stream output */
  stream?: boolean;

  /** Dry-run mode - echo command instead of executing it */
  dryRun?: boolean;

  /**
   * Build command-line arguments for llm CLI
   */
  buildCommand(prompt: string): { command: string; args: string[] } {
    const args: string[] = [prompt];
    
    if (this.model) {
      args.unshift('-m', this.model);
    }
    
    if (this.temperature !== undefined) {
      args.unshift('--temperature', this.temperature.toString());
    }
    
    if (this.system) {
      args.unshift('--system', this.system);
    }
    
    if (this.stream) {
      args.unshift('--stream');
    }

    return { command: 'llm', args };
  }

  /**
   * Get environment variables for llm
   */
  getEnvironment(): Record<string, string> {
    return {};
  }
}

/**
 * Builder for llm configuration
 */
export class LlmConfigBuilder {
  private config: LlmConfig = new LlmConfig();

  withModel(model: string): this {
    this.config.model = model;
    return this;
  }

  inDirectory(dir: string): this {
    this.config.workingDirectory = dir;
    return this;
  }

  withTemperature(temp: number): this {
    this.config.temperature = temp;
    return this;
  }

  withSystem(system: string): this {
    this.config.system = system;
    return this;
  }

  withTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  withStreaming(): this {
    this.config.stream = true;
    return this;
  }

  withDryRun(): this {
    this.config.dryRun = true;
    return this;
  }

  build(): LlmConfig {
    return this.config;
  }
}
