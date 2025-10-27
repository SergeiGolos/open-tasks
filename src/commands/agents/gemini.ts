import { IAgentConfig } from './base.js';
import { BaseAgentConfigBuilder } from './BaseAgentConfigBuilder.js';

/**
 * Gemini-specific model options
 */
export type GeminiModel = 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-pro' | 'gemini-flash';

/**
 * Configuration for Gemini CLI
 * Implements IAgentConfig to define how Gemini commands are built and executed
 */
export class GeminiConfig implements IAgentConfig {
  /** Specific Gemini model */
  model?: GeminiModel;
  
  /** Additional file paths to include as context */
  contextFiles?: string[];
  
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
  
  /** Enable Google Search grounding */
  enableSearch?: boolean;

  /** Dry-run mode - echo command instead of executing it */
  dryRun?: boolean;

  /**
   * Build command-line arguments for Gemini CLI
   */
  buildCommand(prompt: string): { command: string; args: string[] } {
    const args: string[] = ['-p', prompt];
    
    if (this.model) {
      args.push('--model', this.model);
    }
    
    if (this.contextFiles && this.contextFiles.length > 0) {
      args.push(...this.contextFiles);
    }
    
    if (this.temperature !== undefined) {
      args.push('--temperature', this.temperature.toString());
    }
    
    if (this.maxTokens !== undefined) {
      args.push('--max-tokens', this.maxTokens.toString());
    }
    
    if (this.enableSearch) {
      args.push('--search');
    }

    return { command: 'gemini', args };
  }

  /**
   * Get environment variables for Gemini
   */
  getEnvironment(): Record<string, string> {
    const env: Record<string, string> = {};
    if (this.apiKey) {
      env.GEMINI_API_KEY = this.apiKey;
    }
    return env;
  }
}

/**
 * Builder for Gemini configuration
 */
export class GeminiConfigBuilder extends BaseAgentConfigBuilder<GeminiConfig> {
  constructor() {
    super(new GeminiConfig());
  }

  withModel(model: GeminiModel): this {
    this.config.model = model;
    return this;
  }

  withContextFiles(...files: string[]): this {
    this.config.contextFiles = [...(this.config.contextFiles || []), ...files];
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

  enableSearch(): this {
    this.config.enableSearch = true;
    return this;
  }
}
