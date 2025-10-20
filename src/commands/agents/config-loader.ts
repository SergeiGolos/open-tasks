import { IAgentConfig } from './base.js';
import { GeminiConfig, GeminiConfigBuilder } from './gemini.js';
import { ClaudeConfig, ClaudeConfigBuilder } from './claude.js';
import { CopilotConfig, CopilotConfigBuilder } from './copilot.js';
import { AiderConfig, AiderConfigBuilder } from './aider.js';
import { QwenConfig, QwenConfigBuilder } from './qwen.js';
import { LlmConfig, LlmConfigBuilder } from './llm.js';

/**
 * Agent configuration stored in .config.json
 */
export interface AgentConfigDefinition {
  /** Name/identifier for this agent configuration */
  name: string;
  
  /** Type of agent */
  type: 'gemini' | 'claude' | 'copilot' | 'aider' | 'qwen' | 'llm';
  
  /** Working directory */
  workingDirectory?: string;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Tool-specific configuration */
  config: GeminiConfigOptions | ClaudeConfigOptions | CopilotConfigOptions | 
          AiderConfigOptions | QwenConfigOptions | LlmConfigOptions;
}

/** Gemini-specific configuration options */
export interface GeminiConfigOptions {
  model?: string;
  contextFiles?: string[];
  enableSearch?: boolean;
  apiKey?: string;
}

/** Claude-specific configuration options */
export interface ClaudeConfigOptions {
  model?: string;
  allowAllTools?: boolean;
  enableThinking?: boolean;
}

/** Copilot-specific configuration options */
export interface CopilotConfigOptions {
  model?: string;
  allowAllTools?: boolean;
}

/** Aider-specific configuration options */
export interface AiderConfigOptions {
  files?: string[];
  noAutoCommits?: boolean;
  model?: string;
}

/** Qwen-specific configuration options */
export interface QwenConfigOptions {
  enablePlan?: boolean;
  model?: 'qwen3-coder' | 'qwen-coder-plus' | 'qwen-coder-turbo';
}

/** llm-specific configuration options */
export interface LlmConfigOptions {
  model?: string;
  temperature?: number;
  system?: string;
}

/**
 * Load an IAgentConfig from a configuration definition
 * @param definition - The agent configuration definition
 * @returns Configured IAgentConfig instance
 */
export function loadAgentConfig(definition: AgentConfigDefinition): IAgentConfig {
  let config: IAgentConfig;
  
  switch (definition.type) {
    case 'gemini': {
      const options = definition.config as GeminiConfigOptions;
      const builder = new GeminiConfigBuilder();
      
      if (options.model) builder.withModel(options.model as any);
      if (options.contextFiles) builder.withContextFiles(...options.contextFiles);
      if (options.enableSearch) builder.enableSearch();
      if (options.apiKey) builder.withApiKey(options.apiKey);
      if (definition.timeout) builder.withTimeout(definition.timeout);
      if (definition.workingDirectory) builder.inDirectory(definition.workingDirectory);
      
      config = builder.build();
      break;
    }
    
    case 'claude': {
      const options = definition.config as ClaudeConfigOptions;
      const builder = new ClaudeConfigBuilder();
      
      if (options.model) builder.withModel(options.model as any);
      if (options.allowAllTools) builder.allowingAllTools();
      if (options.enableThinking) builder.withExtendedThinking();
      if (definition.timeout) builder.withTimeout(definition.timeout);
      if (definition.workingDirectory) builder.inDirectory(definition.workingDirectory);
      
      config = builder.build();
      break;
    }
    
    case 'copilot': {
      const options = definition.config as CopilotConfigOptions;
      const builder = new CopilotConfigBuilder();
      
      if (options.model) builder.withModel(options.model as any);
      if (options.allowAllTools) builder.allowingAllTools();
      if (definition.timeout) builder.withTimeout(definition.timeout);
      if (definition.workingDirectory) builder.inDirectory(definition.workingDirectory);
      
      config = builder.build();
      break;
    }
    
    case 'aider': {
      const options = definition.config as AiderConfigOptions;
      const builder = new AiderConfigBuilder();
      
      if (options.files) builder.withFiles(...options.files);
      if (options.noAutoCommits) builder.withoutAutoCommit();
      if (options.model) builder.withModel(options.model);
      if (definition.timeout) builder.withTimeout(definition.timeout);
      if (definition.workingDirectory) builder.inDirectory(definition.workingDirectory);
      
      config = builder.build();
      break;
    }
    
    case 'qwen': {
      const options = definition.config as QwenConfigOptions;
      const builder = new QwenConfigBuilder();
      
      if (options.enablePlan) builder.withPlanningMode();
      if (options.model) builder.withModel(options.model as any);
      if (definition.timeout) builder.withTimeout(definition.timeout);
      if (definition.workingDirectory) builder.inDirectory(definition.workingDirectory);
      
      config = builder.build();
      break;
    }
    
    case 'llm': {
      const options = definition.config as LlmConfigOptions;
      const builder = new LlmConfigBuilder();
      
      if (options.model) builder.withModel(options.model);
      if (options.temperature !== undefined) builder.withTemperature(options.temperature);
      if (options.system) builder.withSystem(options.system);
      if (definition.timeout) builder.withTimeout(definition.timeout);
      if (definition.workingDirectory) builder.inDirectory(definition.workingDirectory);
      
      config = builder.build();
      break;
    }
    
    default:
      throw new Error(`Unknown agent type: ${(definition as any).type}`);
  }
  
  return config;
}

/**
 * Load an IAgentConfig by name from the configuration object
 * @param config - The full configuration object
 * @param name - Name of the agent configuration to load
 * @returns Configured IAgentConfig instance
 * @throws Error if agent configuration not found
 */
export function loadAgentConfigByName(config: Record<string, any>, name: string): IAgentConfig {
  const agentConfigs = config.agents as AgentConfigDefinition[] | undefined;
  
  if (!agentConfigs || !Array.isArray(agentConfigs)) {
    throw new Error('No agent configurations found in config');
  }
  
  const definition = agentConfigs.find(a => a.name === name);
  
  if (!definition) {
    throw new Error(`Agent configuration '${name}' not found`);
  }
  
  return loadAgentConfig(definition);
}

/**
 * Get all available agent configuration names
 * @param config - The full configuration object
 * @returns Array of agent configuration names
 */
export function getAvailableAgentConfigs(config: Record<string, any>): string[] {
  const agentConfigs = config.agents as AgentConfigDefinition[] | undefined;
  
  if (!agentConfigs || !Array.isArray(agentConfigs)) {
    return [];
  }
  
  return agentConfigs.map(a => a.name);
}
