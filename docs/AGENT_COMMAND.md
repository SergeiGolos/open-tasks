# Agent Command

The `AgentCommand` enables integration with various agentic CLI tools for AI-powered code analysis, generation, and automation. It follows the ICommand interface pattern and can be composed in workflows with other commands.

## Overview

The Agent Command provides a unified interface to execute multiple agentic CLI tools including:

- **Gemini CLI** - Google's AI agent with 1M token context window
- **Claude Code** - Anthropic's premium coding assistant
- **GitHub Copilot CLI** - GitHub's repository-aware agent
- **Aider** - Git-native AI pair programming
- **Codebuff** - Multi-agent system for complex tasks
- **Qwen Code CLI** - Alibaba's free-tier coding agent
- **Crush** - LSP-powered agent with multi-model support
- **llm** - Simon Willison's universal AI command
- **OpenAI Codex** - OpenAI's coding agent

## Installation

First, install the agentic CLI tools you want to use:

```bash
# Gemini CLI
npm install -g @google/gemini-cli

# Claude Code
npm install -g @anthropic-ai/claude-code

# GitHub Copilot CLI
npm install -g @github/copilot

# Aider
pip install aider-chat
# or with pipx
pipx install aider-chat

# Codebuff
npm install -g codebuff

# Qwen Code CLI
npm install -g @qwen-code/qwen-code

# Crush
npm install -g @charmbracelet/crush
# or via Homebrew
brew install crush

# llm
pip install llm
# or with pipx
pipx install llm
```

## Basic Usage

### Simple Query Example

```typescript
import { DirectoryOutputContext } from './directory-output-context.js';
import { SetCommand, AgentCommand, AgentConfig } from './commands/index.js';

const context = new DirectoryOutputContext(process.cwd());

// Create a prompt
const prompt = await context.run(
  new SetCommand('Explain how async/await works in JavaScript')
);

// Configure the agent
const config = AgentConfig.gemini()
  .withModel('gemini-2.5-pro')
  .allowingAllTools()
  .build();

// Execute
const result = await context.run(
  new AgentCommand(config, [prompt[0]])
);

console.log(await context.get(result[0]));
```

### Code Review Example

```typescript
// Read code file
const codeFile = await context.run(
  new ReadCommand('src/api/auth.ts')
);

// Create review prompt
const reviewPrompt = await context.run(
  new SetCommand('Review this code for security vulnerabilities and best practices.')
);

// Configure Claude for detailed analysis
const config = AgentConfig.claude()
  .withModel('claude-3-sonnet')
  .withTemperature(0.3) // Lower temp for focused analysis
  .allowingAllTools()
  .build();

// Execute review
const review = await context.run(
  new AgentCommand(config, [reviewPrompt[0], codeFile[0]])
);
```

### Automated Refactoring with Aider

```typescript
const prompt = await context.run(
  new SetCommand('Refactor this code to use dependency injection')
);

const config = AgentConfig.aider()
  .withModel('gpt-4')
  .withContextFiles('src/services/database.ts')
  .withGitAutoCommit('refactor: Apply dependency injection pattern')
  .build();

const result = await context.run(
  new AgentCommand(config, [prompt[0]])
);
```

## Configuration Options

### Builder Pattern

All agent configurations use a fluent builder pattern:

```typescript
const config = AgentConfig.gemini()
  .withModel('gemini-2.5-pro')           // Specify model
  .withProvider(ModelProvider.GOOGLE)    // Set provider
  .inDirectory('./src')                  // Working directory
  .withContextFiles('file1.ts', 'file2.ts') // Additional context
  .allowingAllTools()                    // Skip permission prompts
  .withTemperature(0.7)                  // Model temperature
  .withMaxTokens(4096)                   // Max response tokens
  .withApiKey(process.env.API_KEY)       // API authentication
  .withTimeout(60000)                    // 60 second timeout
  .withGitAutoCommit('feat: Generated code') // Auto-commit changes
  .withMcpServer('github', 'http://localhost:3000') // MCP integration
  .withFlag('verbose', true)             // Custom flags
  .build();
```

### IAgentConfig Interface

```typescript
interface IAgentConfig {
  tool: AgentTool;
  provider?: ModelProvider;
  model?: string;
  workingDirectory?: string;
  contextFiles?: string[];
  allowAllTools?: boolean;
  nonInteractive?: boolean;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  customFlags?: Record<string, string | boolean>;
  timeout?: number;
  git?: {
    autoCommit?: boolean;
    commitMessage?: string;
  };
  mcpServers?: {
    name: string;
    endpoint: string;
  }[];
}
```

## Tool-Specific Features

### Gemini CLI

- **Context Window**: Up to 1M tokens
- **Multimodal**: Can process images, PDFs, sketches
- **Free Tier**: 60 requests/min, 1,000/day

```typescript
const config = AgentConfig.gemini()
  .withModel('gemini-2.5-pro')
  .withContextFiles('design.pdf', 'sketch.png')
  .build();
```

### Claude Code

- **Thinking Mode**: Extended reasoning capability
- **Best for**: Complex architectural tasks
- **Models**: Claude 3.7 Sonnet with thinking mode

```typescript
const config = AgentConfig.claude()
  .withModel('claude-3.7-sonnet')
  .allowingAllTools()
  .build();
```

### GitHub Copilot CLI

- **GitHub Integration**: Deep repository awareness
- **MCP Support**: Access to GitHub issues, PRs, repos
- **Multi-Model**: Supports GPT-5, Claude Sonnet 4.5

