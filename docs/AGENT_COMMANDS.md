# Agent Commands

The Agent Commands provide integration with various agentic CLI tools for AI-powered code analysis, generation, and automation. Each agent tool has its own dedicated command class with type-safe configuration.

## Overview

Each agentic CLI tool has a dedicated command class:

- **`GeminiCommand`** - Google's AI agent with 1M token context window
- **`ClaudeCommand`** - Anthropic's premium coding assistant
- **`CopilotCommand`** - GitHub's repository-aware agent
- **`AiderCommand`** - Git-native AI pair programming
- **`QwenCommand`** - Alibaba's free-tier coding agent
- **`LlmCommand`** - Simon Willison's universal AI command

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

# Qwen Code CLI
npm install -g @qwen-code/qwen-code

# llm
pip install llm
# or with pipx
pipx install llm
```

## Basic Usage

### The Builder Function Pattern

All agent commands use a builder function pattern for configuration:

```typescript
new AgentCommand([refs], (config) => config.method1().method2())
```

The command receives:
1. An array of `StringRef[]` - values will be joined to create the prompt
2. A builder function - receives a builder, expects it returned with configuration

### Simple Query Example

```typescript
import { DirectoryOutputContext } from './directory-output-context.js';
import { SetCommand, GeminiCommand } from './commands/index.js';

const context = new DirectoryOutputContext(process.cwd());

// Create a prompt
const prompt = await context.run(
  new SetCommand('Explain how async/await works in JavaScript')
);

// Execute with Gemini
const result = await context.run(
  new GeminiCommand([prompt[0]], (config) =>
    config
      .withModel('gemini-2.5-pro')
      .withTimeout(30000)
  )
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
  new SetCommand('Review this code for security vulnerabilities.')
);

// Execute with Claude
const review = await context.run(
  new ClaudeCommand([reviewPrompt[0], codeFile[0]], (config) =>
    config
      .withModel('claude-3-sonnet')
      .withTemperature(0.3)
      .allowingAllTools()
  )
);
```

### Automated Refactoring with Aider

```typescript
const prompt = await context.run(
  new SetCommand('Refactor this code to use dependency injection')
);

const result = await context.run(
  new AiderCommand([prompt[0]], (config) =>
    config
      .withModel('gpt-4')
      .withFiles('src/services/database.ts')
      .withAutoCommit('refactor: Apply dependency injection pattern')
  )
);
```

## Command Classes

### GeminiCommand

**Configuration**: `GeminiConfig` via `GeminiConfigBuilder`

```typescript
new GeminiCommand([refs], (config) =>
  config
    .withModel('gemini-2.5-pro')  // 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-pro' | 'gemini-flash'
    .withContextFiles('file1.ts', 'file2.ts')
    .inDirectory('./src')
    .withTemperature(0.7)
    .withMaxTokens(4096)
    .withApiKey(process.env.GEMINI_API_KEY)
    .withTimeout(60000)
    .enableSearch()  // Enable Google Search grounding
)
```

**Features**:
- Up to 1M token context window
- Multimodal (images, PDFs, sketches)
- Free tier: 60 requests/min, 1,000/day

### ClaudeCommand

**Configuration**: `ClaudeConfig` via `ClaudeConfigBuilder`

```typescript
new ClaudeCommand([refs], (config) =>
  config
    .withModel('claude-3.7-sonnet')  // 'claude-3.7-sonnet' | 'claude-3.5-sonnet' | 'claude-3-sonnet' | 'claude-3-opus' | 'claude-3-haiku'
    .allowingAllTools()
    .inDirectory('./src')
    .withTemperature(0.3)
    .withMaxTokens(4096)
    .withApiKey(process.env.ANTHROPIC_API_KEY)
    .withTimeout(60000)
    .withExtendedThinking()  // Enable extended reasoning mode
)
```

**Features**:
- Extended thinking mode for complex reasoning
- Best for architectural tasks
- Top-tier code understanding

### CopilotCommand

**Configuration**: `CopilotConfig` via `CopilotConfigBuilder`

```typescript
new CopilotCommand([refs], (config) =>
  config
    .withModel('gpt-4')  // 'gpt-4' | 'gpt-4-turbo' | 'gpt-5' | 'claude-sonnet-4.5'
    .allowingAllTools()
    .inDirectory('./src')
    .withTimeout(60000)
    .withAgentsFile()  // Use AGENTS.md for project context
)
```

**Features**:
- Deep GitHub repository integration
- MCP support for issues, PRs, repos
- Multi-model support (GPT, Claude)

### AiderCommand

**Configuration**: `AiderConfig` via `AiderConfigBuilder`

```typescript
new AiderCommand([refs], (config) =>
  config
    .withModel('claude-3-sonnet')  // Any model via litellm
    .withFiles('src/app.ts', 'src/utils.ts')
    .withReadOnlyFiles('docs/README.md')
    .inDirectory('./src')
    .withAutoCommit('feat: Add new feature')
    .withEditFormat('diff')  // 'whole' | 'diff' | 'udiff'
    .withRepoMap()  // Enable repository map
    .withTimeout(60000)
)
```

**Features**:
- Git-native: every change is a commit
- Automatic repository mapping
- Works with 100+ models

### QwenCommand

**Configuration**: `QwenConfig` via `QwenConfigBuilder`

```typescript
new QwenCommand([refs], (config) =>
  config
    .withModel('qwen3-coder')  // 'qwen3-coder' | 'qwen-coder-plus' | 'qwen-coder-turbo'
    .withContextFiles('file1.ts', 'file2.ts')
    .inDirectory('./src')
    .withTimeout(60000)
    .withPlanningMode()  // Enable planning mode
)
```

**Features**:
- Free tier: 2,000 requests/day
- Optimized for Qwen models
- Planning mode for complex tasks

### LlmCommand

**Configuration**: `LlmConfig` via `LlmConfigBuilder`

```typescript
new LlmCommand([refs], (config) =>
  config
    .withModel('gpt-4')  // Any model supported by llm
    .withTemperature(0.7)
    .withSystem('You are a helpful coding assistant')
    .inDirectory('./src')
    .withTimeout(60000)
    .withStreaming()
)
```

**Features**:
- Universal: works with 100+ models
- Plugin system
- Perfect for Unix pipes

## Combining Multiple StringRefs

All agent commands accept multiple StringRefs which are joined to create the prompt:

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
  new GeminiCommand(
    [instruction[0], implementation1[0], implementation2[0]],
    (config) => config.withModel('gemini-2.5-pro')
  )
);
```

