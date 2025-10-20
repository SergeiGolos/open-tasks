/**
 * Agent Configuration Loading Examples
 * 
 * Demonstrates how to load agent configurations from .config.json files
 * instead of manually building them in code.
 */

import { loadConfig } from '../src/config-loader.js';
import { 
  loadAgentConfig, 
  loadAgentConfigByName, 
  getAvailableAgentConfigs,
  AgentConfigDefinition 
} from '../src/commands/agents/config-loader.js';
import { AgentCommand } from '../src/commands/agents/agent.js';
import { StringRef, IFlow } from '../src/types.js';

/**
 * Example 1: Load a specific agent config by name
 */
async function loadAgentByName(context: IFlow) {
  // Load the full configuration
  const config = await loadConfig(context.cwd);
  
  // Load a specific agent configuration by name
  const geminiConfig = loadAgentConfigByName(config, 'gemini-default');
  
  // Create the command with the loaded config
  const command = new AgentCommand(geminiConfig, []);
  
  // Execute with a prompt
  const results = await command.execute(
    context,
    ['Explain how TypeScript generics work'],
    undefined
  );
  
  console.log('Results:', results);
}

/**
 * Example 2: List all available agent configurations
 */
async function listAvailableAgents(context: IFlow) {
  const config = await loadConfig(context.cwd);
  
  const agents = getAvailableAgentConfigs(config);
  
  console.log('Available agent configurations:');
  agents.forEach(name => {
    console.log(`  - ${name}`);
  });
}

/**
 * Example 3: Load agent with StringRef inputs
 */
async function loadAgentWithRefs(context: IFlow, refs: StringRef[]) {
  const config = await loadConfig(context.cwd);
  
  // Load the research-optimized Gemini config
  const geminiResearch = loadAgentConfigByName(config, 'gemini-research');
  
  // Create command with StringRef inputs
  const command = new AgentCommand(geminiResearch, refs);
  
  // Execute - the StringRefs will be joined and added to the prompt
  const results = await command.execute(
    context,
    ['Summarize the key points from these documents'],
    undefined
  );
  
  return results;
}

/**
 * Example 4: Load different agents for different tasks
 */
async function useMultipleAgents(context: IFlow) {
  const config = await loadConfig(context.cwd);
  
  // Use Claude with thinking mode for complex analysis
  const claudeThinking = loadAgentConfigByName(config, 'claude-thinking');
  const analysisCommand = new AgentCommand(claudeThinking, []);
  
  const analysisResults = await analysisCommand.execute(
    context,
    ['Analyze the architectural trade-offs of microservices vs monoliths'],
    undefined
  );
  
  // Use fast Gemini for simple code generation
  const geminiDefault = loadAgentConfigByName(config, 'gemini-default');
  const codeCommand = new AgentCommand(geminiDefault, []);
  
  const codeResults = await codeCommand.execute(
    context,
    ['Write a TypeScript function to validate email addresses'],
    undefined
  );
  
  return { analysis: analysisResults, code: codeResults };
}

/**
 * Example 5: Manually load from config definition
 */
async function loadFromDefinition() {
  const definition: AgentConfigDefinition = {
    name: 'custom-gemini',
    type: 'gemini',
    timeout: 180000,
    workingDirectory: './workspace',
    config: {
      model: 'gemini-1.5-flash',
      enableSearch: true,
      contextFiles: ['README.md', 'docs/**/*.md']
    }
  };
  
  const agentConfig = loadAgentConfig(definition);
  
  // Now you can use it with AgentCommand
  console.log('Created custom config:', agentConfig);
}

/**
 * Example 6: Dynamic agent selection based on task type
 */
async function selectAgentByTask(
  context: IFlow, 
  taskType: 'analyze' | 'code' | 'research' | 'edit'
) {
  const config = await loadConfig(context.cwd);
  
  let agentName: string;
  
  switch (taskType) {
    case 'analyze':
      agentName = 'claude-thinking';
      break;
    case 'code':
      agentName = 'gemini-default';
      break;
    case 'research':
      agentName = 'gemini-research';
      break;
    case 'edit':
      agentName = 'aider-simple';
      break;
  }
  
  const agentConfig = loadAgentConfigByName(config, agentName);
  const command = new AgentCommand(agentConfig, []);
  
  console.log(`Using agent '${agentName}' for ${taskType} task`);
  
  return command;
}

/**
 * Example 7: Error handling for missing configs
 */
async function safeLoadAgent(context: IFlow, agentName: string) {
  try {
    const config = await loadConfig(context.cwd);
    const agentConfig = loadAgentConfigByName(config, agentName);
    return new AgentCommand(agentConfig, []);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        console.error(`Agent configuration '${agentName}' not found`);
        console.log('Available agents:');
        const config = await loadConfig(context.cwd);
        const agents = getAvailableAgentConfigs(config);
        agents.forEach(name => console.log(`  - ${name}`));
      } else if (error.message.includes('No agent configurations')) {
        console.error('No agent configurations found in .config.json');
        console.log('Add an "agents" array to your .config.json file');
      } else {
        console.error('Error loading agent:', error.message);
      }
    }
    throw error;
  }
}

// Export examples for use in tests or other modules
export {
  loadAgentByName,
  listAvailableAgents,
  loadAgentWithRefs,
  useMultipleAgents,
  loadFromDefinition,
  selectAgentByTask,
  safeLoadAgent
};
