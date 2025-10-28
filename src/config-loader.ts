import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { AgentTool } from './commands/agent.js';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  outputDir: '.open-tasks/logs',
  customCommandsDir: ['.open-tasks', path.join(os.homedir(), '.open-tasks')],
  timestampFormat: 'YYYYMMDD-HHmmss-SSS',
  defaultFileExtension: 'txt',
  colors: true,
};

/**
 * Load configuration from files and merge with defaults
 */
export async function loadConfig(cwd: string): Promise<Record<string, any>> {
  let config = { ...DEFAULT_CONFIG };

  // Try to load user-level config
  try {
    const userConfigPath = path.join(os.homedir(), '.open-tasks', '.config.json');
    const userConfigData = await fs.readFile(userConfigPath, 'utf-8');
    const userConfig = JSON.parse(userConfigData);
    config = { ...config, ...userConfig };
  } catch (error) {
    // User config doesn't exist, that's okay
  }

  // Try to load project-level config
  try {
    const projectConfigPath = path.join(cwd, '.open-tasks', '.config.json');
    const projectConfigData = await fs.readFile(projectConfigPath, 'utf-8');
    const projectConfig = JSON.parse(projectConfigData);
    config = { ...config, ...projectConfig };
  } catch (error) {
    // Project config doesn't exist, that's okay
  }

  return config;
}

/**
 * Get the default configuration
 */
export function getDefaultConfig(): Record<string, any> {
  return { ...DEFAULT_CONFIG };
}

/**
 * Get default agent from configuration
 */
export function getDefaultAgent(config: Record<string, any>): string {
  if (config.agents && Array.isArray(config.agents) && config.agents.length > 0) {
    return config.agents[0].name;
  }
  return 'gemini-default';
}

/**
 * Get agent configuration from config
 */
export function getAgentConfig(config: Record<string, any>, agentName: string): any {
  if (!config.agents || !Array.isArray(config.agents)) {
    return null;
  }

  const agentDef = config.agents.find((a: any) => a.name === agentName);
  if (!agentDef) {
    return null;
  }

  // Map agent type to AgentTool enum
  const toolMap: Record<string, AgentTool> = {
    'gemini': AgentTool.GEMINI,
    'claude': AgentTool.CLAUDE,
    'copilot': AgentTool.COPILOT,
    'aider': AgentTool.AIDER,
    'qwen': AgentTool.QWEN,
    'llm': AgentTool.LLM,
  };

  const tool = toolMap[agentDef.type];
  if (!tool) {
    return null;
  }

  return {
    tool,
    model: agentDef.config?.model,
    timeout: agentDef.timeout || 300000,
    nonInteractive: true,
    allowAllTools: agentDef.config?.allowAllTools !== false,
    ...agentDef.config,
  };
}

/**
 * List available agents from configuration
 */
export function listAvailableAgents(config: Record<string, any>): string[] {
  if (!config.agents || !Array.isArray(config.agents)) {
    return [];
  }
  return config.agents.map((a: any) => a.name);
}
