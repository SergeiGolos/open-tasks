// Base interfaces
export { IAgentConfig, executeAgent } from './base.js';

// Generic agent command
export { AgentCommand } from './agent.js';

// Agent configurations and builders
export { GeminiConfig, GeminiConfigBuilder, type GeminiModel } from './gemini.js';
export { ClaudeConfig, ClaudeConfigBuilder, type ClaudeModel } from './claude.js';
export { CopilotConfig, CopilotConfigBuilder, type CopilotModel } from './copilot.js';
export { AiderConfig, AiderConfigBuilder } from './aider.js';
export { QwenConfig, QwenConfigBuilder } from './qwen.js';
export { LlmConfig, LlmConfigBuilder } from './llm.js';

// Configuration loader
export { 
  loadAgentConfig, 
  loadAgentConfigByName, 
  getAvailableAgentConfigs,
  type AgentConfigDefinition,
  type GeminiConfigOptions,
  type ClaudeConfigOptions,
  type CopilotConfigOptions,
  type AiderConfigOptions,
  type QwenConfigOptions,
  type LlmConfigOptions
} from './config-loader.js';
