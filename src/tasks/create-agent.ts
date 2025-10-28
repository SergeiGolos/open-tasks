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
import { getDefaultAgent, getAgentConfig, listAvailableAgents } from '../config-loader.js';

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
      : getDefaultAgent(context.config);

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

    // Step 3: Create detailed planning prompt and save to file
    context.outputSynk.write('Creating planning prompt...');
    const planningPrompt = this.createPlanningPrompt(taskName, requirements);
    
    // Save planning prompt to file for reference and reuse
    const planningPromptPath = path.join(openTasksDir, `${taskName}.planning-prompt.txt`);
    await fs.writeFile(planningPromptPath, planningPrompt, 'utf-8');
    context.outputSynk.write(`Planning prompt saved to: ${planningPromptPath}`);
    
    const promptRefs = await flow.run(new SetCommand(planningPrompt, 'planning-prompt'));

    // Step 4: Get agent configuration
    const agentConfig = getAgentConfig(context.config, cliAgentName);
    
    if (!agentConfig) {
      throw new Error(
        `Agent "${cliAgentName}" not found in configuration. ` +
        `Available agents: ${listAvailableAgents(context.config).join(', ')}`
      );
    }

    // Step 5: Run agent to create detailed plan
    context.outputSynk.write(`Running agent "${cliAgentName}" to create plan...`);
    if (verbosity === 'verbose') {
      console.log(`[create-agent] Using planning prompt file: ${planningPromptPath}`);
    }
    
    try {
      const agentCommand = new AgentCommand(agentConfig, [promptRefs[0]], planningPromptPath);
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

      // Step 8: Run agent again to implement the task with wiki documentation
      context.outputSynk.write('Loading framework documentation...');
      const implPrompt = await this.createImplementationPrompt(taskName, specContent);
      
      // Save implementation prompt to file for reference and reuse
      const implPromptPath = path.join(openTasksDir, `${taskName}.implementation-prompt.txt`);
      await fs.writeFile(implPromptPath, implPrompt, 'utf-8');
      context.outputSynk.write(`Implementation prompt saved to: ${implPromptPath}`);
      
      context.outputSynk.write('Building task implementation with AI agent...');
      if (verbosity === 'verbose') {
        console.log(`[create-agent] Using implementation prompt file: ${implPromptPath}`);
        console.log(`[create-agent] Prompt size: ${(implPrompt.length / 1024).toFixed(1)} KB`);
      }
      
      const implPromptRefs = await flow.run(new SetCommand(implPrompt, 'impl-prompt'));
      
      const implAgentCommand = new AgentCommand(agentConfig, [implPromptRefs[0]], implPromptPath);
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
        ``,
        `Generated Files:`,
        `  📄 Spec: ${specPath}`,
        `  💾 Implementation: ${taskPath}`,
        `  📝 Planning Prompt: ${planningPromptPath}`,
        `  📝 Implementation Prompt: ${implPromptPath}`,
        ``,
        `Agent: ${cliAgentName}`,
        ``,
        `Next Steps:`,
        `  1. Review the implementation in ${taskPath}`,
        `  2. Review the spec in ${specPath}`,
        `  3. Run: ot ${taskName}`,
        `  4. (Optional) Promote globally: ot promote ${taskName}`,
        ``,
        `Prompt Files:`,
        `  The saved prompt files can be used to regenerate or refine the task.`,
        `  You can edit them and re-run the agent with the modified prompts.`,
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
   * Create planning prompt for the agent
   */
  private createPlanningPrompt(taskName: string, requirements: string): string {
    return `You are an expert software architect creating a detailed implementation plan for an open-tasks CLI task.

# Task Definition
**Name:** ${taskName}
**Requirements:** ${requirements}

# Your Role
Create a comprehensive, actionable plan that will guide the implementation of this task. The plan should be clear enough that another developer (or AI) can implement the code exactly as specified.

# Framework Context
The open-tasks framework is a CLI tool that uses:
- **ITaskHandler interface** - Tasks implement this with execute() method
- **IFlow** - Workflow context providing run(), get(), set() methods
- **Commands** - Composable units like SetCommand, ReadCommand, WriteCommand, AgentCommand, etc.
- **Cards** - Formatted output using MessageCard, TableCard, ListCard, etc.
- **Reference system** - Data flows through ReferenceHandles between commands

# Required Plan Sections

## 1. Task Overview
- Clear description of what the task accomplishes
- Primary use cases and scenarios
- Expected inputs and outputs

## 2. Implementation Architecture
- Which Commands will be used and in what order
- Data flow between commands (what refs are created/consumed)
- Any external tools or APIs required
- Error scenarios and handling strategy

## 3. Detailed Implementation Steps
Provide step-by-step pseudocode showing:
- Command instantiation
- How to chain commands using flow.run()
- How to pass data between commands
- Where to add error handling
- How to format and present results

## 4. Example Code Structure
Show the class structure including:
- Class declaration
- Required properties (name, description, examples)
- execute() method signature
- Key variables and their purposes

## 5. Testing Strategy
- How to test the task manually
- Example command-line invocations
- Expected outputs
- Edge cases to verify

## 6. Potential Challenges
- Known limitations or dependencies
- Performance considerations
- Alternative approaches considered

**Important:** Be specific about command usage, data types, and error handling. The implementation phase will use this plan directly.`;
  }

  /**
   * Create implementation prompt for the agent with wiki documentation
   */
  private async createImplementationPrompt(taskName: string, spec: string): Promise<string> {
    const wikiDocs = await this.loadWikiDocs();

    return `You are an expert TypeScript developer implementing an open-tasks framework task.

# Implementation Specification
${spec}

---

# Framework Documentation
${wikiDocs}

---

# Implementation Requirements

Your task is to generate production-ready TypeScript code that:

## 1. Implements ITaskHandler Interface
\`\`\`typescript
export default class ${this.toClassName(taskName)} implements ITaskHandler {
  name = '${taskName}';
  description = '...';
  examples = [...];
  
  async execute(args: string[], context: ExecutionContext): Promise<ReferenceHandle> {
    // Implementation
  }
}
\`\`\`

## 2. Uses the Framework Correctly
- Import types: ExecutionContext, ReferenceHandle, ITaskHandler
- Import commands as needed: SetCommand, ReadCommand, WriteCommand, AgentCommand, etc.
- Import cards for output: MessageCard, TableCard, ListCard, etc.
- Use \`context.workflowContext\` (IFlow) to run commands
- Use \`context.outputSynk\` for progress messages
- Use \`context.verbosity\` to control output detail

## 3. Follows Best Practices
- Proper error handling with descriptive messages
- Input validation for args and options
- Clean, readable code with comments
- Type-safe operations
- Proper async/await usage

## 4. Implements Command Flow Pattern
\`\`\`typescript
const flow = context.workflowContext;

// Create and run commands
const refs = await flow.run(new SomeCommand(...));

// Retrieve results
const value = await flow.get(refs[0]);

// Chain commands
const nextRefs = await flow.run(new NextCommand(refs[0]));
\`\`\`

## 5. Provides Good User Experience
- Set informative name, description, and examples
- Use outputSynk for progress updates
- Format output using appropriate Card types
- Return a meaningful ReferenceHandle

# Output Format
Provide ONLY the complete TypeScript code. Do not include:
- Markdown code fences (\`\`\`typescript)
- Explanations or commentary
- Import statements for Node.js built-ins unless necessary
- Any text before or after the code

The code should be ready to save directly to a .ts file and execute.`;
  }

  /**
   * Convert kebab-case to PascalCase for class names
   */
  private toClassName(kebabCase: string): string {
    return kebabCase
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
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
