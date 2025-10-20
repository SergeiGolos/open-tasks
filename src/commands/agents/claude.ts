import { IAgentConfig } from './base.js';

/**
 * Claude-specific model options
 */
export type ClaudeModel = 
  | 'claude-3.7-sonnet' 
  | 'claude-3.5-sonnet' 
  | 'claude-3-sonnet' 
  | 'claude-3-opus'
  | 'claude-3-haiku';

/**
 * Configuration for Claude Code CLI
 * Implements IAgentConfig to define how Claude commands are built and executed
 */
export class ClaudeConfig implements IAgentConfig {
  /** Specific Claude model */
  model?: ClaudeModel;
  
  /** Allow all tools without prompting */
  allowAllTools?: boolean;
  
  /** Working directory for the agent */
  workingDirectory?: string;
  
  /** Temperature for model responses (0.0 to 1.0) */
  temperature?: number;
  
  /** Maximum tokens for response */
  maxTokens?: number;
  
  /** API key */
  apiKey?: string;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Enable extended thinking mode */
  extendedThinking?: boolean;

  /**
   * Build command-line arguments for Claude Code CLI
   */
  buildCommand(prompt: string): { command: string; args: string[] } {
    const args: string[] = ['-p', prompt];
    
    if (this.allowAllTools) {
      args.push('--allow-all-tools');
    }
    
    if (this.model) {
      args.push('--model', this.model);
    }
    
    if (this.temperature !== undefined) {
      args.push('--temperature', this.temperature.toString());
    }
    
    if (this.maxTokens !== undefined) {
      args.push('--max-tokens', this.maxTokens.toString());
    }
    
    if (this.extendedThinking) {
      args.push('--thinking');
    }

    return { command: 'claude', args };
  }

  /**
   * Get environment variables for Claude
   */
  getEnvironment(): Record<string, string> {
    const env: Record<string, string> = {};
    if (this.apiKey) {
      env.ANTHROPIC_API_KEY = this.apiKey;
    }
    return env;
  }
}

/**
 * Builder for Claude configuration
 */
export class ClaudeConfigBuilder {
  private config: ClaudeConfig = new ClaudeConfig();

  withModel(model: ClaudeModel): this {
    this.config.model = model;
    return this;
  }

  allowingAllTools(): this {
    this.config.allowAllTools = true;
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

  withMaxTokens(tokens: number): this {
    this.config.maxTokens = tokens;
    return this;
  }

  withApiKey(key: string): this {
    this.config.apiKey = key;
    return this;
  }

  withTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  withExtendedThinking(): this {
    this.config.extendedThinking = true;
    return this;
  }

  build(): ClaudeConfig {
    return this.config;
  }
}