```typescript
const config = AgentConfig.copilot()
  .withModel('gpt-4')
  .allowingAllTools()
  .build();
```

### Aider

- **Git-Native**: Every change is a commit
- **Repository Map**: Automatic codebase navigation
- **Model Agnostic**: Works with 100+ models via litellm

```typescript
const config = AgentConfig.aider()
  .withModel('claude-3-sonnet')
  .withContextFiles('src/**/*.ts')
  .withGitAutoCommit('docs: Add JSDoc comments')
  .build();
```

### Codebuff

- **Multi-Agent**: Specialized agents for planning, implementation, review
- **Custom Agents**: Define your own agents in TypeScript
- **Multi-Model**: Different models for different sub-tasks

```typescript
const config = AgentConfig.codebuff()
  .withModel('claude-3-sonnet')
  .build();
```

### Qwen Code CLI

- **Free Tier**: 2,000 requests/day with no token limits
- **Optimized**: Best performance with Qwen models
- **Based on**: Fork of Gemini CLI

```typescript
const config = AgentConfig.qwen()
  .withModel('qwen3-coder')
  .build();
```

### Crush

- **LSP Integration**: Semantic code understanding
- **Beautiful TUI**: Polished terminal interface
- **Model Flexible**: Supports all major providers + local models

```typescript
const config = AgentConfig.crush()
  .withProvider(ModelProvider.OLLAMA)
  .withModel('codellama')
  .build();
```

### llm

- **Universal**: Works with 100+ models
- **Plugin System**: Extensible with plugins
- **Composable**: Perfect for Unix pipes

```typescript
const config = AgentConfig.llm()
  .withModel('gpt-4')
  .withTemperature(0.7)
  .build();
```

## Combining Multiple StringRefs

The AgentCommand joins multiple StringRef values to create comprehensive prompts:

```typescript
const instruction = await context.run(
  new SetCommand('Compare these two implementations:')
);

const implementation1 = await context.run(
  new ReadCommand('src/old-version.ts')
);

const implementation2 = await context.run(
  new ReadCommand('src/new-version.ts')
);

const analysis = await context.run(
  new AgentCommand(
    AgentConfig.gemini().build(),
    [instruction[0], implementation1[0], implementation2[0]]
  )
);
```

## Error Handling

Agent commands can fail for various reasons. Always handle errors appropriately:

```typescript
try {
  const result = await context.run(
    new AgentCommand(config, [prompt[0]])
  );
  console.log(await context.get(result[0]));
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('timed out')) {
      console.error('Agent execution timeout - increase timeout value');
    } else if (error.message.includes('code 127')) {
      console.error('CLI tool not installed - run installation command');
    } else {
      console.error('Agent execution failed:', error.message);
    }
  }
}
```

## Environment Variables

Many tools require API keys. Set them via environment variables:

```bash
# Gemini
export GEMINI_API_KEY=your_key_here

# Claude
export ANTHROPIC_API_KEY=your_key_here

# OpenAI
export OPENAI_API_KEY=your_key_here
```

Or pass them directly in configuration:

```typescript
const config = AgentConfig.gemini()
  .withApiKey(process.env.GEMINI_API_KEY)
  .build();
```

## Best Practices

1. **Use Non-Interactive Mode**: The builder defaults to non-interactive mode for automation
2. **Set Timeouts**: Prevent hung processes with reasonable timeouts
3. **Handle Errors**: Always wrap agent calls in try-catch blocks
4. **Choose the Right Tool**: Match the tool to your use case
   - Gemini: Large context, multimodal
   - Claude: Complex reasoning
   - Aider: Git-native workflows
   - Qwen: Free tier, general purpose
5. **Compose with Other Commands**: Use ReadCommand, SetCommand, etc. to build context
6. **Temperature Control**: Lower temps (0.1-0.3) for analysis, higher (0.7-0.9) for creative tasks
7. **Context Files**: Provide relevant files to improve accuracy

## Advanced Patterns

### Pipeline Pattern

```typescript
// Read file -> Analyze -> Refactor -> Review
const file = await context.run(new ReadCommand('legacy.js'));

const analysis = await context.run(
  new AgentCommand(
    AgentConfig.claude().build(),
    [await context.run(new SetCommand('Analyze this code'))[0], file[0]]
  )
);

const refactored = await context.run(
  new AgentCommand(
    AgentConfig.aider().withGitAutoCommit('refactor: Modernize code').build(),
    [await context.run(new SetCommand('Convert to TypeScript with modern patterns'))[0], file[0]]
  )
);

const review = await context.run(
  new AgentCommand(
    AgentConfig.gemini().build(),
    [await context.run(new SetCommand('Review the refactored code'))[0], refactored[0]]
  )
);
```

### Multi-Tool Strategy

```typescript
// Use different tools for different strengths
const quickAnalysis = await context.run(
  new AgentCommand(
    AgentConfig.qwen().build(), // Fast, free tier
    [prompt[0]]
  )
);

const deepAnalysis = await context.run(
  new AgentCommand(
    AgentConfig.claude().withModel('claude-3.7-sonnet').build(), // Deep thinking
    [prompt[0]]
  )
);
```

## See Also

- [Agentic CLI Tools Research](../open-tasks-wiki/Agentic%20CLI%20Tools%20Research.md) - Comprehensive research on available tools
- [Example Demo](../examples/agent-command-demo.ts) - Full working examples
- [ICommand Interface](../src/types.ts) - Command interface specification
