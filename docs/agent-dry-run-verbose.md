# Agent Dry-Run and Verbose Mode Examples

This document demonstrates how to use the new dry-run and verbose streaming features with agent commands.

## Dry-Run Mode

Dry-run mode allows you to see what command would be executed without actually running it. This is useful for:
- Debugging command construction
- Verifying arguments before execution
- Understanding what the agent will do

### Using the CLI Flag (Recommended)

The simplest way to enable dry-run mode is via the global `--dry-run` flag:

```bash
# Run any agent-based task in dry-run mode
ot my-agent-task --dry-run

# Combine with verbose mode for more details
ot my-agent-task --dry-run --verbose
```

This will show what commands would be executed without actually running them. The dry-run flag is automatically available to all agent commands through the execution context config.

**Example Output:**
```
[DRY-RUN] Would execute:
cd /path/to/working/directory
claude -p "Your prompt here" --allow-all-tools --model claude-3.5-sonnet
```

The dry-run output includes:
- Working directory context
- Full command with all arguments
- Proper escaping of special characters (quotes and backslashes)

### Per-Agent Configuration (Alternative)

You can also enable dry-run mode on specific agent configurations for programmatic control:

```javascript
import { ClaudeConfigBuilder } from './commands/agents/claude.js';
import { AgentCommand } from './commands/agents/agent.js';

// Create a Claude configuration with dry-run enabled
const config = new ClaudeConfigBuilder()
  .withModel('claude-3.5-sonnet')
  .allowingAllTools()
  .withDryRun()  // Enable dry-run mode for this specific agent
  .build();

// Execute the agent command
const result = await flow.run(
  new AgentCommand(config, [promptRef])
);
```

Note: If both the CLI flag and config builder are used, the command will run in dry-run mode (either one enables it).

## Verbose Mode with Streaming

When the execution context has verbosity set to 'verbose', agent output streams to the console in real-time as the agent executes. This works for both actual execution and dry-run mode.

### Using the CLI Flag

```bash
# Run with verbose streaming
ot my-agent-task --verbose

# Combine with dry-run
ot my-agent-task --verbose --dry-run
```

In verbose mode:
- Agent stdout/stderr streams to the console as it's generated
- Dry-run commands are displayed immediately
- Progress and debug information is shown

### Example: Verbose Context

```javascript
import { DirectoryOutputContext } from './directory-output-context.js';

// The verbosity is automatically passed through the config when using CLI
// For programmatic usage, you can create a verbose context:
const context = new DirectoryOutputContext(
  cwd, 
  outputDir, 
  'verbose',
  { verbosity: 'verbose' }  // Config with runtime options
);

// Any agent commands executed in this context will stream output
const config = new ClaudeConfigBuilder()
  .withModel('claude-3.5-sonnet')
  .build();

const result = await context.run(
  new AgentCommand(config, [promptRef])
);
// Output streams to console as it's generated
```

## How It Works

The implementation leverages the config object that's passed through the execution context:

1. **CLI flags** are parsed in `index.ts` and added to the config object
2. **Config object** is passed to `DirectoryOutputContext` (implements `IFlow`)
3. **Agent commands** access runtime options from `context.config`
4. **No constructor changes needed** - all options flow through the existing config mechanism

This design makes it easy to add new runtime options in the future without changing command signatures.

## All Agent Types Support These Features

All agent configurations automatically support these features through the config:

- `ClaudeConfig` / `ClaudeConfigBuilder`
- `GeminiConfig` / `GeminiConfigBuilder`
- `CopilotConfig` / `CopilotConfigBuilder`
- `AiderConfig` / `AiderConfigBuilder`
- `LlmConfig` / `LlmConfigBuilder`
- `QwenConfig` / `QwenConfigBuilder`

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
- CLI flags are properly passed through config
