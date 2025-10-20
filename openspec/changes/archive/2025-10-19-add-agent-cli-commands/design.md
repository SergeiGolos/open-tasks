This document outlines the design for integrating external agentic CLI tools into the `@bitcobblers/open-tasks`.

### 1. `AgentCommandHandler` Base Class

This abstract class will encapsulate the common logic for interacting with agentic CLIs. It will be responsible for parsing arguments, building the appropriate context, and executing the external CLI tool.

```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle } from '../types';

export abstract class AgentCommandHandler extends CommandHandler {
  /** The name of the agent CLI executable (e.g., 'claude', 'codex') */
  abstract agentName: string;

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const { prompt, mode, agentArgs } = this.parseArgs(args);
    const agentContext = await this.buildAgentContext(refs, context);

    // This method will use child_process.spawn to run the agent CLI
    const result = await this.runAgent(prompt, mode, agentArgs, agentContext);

    // Create a reference to the output of the agent command
    return context.referenceManager.createReference(this.name, result);
  }

  /**
   * Parses the command-line arguments to separate the prompt from agent-specific flags.
   */
  protected abstract parseArgs(args: string[]): { 
    prompt: string; 
    mode: 'interactive' | 'non-interactive'; 
    agentArgs: string[]; 
  };

  /**
   * Builds the context for the agent, including reading context files (e.g., CLAUDE.md).
   */
  protected abstract buildAgentContext(
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<any>;

  /**
   * Executes the agent CLI with the given parameters.
   */
  protected abstract runAgent(
    prompt: string, 
    mode: 'interactive' | 'non-interactive', 
    agentArgs: string[], 
    agentContext: any
  ): Promise<any>;
}
```

### 2. Specific Agent Command Handlers

We will create concrete implementations for each supported agent CLI, inheriting from the `AgentCommandHandler`.

#### 2.1. `ClaudeCommandHandler`

This handler will manage interactions with `claude-code`.

```typescript
export class ClaudeCommandHandler extends AgentCommandHandler {
  name = 'claude';
  agentName = 'claude';
  description = 'Interact with the Anthropic Claude Code CLI.';
  examples = [
    'claude "explain this project"',
    'claude -p "refactor this file" --model opus',
    'claude -c' // continue last session
  ];

  protected parseArgs(args: string[]) { /* ... */ }
  protected buildAgentContext(refs, context) { /* Logic to find and read CLAUDE.md files */ }
  protected runAgent(prompt, mode, agentArgs, context) { /* spawn('claude', [...]) */ }
}
```

#### 2.2. `CodexCommandHandler`

This handler will manage interactions with `codex`.

```typescript
export class CodexCommandHandler extends AgentCommandHandler {
  name = 'codex';
  agentName = 'codex';
  description = 'Interact with the OpenAI Codex CLI.';
  examples = [
    'codex "fix the bugs in this file"',
    'codex exec "generate tests" --approval-mode auto-edit',
    'codex -m gpt-4.1 "implement new feature"'
  ];

  protected parseArgs(args: string[]) { /* ... */ }
  protected buildAgentContext(refs, context) { /* Logic to find and read AGENTS.md and config.toml */ }
  protected runAgent(prompt, mode, agentArgs, context) { /* spawn('codex', [...]) */ }
}
```

#### 2.3. `GeminiCommandHandler`

This handler will manage interactions with `gemini-cli`.

```typescript
export class GeminiCommandHandler extends AgentCommandHandler {
  name = 'gemini';
  agentName = 'gemini';
  description = 'Interact with the Google Gemini CLI.';
  examples = [
    'gemini "summarize the changes"',
    'gemini -p "write a README" --output-format json',
    'gemini --yolo "deploy the app"'
  ];

  protected parseArgs(args: string[]) { /* ... */ }
  protected buildAgentContext(refs, context) { /* Logic to find and read GEMINI.md and settings.json */ }
  protected runAgent(prompt, mode, agentArgs, context) { /* spawn('gemini', [...]) */ }
}
```
