import { IAgentConfig } from './base.js';

/**
 * GitHub Copilot model options
 */
export type CopilotModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-5' | 'claude-sonnet-4.5';

/**
 * Configuration for GitHub Copilot CLI
 * Implements IAgentConfig to define how Copilot commands are built and executed
 */
export class CopilotConfig implements IAgentConfig {
  /** Specific model */
  model?: CopilotModel;
  
  /** Allow all tools without prompting */
  allowAllTools?: boolean;
  
  /** Working directory for the agent */
  workingDirectory?: string;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Use AGENTS.md file for project context */
  useAgentsFile?: boolean;

  /**
   * Build command-line arguments for GitHub Copilot CLI
   */
  buildCommand(prompt: string): { command: string; args: string[] } {
    const args: string[] = ['-p', prompt];
    
    if (this.allowAllTools) {
      args.push('--allow-all-tools');
    }
    
    if (this.model) {
      args.push('--model', this.model);
    }

    return { command: 'copilot', args };
  }

  /**
   * Get environment variables for Copilot
   */
  getEnvironment(): Record<string, string> {
    return {};
  }
}

/**
 * Builder for Copilot configuration
 */
export class CopilotConfigBuilder {
  private config: CopilotConfig = new CopilotConfig();

  withModel(model: CopilotModel): this {
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

  withTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  withAgentsFile(): this {
    this.config.useAgentsFile = true;
    return this;
  }

  build(): CopilotConfig {
    return this.config;
  }
}
