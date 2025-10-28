import { IAgentConfig } from './base.js';
import { BaseAgentConfigBuilder } from './BaseAgentConfigBuilder.js';

/**
 * Claude-specific model options
 * Based on Claude Code CLI available models as of October 2025
 */
export type ClaudeModel = 
  // Claude 4 models (latest)
  | 'claude-sonnet-4-5-20250929'  // Smartest model for complex agents and coding
  | 'claude-haiku-4-5-20251001'   // Fastest model with near-frontier intelligence
  | 'claude-opus-4-1-20250805'    // Exceptional model for specialized reasoning
  // Aliases (automatically point to latest snapshots)
  | 'claude-sonnet-4-5'           // Alias for latest Sonnet
  | 'claude-haiku-4-5'            // Alias for latest Haiku
  | 'claude-opus-4-1'             // Alias for latest Opus
  // Short aliases
  | 'sonnet'                      // Alias for Sonnet
  | 'haiku'                       // Alias for Haiku
  | 'opus';                       // Alias for Opus

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

  /** Dry-run mode - echo command instead of executing it */
  dryRun?: boolean;

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
export class ClaudeConfigBuilder extends BaseAgentConfigBuilder<ClaudeConfig> {
  constructor() {
    super(new ClaudeConfig());
  }

  withModel(model: ClaudeModel): this {
    this.config.model = model;
    return this;
  }

  allowingAllTools(): this {
    this.config.allowAllTools = true;
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

  withExtendedThinking(): this {
    this.config.extendedThinking = true;
    return this;
  }
}
