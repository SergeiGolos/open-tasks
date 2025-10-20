# Agent Dry-Run and Verbose Mode Examples

This document demonstrates how to use the new dry-run and verbose streaming features with agent commands.

## Dry-Run Mode

Dry-run mode allows you to see what command would be executed without actually running it. This is useful for:
- Debugging command construction
- Verifying arguments before execution
- Understanding what the agent will do

### Example: Claude with Dry-Run

```javascript
import { ClaudeConfigBuilder } from './commands/agents/claude.js';
import { AgentCommand } from './commands/agents/agent.js';

// Create a Claude configuration with dry-run enabled
const config = new ClaudeConfigBuilder()
  .withModel('claude-3.5-sonnet')
  .allowingAllTools()
  .withDryRun()  // Enable dry-run mode
  .build();

// Execute the agent command
const result = await flow.run(
  new AgentCommand(config, [promptRef])
);
```

**Output:**
```
[DRY-RUN] Would execute:
cd /path/to/working/directory
claude -p "Your prompt here" --allow-all-tools --model claude-3.5-sonnet
```

### Example: Gemini with Context Files and Dry-Run

```javascript
import { GeminiConfigBuilder } from './commands/agents/gemini.js';
import { AgentCommand } from './commands/agents/agent.js';

const config = new GeminiConfigBuilder()
  .withModel('gemini-2.5-pro')
  .withContextFiles('src/auth.ts', 'src/user.ts')
  .inDirectory('/project/path')
  .withDryRun()
  .build();

const result = await flow.run(
  new AgentCommand(config, [promptRef])
);
```

**Output:**
```
[DRY-RUN] Would execute:
cd /project/path
gemini -p "Your prompt here" --model gemini-2.5-pro src/auth.ts src/user.ts
```

## Verbose Mode with Streaming

When the execution context has verbosity set to 'verbose', agent output streams to the console in real-time as the agent executes. This works for both actual execution and dry-run mode.

### Example: Verbose Context

```javascript
import { DirectoryOutputContext } from './directory-output-context.js';

// Create context with verbose mode
const context = new DirectoryOutputContext(cwd, outputDir, 'verbose');

// Any agent commands executed in this context will stream output
const config = new ClaudeConfigBuilder()
  .withModel('claude-3.5-sonnet')
  .build();

const result = await context.run(
  new AgentCommand(config, [promptRef])
);
// Output streams to console as it's generated
```

### Example: Combining Dry-Run and Verbose

```javascript
// Create verbose context
const context = new DirectoryOutputContext(cwd, outputDir, 'verbose');

// Enable dry-run
const config = new ClaudeConfigBuilder()
  .withDryRun()
  .build();

// The dry-run output will be displayed immediately
const result = await context.run(
  new AgentCommand(config, [promptRef])
);
```

## All Agent Types Support Dry-Run

All agent configurations support the `.withDryRun()` builder method:

- `ClaudeConfigBuilder`
- `GeminiConfigBuilder`
- `CopilotConfigBuilder`
- `AiderConfigBuilder`
- `LlmConfigBuilder`
- `QwenConfigBuilder`

## Testing

The test suite includes comprehensive tests for both features:

```bash
npm test
```

Tests verify:
- Dry-run output includes the correct command and arguments
- Working directory is shown in dry-run output
- Context files and other options are properly formatted
- Multiple prompts are joined correctly
- Verbose mode works with all agent types
