# Core Agents Command Builder

Open Tasks CLI integrates with various AI coding assistants and LLM CLI tools, enabling you to build context-rich workflows that execute AI agents with precise inputs.

## Overview

The Agent Command Builder allows you to:

- **Configure Multiple AI Tools** - Claude, Gemini, GitHub Copilot, Aider, llm, Qwen, and more
- **Build Context Explicitly** - Pass file contents, API responses, and transformed data as prompts
- **Execute in Real-Time** - Run agents with dependencies resolved at execution time
- **Chain with Workflows** - Combine agent outputs with other commands

Unlike manually pasting context into AI chat interfaces, Open Tasks lets you programmatically construct prompts from multiple sources and execute agents non-interactively.

---

## Supported Agents

Open Tasks supports these AI coding assistants:

| Agent | CLI Tool | Description |
|-------|----------|-------------|
| **Claude** | `claude` | Anthropic's Claude Code CLI with extended thinking |
| **Gemini** | `gemini` | Google's Gemini CLI with search grounding |
| **GitHub Copilot** | `copilot` | GitHub's Copilot CLI |
| **Aider** | `aider` | AI pair programming with git integration |
| **llm** | `llm` | Simon Willison's multi-provider LLM tool |
| **Qwen** | `qwen` | Alibaba's Qwen Code CLI |

---

## Installation Requirements

### Claude Code

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Set API key
export ANTHROPIC_API_KEY="your-key-here"
```

Documentation: [Claude Code CLI](https://docs.anthropic.com/claude/docs/claude-code)

### Gemini CLI

```bash
# Install Gemini CLI
npm install -g @google/gemini-cli

# Set API key
export GEMINI_API_KEY="your-key-here"
```

Documentation: [Gemini CLI](https://ai.google.dev/gemini-api/docs/cli)

### GitHub Copilot CLI

```bash
# Install GitHub Copilot CLI
npm install -g @github/copilot

# Authenticate
gh auth login
```

Documentation: [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli)

### Aider

```bash
# Install Aider
pip install aider-chat

# Set API key (supports multiple providers)
export OPENAI_API_KEY="your-key-here"
# or
export ANTHROPIC_API_KEY="your-key-here"
```

Documentation: [Aider](https://aider.chat/)

### llm (Simon Willison)

```bash
# Install llm
pip install llm

# Install plugins for different providers
llm install llm-claude-3
llm install llm-gemini

# Set API keys
llm keys set openai
llm keys set anthropic
```

Documentation: [llm](https://llm.datasette.io/)

### Qwen

```bash
# Install Qwen Code CLI
npm install -g @qwen-code/qwen-code

# Set API key
export QWEN_API_KEY="your-key-here"
```

---

## Configuration

### Method 1: Programmatic Configuration (In Code)

Build agent configurations in your custom tasks using builder patterns:

#### Claude Configuration

```javascript
import { ClaudeConfigBuilder } from '../src/commands/agents/claude.js';

const config = new ClaudeConfigBuilder()
  .withModel('claude-3.5-sonnet')
  .allowingAllTools()
  .withExtendedThinking()
  .withTemperature(0.7)
  .withMaxTokens(4096)
  .inDirectory('./src')
  .withTimeout(60000)
  .build();
```

**Available Models:**
- `claude-3.7-sonnet` - Latest and most capable
- `claude-3.5-sonnet` - Fast and intelligent
- `claude-3-sonnet` - Balanced performance
- `claude-3-opus` - Most capable (slower)
- `claude-3-haiku` - Fastest

**Builder Methods:**
- `withModel(model)` - Set Claude model
- `allowingAllTools()` - Enable all tools without prompting
- `withExtendedThinking()` - Enable extended thinking mode
- `withTemperature(temp)` - Set creativity (0.0-1.0)
- `withMaxTokens(tokens)` - Maximum response tokens
- `withApiKey(key)` - Set API key (or use env var)
- `inDirectory(dir)` - Set working directory
- `withTimeout(ms)` - Execution timeout

#### Gemini Configuration

```javascript
import { GeminiConfigBuilder } from '../src/commands/agents/gemini.js';

const config = new GeminiConfigBuilder()
  .withModel('gemini-2.5-pro')
  .withContextFiles('src/app.js', 'README.md')
  .enableSearch()
  .withTemperature(0.8)
  .withMaxTokens(8192)
  .inDirectory('./src')
  .build();
