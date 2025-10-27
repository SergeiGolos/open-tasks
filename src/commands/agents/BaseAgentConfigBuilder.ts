import { IAgentConfig } from './base.js';

/**
 * Base class for agent configuration builders
 * Provides common builder methods to reduce code duplication across agent builders
 * 
 * @template T - The specific agent config type
 */
export abstract class BaseAgentConfigBuilder<T extends IAgentConfig> {
  protected config: T;

  constructor(config: T) {
    this.config = config;
  }

  /**
   * Set the working directory for the agent
   */
  inDirectory(dir: string): this {
    this.config.workingDirectory = dir;
    return this;
  }

  /**
   * Set the timeout in milliseconds
   */
  withTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  /**
   * Enable dry-run mode (echo command instead of executing)
   */
  withDryRun(): this {
    this.config.dryRun = true;
    return this;
  }

  /**
   * Build and return the configuration
   */
  build(): T {
    return this.config;
  }
}