## Error Handling

Agent commands can fail for various reasons. Always handle errors appropriately:

```typescript
try {
  const result = await context.run(
    new ClaudeCommand([prompt[0]], (config) =>
      config.withModel('claude-3-sonnet')
    )
  );
  console.log(await context.get(result[0]));
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('timed out')) {
      console.error('Increase timeout value');
    } else if (error.message.includes('code 127')) {
      console.error('CLI tool not installed');
    } else {
      console.error('Execution failed:', error.message);
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

# OpenAI (for llm)
export OPENAI_API_KEY=your_key_here
```

Or pass them directly in configuration:

```typescript
new GeminiCommand([prompt[0]], (config) =>
  config
    .withModel('gemini-2.5-pro')
    .withApiKey(process.env.GEMINI_API_KEY)
)
```

## Best Practices

1. **Set Reasonable Timeouts**: Prevent hung processes
   ```typescript
   config.withTimeout(30000)  // 30 seconds
   ```

2. **Handle Errors**: Always wrap agent calls in try-catch blocks

3. **Choose the Right Tool**:
   - Gemini: Large context, multimodal
   - Claude: Complex reasoning
   - Aider: Git-native workflows
   - Qwen: Free tier, general purpose

4. **Temperature Control**:
   - Lower temps (0.1-0.3) for analysis
   - Higher temps (0.7-0.9) for creative tasks

5. **Compose with Other Commands**: Build context with ReadCommand, SetCommand

6. **Provide Context Files**: Improve accuracy with relevant files
   ```typescript
   config.withContextFiles('src/types.ts', 'src/utils.ts')
   ```

## Advanced Patterns

### Pipeline Pattern

```typescript
// Read -> Analyze -> Refactor -> Review
const file = await context.run(new ReadCommand('legacy.js'));

const analysis = await context.run(
  new ClaudeCommand(
    [await context.run(new SetCommand('Analyze this code'))[0], file[0]],
    (config) => config.withModel('claude-3-sonnet')
  )
);

const refactored = await context.run(
  new AiderCommand(
    [await context.run(new SetCommand('Convert to TypeScript'))[0]],
    (config) => config
      .withFiles('legacy.js')
      .withAutoCommit('refactor: Convert to TypeScript')
  )
);
```

### Multi-Tool Strategy

```typescript
// Use different tools for different strengths
const quickAnalysis = await context.run(
  new QwenCommand([prompt[0]], (config) =>
    config.withModel('qwen3-coder')  // Fast, free tier
  )
);

const deepAnalysis = await context.run(
  new ClaudeCommand([prompt[0]], (config) =>
    config
      .withModel('claude-3.7-sonnet')
      .withExtendedThinking()  // Deep reasoning
  )
);
```

### Conditional Agent Selection

```typescript
function getAgentCommand(
  refs: StringRef[],
  taskType: 'quick' | 'deep' | 'refactor'
) {
  switch (taskType) {
    case 'quick':
      return new QwenCommand(refs, (config) =>
        config.withModel('qwen3-coder')
      );
    case 'deep':
      return new ClaudeCommand(refs, (config) =>
        config.withModel('claude-3.7-sonnet').withExtendedThinking()
      );
    case 'refactor':
      return new AiderCommand(refs, (config) =>
        config.withModel('gpt-4').withAutoCommit()
      );
  }
}

const result = await context.run(
  getAgentCommand([prompt[0]], 'deep')
);
```

## Migration from Old Pattern

If you're migrating from the old `AgentCommand` with `AgentConfig.gemini()`:

### Old Pattern
```typescript
const config = AgentConfig.gemini()
  .withModel('gemini-2.5-pro')
  .build();

const result = await context.run(
  new AgentCommand(config, [prompt[0]])
);
```

### New Pattern
```typescript
const result = await context.run(
  new GeminiCommand([prompt[0]], (config) =>
    config.withModel('gemini-2.5-pro')
  )
);
```

**Benefits of new pattern**:
- ✅ Type-safe configuration for each tool
- ✅ No need to call `.build()`
- ✅ Cleaner, more functional style
- ✅ Better IDE autocomplete
- ✅ Tool-specific types (e.g., `GeminiModel` enum)

## See Also

- [Agentic CLI Tools Research](../open-tasks-wiki/Agentic%20CLI%20Tools%20Research.md) - Comprehensive research
- [Example Demo](../examples/agent-command-demo.ts) - Full working examples
- [ICommand Interface](../src/types.ts) - Command interface specification