```

**Available Models:**
- `gemini-2.5-pro` - Most capable
- `gemini-2.5-flash` - Fast and efficient
- `gemini-pro` - Standard model
- `gemini-flash` - Fastest

**Builder Methods:**
- `withModel(model)` - Set Gemini model
- `withContextFiles(...files)` - Add files to context
- `enableSearch()` - Enable Google Search grounding
- `withTemperature(temp)` - Set creativity
- `withMaxTokens(tokens)` - Maximum response tokens
- `withApiKey(key)` - Set API key
- `inDirectory(dir)` - Set working directory
- `withTimeout(ms)` - Execution timeout

#### GitHub Copilot Configuration

```javascript
import { CopilotConfigBuilder } from '../src/commands/agents/copilot.js';

const config = new CopilotConfigBuilder()
  .withModel('gpt-4')
  .allowingAllTools()
  .inDirectory('./src')
  .build();
```

**Available Models:**
- `gpt-4` - Most capable
- `gpt-4-turbo` - Fast GPT-4
- `gpt-3.5-turbo` - Fast and efficient

#### Aider Configuration

```javascript
import { AiderConfigBuilder } from '../src/commands/agents/aider.js';

const config = new AiderConfigBuilder()
  .withModel('claude-3.5-sonnet')
  .withFiles('src/app.js', 'src/utils.js')
  .withoutAutoCommit()
  .inDirectory('./src')
  .build();
```

**Builder Methods:**
- `withModel(model)` - Set AI model
- `withFiles(...files)` - Files to edit
- `withoutAutoCommit()` - Disable automatic git commits
- `inDirectory(dir)` - Set working directory

#### llm Configuration

```javascript
import { LlmConfigBuilder } from '../src/commands/agents/llm.js';

const config = new LlmConfigBuilder()
  .withModel('claude-3-opus')
  .withTemperature(0.5)
  .withSystem('You are a helpful code reviewer')
  .build();
```

**Builder Methods:**
- `withModel(model)` - Set model (supports many providers)
- `withTemperature(temp)` - Set creativity
- `withSystem(prompt)` - Set system prompt

#### Qwen Configuration

```javascript
import { QwenConfigBuilder } from '../src/commands/agents/qwen.js';

const config = new QwenConfigBuilder()
  .withModel('qwen3-coder')
  .withPlanningMode()
  .inDirectory('./src')
  .build();
```

**Available Models:**
- `qwen3-coder` - Latest coding model
- `qwen-coder-plus` - Enhanced capabilities
- `qwen-coder-turbo` - Fastest

---

### Method 2: Configuration File (Declarative)

Define agent configurations in `.open-tasks/.config.json`:

```json
{
  "outputDir": ".open-tasks/logs",
  "customCommandsDir": [".open-tasks"],
  "agents": [
    {
      "name": "code-reviewer",
      "type": "claude",
      "workingDirectory": "./src",
      "timeout": 60000,
      "config": {
        "model": "claude-3.5-sonnet",
        "allowAllTools": true,
        "enableThinking": true
      }
    },
    {
      "name": "doc-generator",
      "type": "gemini",
      "workingDirectory": "./",
      "config": {
        "model": "gemini-2.5-pro",
        "enableSearch": true,
        "contextFiles": ["README.md", "docs/"]
      }
    },
    {
      "name": "refactorer",
      "type": "aider",
      "config": {
        "model": "claude-3.5-sonnet",
        "files": ["src/app.js", "src/utils.js"],
        "noAutoCommits": false
      }
    }
  ]
}
```

Load by name in your tasks:

```javascript
import { loadAgentConfigByName } from '../src/commands/agents/config-loader.js';

// Load from config file
const config = loadAgentConfigByName(context.config, 'code-reviewer');
```

---

## Using Agent Commands in Workflows

### Basic Usage

```javascript
import { AgentCommand } from '../src/commands/agent.js';
import { SetCommand } from '../src/commands/set.js';
import { ReadCommand } from '../src/commands/read.js';
import { ClaudeConfigBuilder } from '../src/commands/agents/claude.js';

export default class CodeReviewCommand {
  name = 'code-review';
  description = 'Review code with Claude';
  
