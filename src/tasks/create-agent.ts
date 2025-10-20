import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { ExecutionContext, ReferenceHandle, ITaskHandler, IFlow } from '../types.js';
import { MessageCard } from '../cards/MessageCard.js';
import { QuestionCommand } from '../commands/question.js';
import { SetCommand } from '../commands/set.js';
import { AgentCommand, AgentTool } from '../commands/agent.js';
import { WriteCommand } from '../commands/write.js';
import { JoinCommand } from '../commands/join.js';

/**
 * CreateAgent command - scaffolds a new agent task using AI-assisted workflow
 */
export default class CreateAgentCommand implements ITaskHandler {
  name = 'create-agent';
  description = 'Create a new agent task using AI-assisted planning and scaffolding';
  examples = [
    'ot create-agent',
    'ot create-agent my-agent',
    'ot create-agent --cli-agent gemini-default',
  ];

  async execute(args: string[], context: ExecutionContext): Promise<ReferenceHandle> {
    const verbosity = context.verbosity || 'summary';
    const flow = context.workflowContext;
    
    // Parse CLI agent name from args (default to first configured agent or gemini-default)
    const cliAgentIndex = args.indexOf('--cli-agent');
    let cliAgentName = cliAgentIndex !== -1 && args[cliAgentIndex + 1] 
      ? args[cliAgentIndex + 1] 
      : this.getDefaultAgent(context.config);

    // Get task name from args or prompt
    let taskName: string;
    if (args.length > 0 && !args[0].startsWith('--')) {
      taskName = args[0];
    } else {
      context.outputSynk.write('Starting agent creation workflow...');
      
      // Step 1: Ask for task name
      const nameQuestion = new QuestionCommand('Enter the task name (kebab-case):');
      const nameRefs = await flow.run(nameQuestion);
      const nameValue = await flow.get(nameRefs[0]);
      if (!nameValue || typeof nameValue !== 'string') {
        throw new Error('Task name is required');
      }
      taskName = nameValue;
    }

    // Validate task name
    context.outputSynk.write('Validating task name...');
    if (!/^[a-z0-9-]+$/.test(taskName)) {
      throw new Error(
        'Task name must be kebab-case (lowercase letters, numbers, and hyphens only)'
      );
    }

    const openTasksDir = path.join(context.cwd, '.open-tasks');
    
    // Check if .open-tasks directory exists
    context.outputSynk.write('Checking project initialization...');
    const openTasksDirExists = await fse.pathExists(openTasksDir);
    if (!openTasksDirExists) {
      throw new Error(
        '.open-tasks directory does not exist. Run "ot init" first.'
      );
    }

    // Check if task already exists
    const taskPath = path.join(openTasksDir, `${taskName}.ts`);
    if (await fse.pathExists(taskPath)) {
      throw new Error(`Task "${taskName}" already exists at ${taskPath}`);
    }

    // Step 2: Ask for task requirements
    context.outputSynk.write('Gathering requirements...');
    const reqQuestion = new QuestionCommand('Describe what this task should do:');
    const reqRefs = await flow.run(reqQuestion);
    const reqValue = await flow.get(reqRefs[0]);
    if (!reqValue || typeof reqValue !== 'string') {
      throw new Error('Requirements are required');
    }
    const requirements = reqValue;

    // Step 3: Create detailed planning prompt
    context.outputSynk.write('Creating planning prompt...');
    const planningPrompt = this.createPlanningPrompt(taskName, requirements);
    const promptRefs = await flow.run(new SetCommand(planningPrompt, 'planning-prompt'));

    // Step 4: Get agent configuration
    const agentConfig = this.getAgentConfig(context.config, cliAgentName);
    
    if (!agentConfig) {
      throw new Error(
        `Agent "${cliAgentName}" not found in configuration. ` +
        `Available agents: ${this.listAvailableAgents(context.config).join(', ')}`
      );
    }

    // Step 5: Run agent to create detailed plan
    context.outputSynk.write(`Running agent "${cliAgentName}" to create plan...`);
    
    try {
      const agentCommand = new AgentCommand(agentConfig, [promptRefs[0]]);
      const planRefs = await flow.run(agentCommand);
      const planValue = await flow.get(planRefs[0]);
      if (!planValue || typeof planValue !== 'string') {
        throw new Error('Agent failed to generate a plan');
      }
      const plan = planValue;

      // Step 6: Save plan to markdown file
      context.outputSynk.write('Saving plan to markdown file...');
      const specPath = path.join(openTasksDir, `${taskName}.md`);
      const specContent = this.createSpecContent(taskName, requirements, plan);
      await fs.writeFile(specPath, specContent, 'utf-8');

      // Step 7: Show plan and ask for confirmation
      if (verbosity !== 'quiet') {
        console.log('\n' + '='.repeat(60));
        console.log(`Plan for "${taskName}" task:`);
        console.log('='.repeat(60));
        console.log(plan);
        console.log('='.repeat(60) + '\n');
      }

      const confirmQuestion = new QuestionCommand(
        'Review the spec above. Press Enter to build the task, or Ctrl+C to cancel:'
      );
      await flow.run(confirmQuestion);

      // Step 8: Run agent again to implement the task
      context.outputSynk.write('Building task implementation...');
      const implPrompt = this.createImplementationPrompt(taskName, specContent);
      const implPromptRefs = await flow.run(new SetCommand(implPrompt, 'impl-prompt'));
      
      const implAgentCommand = new AgentCommand(agentConfig, [implPromptRefs[0]]);
      const implRefs = await flow.run(implAgentCommand);
      const implValue = await flow.get(implRefs[0]);
      if (!implValue || typeof implValue !== 'string') {
        throw new Error('Agent failed to generate implementation');
      }
      const implementation = implValue;

      // Step 9: Save implementation
      await fs.writeFile(taskPath, implementation, 'utf-8');

      const message = [
        `Created agent task: ${taskName}`,
        `Spec: ${specPath}`,
        `Implementation: ${taskPath}`,
        `Agent used: ${cliAgentName}`,
      ].join('\n');

      const details = [
        `Task Name: ${taskName}`,
        `Requirements: ${requirements.substring(0, 100)}${requirements.length > 100 ? '...' : ''}`,
        `Spec File: ${specPath}`,
        `Implementation: ${taskPath}`,
        `Agent: ${cliAgentName}`,
        ``,
        `Next Steps:`,
        `  1. Review the implementation in ${taskPath}`,
        `  2. Review the spec in ${specPath}`,
        `  3. Run: ot ${taskName}`,
        `  4. (Optional) Promote globally: ot promote ${taskName}`,
      ].join('\n');

      if (verbosity !== 'quiet') {
        console.log(new MessageCard('🤖 Agent Task Created', details, 'success').build());
      }

      return {
        id: 'create-agent-result',
        content: message,
        token: 'create-agent',
        timestamp: new Date(),
      };

    } catch (error: any) {
      throw new Error(
        `Failed to create agent task: ${error.message}\n\n` +
        `Make sure the agent "${cliAgentName}" is properly configured and available.`
      );
    }
  }

