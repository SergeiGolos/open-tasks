# Core Tasks

Open Tasks CLI includes several built-in tasks that help you set up and manage your workflow projects.

## Overview

Core tasks are pre-built commands that handle project initialization, task creation, and maintenance. Unlike custom tasks that you build, these are part of the CLI itself.

**Available Core Tasks:**

- `init` - Initialize a new Open Tasks project
- `create` - Create a new custom task from a template
- `create-agent` - Create an AI agent configuration task
- `promote` - Convert a task to a reusable module
- `clean` - Clean up output files

---

## init

Initialize a new Open Tasks project in the current directory.

### Usage

```bash
ot init [options]
```

### Options

- `--force` - Reinitialize even if project already exists
- `--verbose` - Show detailed progress
- `--quiet` - Minimal output

### What it Creates

```
.open-tasks/
├── .config.json       # Project configuration
├── logs/              # Output files directory
└── package.json       # ES module support
```

Also creates a root `package.json` if it doesn't exist.

### Examples

Initialize a new project:
```bash
ot init
```

Force reinitialize an existing project:
```bash
ot init --force
```

Quiet initialization:
```bash
ot init --quiet
```

### Configuration File

The generated `.open-tasks/.config.json` contains:

```json
{
  "outputDir": ".open-tasks/logs",
  "customCommandsDir": [".open-tasks", "~/.open-tasks"],
  "timestampFormat": "YYYYMMDD-HHmmss-SSS",
  "defaultFileExtension": "txt",
  "colors": true
}
```

---

## create

Create a new custom task from a template. This scaffolds a complete example showing how to build workflows using command chaining.

### Usage

```bash
ot create <task-name> [options]
```

### Arguments

- `<task-name>` - Name of the task (must be kebab-case: lowercase letters, numbers, and hyphens only)

### Options

- `--typescript` - Generate TypeScript template instead of JavaScript
- `--description "..."` - Custom description for the task
- `--verbose` - Show detailed progress
- `--quiet` - Minimal output

### What it Creates

Creates `.open-tasks/<task-name>.js` (or `.ts`) with:

1. **SetCommand** - Store values in workflow context
2. **ReplaceCommand** - Replace placeholders in templates
3. **DisplayCardCommand** - Show formatted output
4. **Example workflow** - Demonstrates command chaining

### Examples

Create a JavaScript task:
```bash
ot create my-task
```

Create a TypeScript task:
```bash
ot create my-task --typescript
```

Create with custom description:
```bash
ot create code-review --description "Review code changes"
```

### Generated Template Structure

The generated task includes:

```javascript
// Command classes
class SetCommand { /* Store values */ }
class ReplaceCommand { /* Replace template placeholders */ }
class DisplayCardCommand { /* Show formatted output */ }

// Main task handler
export default class MyTaskCommand {
  name = 'my-task';
  description = 'Custom command';
  examples = ['ot my-task'];
  
  async execute(args, context) {
    // Workflow implementation
  }
}
```

---

## create-agent

Create a new AI agent configuration task. This generates a template for integrating with various AI coding assistants.

### Usage

```bash
ot create-agent <agent-name> [options]
```

### Arguments

- `<agent-name>` - Name for the agent configuration task

### Options

- `--agent <type>` - Agent type: `claude`, `gemini`, `copilot`, `aider`, `llm`, `qwen`
- `--typescript` - Generate TypeScript template
- `--description "..."` - Custom description
- `--verbose` - Show detailed progress

### Examples

Create a Claude agent configuration:
```bash
ot create-agent review-code --agent claude
```

Create a Gemini agent task in TypeScript:
```bash
ot create-agent summarize --agent gemini --typescript
```

### Generated Agent Task

The generated task includes:

```javascript
import { loadAgentConfig } from '../src/commands/agents/config-loader.js';

export default class ReviewCodeCommand {
  name = 'review-code';
  description = 'AI code review with Claude';
  
  async execute(args, context) {
    // Load agent configuration
    const agentConfig = await loadAgentConfig(context.cwd, 'claude');
    
    // Build context from files
    const fileContent = await context.workflowContext.run(
      new ReadCommand('src/app.js')
    );
    
    // Execute agent with prompt
    const result = await context.workflowContext.run(
      new AgentCommand(agentConfig, [promptRef, fileContent])
    );
    
    return result;
  }
}
```

For details on agent configurations, see **[Core Agents Command Builder](./Core-Agents-Command-Builder.md)**.

---

## promote

Convert a task from a simple script to a reusable npm module.

### Usage

```bash
ot promote <task-name> [options]
```

### Arguments

- `<task-name>` - Name of the task to promote

### Options

- `--package-name <name>` - Custom npm package name
- `--description "..."` - Package description
- `--verbose` - Show detailed progress

### What it Does

1. Creates a new directory with npm package structure
2. Copies the task implementation
3. Generates `package.json` with proper exports
4. Creates README with usage instructions
5. Sets up build configuration

### Examples

Promote a task to a package:
```bash
ot promote code-review
```

Promote with custom package name:
```bash
ot promote code-review --package-name "@myorg/code-reviewer"
```

### Generated Package Structure

```
code-review-package/
├── package.json
├── README.md
├── src/
│   └── index.js
└── dist/          # After build
    └── index.js
```

---

## clean

Clean up output files and logs generated by tasks.

### Usage

```bash
ot clean [options]
```

### Options

- `--all` - Remove all output files
- `--older-than <days>` - Remove files older than specified days
- `--dry-run` - Show what would be deleted without deleting
- `--verbose` - Show detailed progress
- `--quiet` - Minimal output

### Examples

Remove all output files:
```bash
ot clean --all
```

Remove files older than 7 days:
```bash
ot clean --older-than 7
```

Preview what would be deleted:
```bash
ot clean --all --dry-run
```

### What it Cleans

- Files in `.open-tasks/logs/`
- Timestamped output directories
- Temporary workflow files

**Note:** Does not delete custom task definitions or configuration files.

---

## Global Options

All core tasks support these global options:

- `-q, --quiet` - Minimal output (quiet mode)
- `-s, --summary` - Summary output with cards (default)
- `-v, --verbose` - Detailed output with progress
- `--ref <token...>` - Reference token(s) to load
- `--dir <path>` - Write output to custom directory path

### Examples

Run any task in quiet mode:
```bash
ot init --quiet
ot create my-task --quiet
```

Run with verbose output:
```bash
ot init --verbose
ot clean --all --verbose
```

Custom output directory:
```bash
ot create my-task --dir /tmp/outputs
```

---

## Next Steps

- **[Core Commands](./Core-Commands.md)** - Learn about command execution
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Create your own tasks
- **[Core Agents Command Builder](./Core-Agents-Command-Builder.md)** - Configure AI agents
- **[Example Tasks](./Example-Tasks.md)** - See real-world examples

## See Also

- **[Installation](./Installation.md)** - Setup and configuration
- **[Architecture](./Architecture.md)** - System design overview