  async execute(args, context) {
    const flow = context.workflowContext;
    
    // 1. Build agent configuration
    const config = new ClaudeConfigBuilder()
      .withModel('claude-3.5-sonnet')
      .allowingAllTools()
      .build();
    
    // 2. Build prompt context
    const promptRef = await flow.run(
      new SetCommand('Review this code for bugs and improvements:')
    );
    
    const codeRef = await flow.run(
      new ReadCommand(args[0] || 'src/app.js')
    );
    
    // 3. Execute agent with combined context
    const result = await flow.run(
      new AgentCommand(config, [promptRef[0], codeRef[0]])
    );
    
    return {
      id: result[0].id,
      content: await flow.get(result[0]),
      timestamp: new Date()
    };
  }
}
```

### Advanced: Multi-File Context

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  const config = new ClaudeConfigBuilder()
    .withModel('claude-3.5-sonnet')
    .allowingAllTools()
    .build();
  
  // Build comprehensive context
  const instructions = await flow.run(
    new SetCommand('Analyze the authentication flow and suggest improvements.')
  );
  
  const authCode = await flow.run(new ReadCommand('src/auth.js'));
  const dbCode = await flow.run(new ReadCommand('src/db.js'));
  const tests = await flow.run(new ReadCommand('tests/auth.test.js'));
  
  // Execute with all context
  const result = await flow.run(
    new AgentCommand(config, [
      instructions[0],
      authCode[0],
      dbCode[0],
      tests[0]
    ])
  );
  
  return result;
}
```

### Advanced: Template-Based Prompts

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  // Store template tokens
  await flow.run(new SetCommand('src/api.js', 'filename'));
  await flow.run(new SetCommand('security', 'focus'));
  
  // Build prompt from template
  const templateRef = await flow.run(
    new SetCommand(
      'Review {{filename}} with focus on {{focus}} issues. ' +
      'Provide specific recommendations.'
    )
  );
  
  const promptRef = await flow.run(new TemplateCommand(templateRef[0]));
  const codeRef = await flow.run(new ReadCommand('src/api.js'));
  
  const config = new ClaudeConfigBuilder()
    .withModel('claude-3.5-sonnet')
    .build();
  
  const result = await flow.run(
    new AgentCommand(config, [promptRef[0], codeRef[0]])
  );
  
  return result;
}
```

---

## Environment Variables

### Setting API Keys

Most agents require API keys set as environment variables:

```bash
# Claude
export ANTHROPIC_API_KEY="sk-ant-..."

# Gemini
export GEMINI_API_KEY="AIza..."

# OpenAI (for Aider, llm)
export OPENAI_API_KEY="sk-..."

# Qwen
export QWEN_API_KEY="..."
```

### Using .env Files

Create `.env` in your project root:

```bash
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...
```

Load in your tasks:

```javascript
import dotenv from 'dotenv';
dotenv.config();
```

---

## Best Practices

### 1. Build Context Incrementally

```javascript
// Good: Build context step by step
const problem = await flow.run(new SetCommand('Bug description'));
const code = await flow.run(new ReadCommand('app.js'));
const logs = await flow.run(new ReadCommand('error.log'));

const result = await flow.run(
  new AgentCommand(config, [problem[0], code[0], logs[0]])
);
```

### 2. Use Appropriate Models

```javascript
// Quick tasks: Use fast models
const config = new ClaudeConfigBuilder()
  .withModel('claude-3-haiku')
  .build();

// Complex analysis: Use powerful models
const config = new ClaudeConfigBuilder()
  .withModel('claude-3.5-sonnet')
  .withExtendedThinking()
  .build();
```

### 3. Set Reasonable Timeouts

```javascript
// Long-running analysis
const config = new ClaudeConfigBuilder()
  .withModel('claude-3.5-sonnet')
  .withTimeout(120000) // 2 minutes
  .build();
```

### 4. Handle Errors Gracefully

```javascript
try {
  const result = await flow.run(new AgentCommand(config, prompts));
  return result;
} catch (error) {
  console.error('Agent execution failed:', error.message);
  // Fallback or retry logic
}
```

---

## Comparison: Agent vs Manual Context

### Traditional Approach (Manual)

1. Open files in editor
2. Copy code to clipboard
3. Open AI chat interface
4. Paste code
5. Type prompt
6. Wait for response
7. Copy response back

### Open Tasks Approach (Automated)

```bash
ot code-review src/app.js
```

Single command:
- Reads file
- Constructs prompt
- Executes agent
- Saves output
- Returns structured result

---

## Next Steps

- **[Example Tasks](./Example-Tasks.md)** - See real-world agent usage
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Create agent workflows
- **[Core Commands](./Core-Commands.md)** - Other available commands

## See Also

- **[Core Tasks](./Core-Tasks.md)** - Built-in CLI tasks
- **[Architecture](./Architecture.md)** - System design