  /**
   * Get default agent from configuration
   */
  private getDefaultAgent(config: Record<string, any>): string {
    if (config.agents && Array.isArray(config.agents) && config.agents.length > 0) {
      return config.agents[0].name;
    }
    return 'gemini-default';
  }

  /**
   * Get agent configuration from config
   */
  private getAgentConfig(config: Record<string, any>, agentName: string): any {
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
  private listAvailableAgents(config: Record<string, any>): string[] {
    if (!config.agents || !Array.isArray(config.agents)) {
      return [];
    }
    return config.agents.map((a: any) => a.name);
  }

  /**
   * Create planning prompt for the agent
   */
  private createPlanningPrompt(taskName: string, requirements: string): string {
    return `You are creating a detailed plan for building an open-tasks framework task.

Task Name: ${taskName}
Requirements: ${requirements}

The open-tasks framework uses:
- TaskHandler base class for implementing tasks
- IFlow for workflow context (run, get, set methods)
- Commands like SetCommand, ReadCommand, WriteCommand, QuestionCommand, etc.
- Cards for formatted output (MessageCard)

Please create a detailed plan with the following sections:

1. Overview
   - Brief description of what the task does
   - Key features and capabilities

2. Implementation Steps
   - Step-by-step breakdown of how to implement the task
   - Which commands and components to use
   - Data flow and transformations

3. Code Structure
   - Main class structure
   - Key methods and their responsibilities
   - Error handling considerations

4. Testing Approach
   - How to test the task
   - Example usage scenarios

5. Example Usage
   - Command-line examples showing how to use the task

Please provide a comprehensive plan that can be used to implement the task.`;
  }

  /**
   * Create implementation prompt for the agent
   */
  private createImplementationPrompt(taskName: string, spec: string): string {
    return `You are implementing an open-tasks framework task based on the following specification.

${spec}

Please generate complete TypeScript code for this task following these requirements:

1. Implement a default export class that extends TaskHandler or implements ITaskHandler
2. Set name, description, and examples properties
3. Implement the execute method with proper typing
4. Use IFlow commands for workflow operations
5. Use MessageCard for formatted output
6. Include proper error handling
7. Follow the existing code patterns from the framework

The code should be production-ready and follow TypeScript best practices.
Do not include any markdown code fences or explanations, just the pure TypeScript code.`;
  }

  /**
   * Create spec file content
   */
  private createSpecContent(taskName: string, requirements: string, plan: string): string {
    return `# ${taskName}

## Requirements

${requirements}

## Detailed Plan

${plan}

## Implementation Notes

This specification was generated using the create-agent command.
Review and update as needed during development.

## Generated

- Date: ${new Date().toISOString()}
- Tool: create-agent command
`;
  }
}
