---
title: "System Commands"
---

# System Commands

Built-in commands for project management and scaffolding.

## Overview

System commands are framework commands (not user tasks) that help you initialize projects and create task templates. They are built into Open Tasks CLI and available immediately after installation.

## init Command

Initialize a project with Open Tasks CLI structure.

### Usage

```bash
open-tasks init
```

### What It Does

1. **Creates `.open-tasks/` directory**
   ```
   .open-tasks/
   ├── tasks/        # User task files
   ├── outputs/      # Command output files
   └── config.json   # Configuration
   ```

2. **Generates `config.json`**
   - Default output directory settings
   - File naming patterns
   - Optional AI configurations

3. **Ensures `package.json` exists**
   - Creates if missing
   - Adds open-tasks-cli as dependency

4. **Sets up npm dependencies**
   - Installs required packages
   - Configures TypeScript if needed

### Example

```bash
$ cd my-project
$ open-tasks init

✓ Created .open-tasks/ directory
✓ Created tasks/ subdirectory
✓ Created outputs/ subdirectory
✓ Generated config.json
✓ Verified package.json
✓ Installation complete!

Next steps:
  1. Run 'open-tasks create <task-name>' to create a task
  2. Edit tasks in .open-tasks/tasks/
  3. Run 'open-tasks <task-name>' to execute

```

### When to Use

- Starting a new project
- Adding Open Tasks CLI to existing project
- Resetting project structure

### Configuration Created

Default `config.json`:

```json
{
  "outputDirectory": ".open-tasks/outputs",
  "fileNamePattern": "{timestamp}-{token}",
  "timestampFormat": "YYYYMMDD-HHmmss-SSS",
  "defaultContext": "directory"
}
```

---

## create Command

Scaffold a new task template in `.open-tasks/tasks/`.

### Usage

```bash
open-tasks create <task-name> [options]
```

### Arguments

- `<task-name>` - Name of the task to create (kebab-case recommended)

### Options

- `--template <name>` - Use specific template (default: basic)
- `--typescript` - Generate TypeScript file (default)
- `--javascript` - Generate JavaScript file

### What It Does

1. **Creates task file** in `.open-tasks/tasks/<task-name>.ts`
2. **Scaffolds template** with TaskHandler class
3. **Includes boilerplate** for execute method, imports, and structure
4. **Adds comments** explaining usage

### Example

```bash
$ open-tasks create analyze-code

✓ Created task file: .open-tasks/tasks/analyze-code.ts
✓ Task template generated successfully

Edit .open-tasks/tasks/analyze-code.ts to customize your task.
Then run: open-tasks analyze-code
```

### Generated Template

```typescript
import { 
  TaskHandler, 
  IWorkflowContext, 
  TaskOutcome, 
  generateId 
} from 'open-tasks-cli';
import { 
  PowershellCommand, 
  ClaudeCommand 
} from 'open-tasks-cli/commands';
import { TokenDecorator } from 'open-tasks-cli/decorators';

export default class AnalyzeCodeTask extends TaskHandler {
  static name = 'analyze-code';
  static description = 'Analyze code files';

  async execute(
    args: string[], 
    context: IWorkflowContext
  ): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'analyze-code',
      logs: [],
      errors: []
    };

    try {
      // TODO: Implement your workflow here
      
      // Example: Read file
      const filename = args[0];
      const readCmd = new PowershellCommand(`Get-Content ${filename}`);
      const [fileRef] = await context.run(readCmd);
      
      outcome.logs.push({
        ...fileRef,
        command: 'PowershellCommand',
        args: [`Get-Content ${filename}`],
        start: new Date(),
        end: new Date()
      });
      
      // Example: Process with AI
      const analyzeCmd = new ClaudeCommand(
        "Analyze this code",
        [fileRef]
      );
      const [analysisRef] = await context.run(analyzeCmd);
      
      outcome.logs.push({
        ...analysisRef,
        command: 'ClaudeCommand',
        args: ["Analyze this code"],
        start: new Date(),
        end: new Date()
      });

    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

### Available Templates

**Basic Template** (default)
- Simple task structure
- PowershellCommand example
- ClaudeCommand example

**Empty Template** (`--template empty`)
- Minimal boilerplate
- No example commands

**Workflow Template** (`--template workflow`)
- Multi-step workflow example
- Error handling patterns
- Logging helpers

### Using Templates

```bash
# Default template
open-tasks create my-task

# Empty template
open-tasks create my-task --template empty

# Workflow template
open-tasks create my-task --template workflow

# JavaScript instead of TypeScript
open-tasks create my-task --javascript
```

### When to Use

- Creating a new custom workflow task
- Scaffolding task structure quickly
- Learning task development patterns

### Next Steps After Creation

1. **Edit the task file** - Customize the workflow logic
2. **Add imports** - Import needed commands
3. **Implement execute()** - Build your workflow
4. **Test the task** - Run `open-tasks <task-name>`

---

## help Command

Display help information.

### Usage

```bash
# General help
open-tasks --help
open-tasks -h

# Task-specific help
open-tasks <task-name> --help
```

### Output

```
Usage: open-tasks <command> [options]

System Commands:
  init                    Initialize project structure
  create <name>           Create new task template

Available Tasks:
  analyze-code            Analyze code files
  process-data            Process data files
  
Options:
  --help, -h              Show help
  --version, -v           Show version
  --verbose               Enable verbose output

Examples:
  open-tasks init
  open-tasks create my-task
  open-tasks analyze-code ./src/app.ts
```

---

## version Command

Display Open Tasks CLI version.

### Usage

```bash
open-tasks --version
open-tasks -v
```

### Output

```
open-tasks-cli version 1.0.0
```

---

## list Command

List all available tasks.

### Usage

```bash
open-tasks list
```

### Output

```
Available Tasks:

  analyze-code          Analyze code files
  process-data          Process data files
  generate-docs         Generate documentation
  
  3 tasks available

Run 'open-tasks <task-name> --help' for task details.
```

---

## Common Workflows

### Initial Setup

```bash
# 1. Install globally
npm install -g open-tasks-cli

# 2. Navigate to project
cd my-project

# 3. Initialize
open-tasks init

# 4. Create first task
open-tasks create hello-world

# 5. Run task
open-tasks hello-world
```

### Creating Multiple Tasks

```bash
# Create several tasks at once
open-tasks create analyze-code
open-tasks create process-files
open-tasks create generate-report

# List all tasks
open-tasks list
```

### Re-initialization

If you need to reset your project structure:

```bash
# Backup your tasks first!
cp -r .open-tasks/tasks/ ./tasks-backup/

# Remove old structure
rm -rf .open-tasks/

# Re-initialize
open-tasks init

# Restore your tasks
cp -r ./tasks-backup/* .open-tasks/tasks/
```

---

## Configuration

System commands respect configuration in `.open-tasks/config.json`:

```json
{
  "outputDirectory": ".open-tasks/outputs",
  "tasksDirectory": ".open-tasks/tasks",
  "fileNamePattern": "{timestamp}-{token}",
  "timestampFormat": "YYYYMMDD-HHmmss-SSS",
  "defaultContext": "directory",
  "templates": {
    "directory": "./custom-templates",
    "default": "basic"
  }
}
```

See **[[Configuration]]** for full details.

---

## Troubleshooting

### "Directory already exists"

```bash
$ open-tasks init
Error: .open-tasks/ directory already exists
```

**Solution**: Remove the directory or use a different project folder.

### "Cannot create task file"

```bash
$ open-tasks create my-task
Error: Cannot write to .open-tasks/tasks/
```

**Solution**: Ensure `.open-tasks/tasks/` directory exists and is writable. Run `open-tasks init` first.

### "Invalid task name"

```bash
$ open-tasks create My Task
Error: Invalid task name. Use kebab-case.
```

**Solution**: Use kebab-case for task names:
```bash
open-tasks create my-task
```

---

## Best Practices

1. **Run init once** - Per project, not per task
2. **Use kebab-case** - For task names (my-task, not myTask)
3. **Descriptive names** - Choose clear, action-oriented names
4. **Version control** - Commit `.open-tasks/tasks/` but ignore `.open-tasks/outputs/`
5. **Document tasks** - Add clear descriptions in task files

## Next Steps

- **[[Building Tasks]]** - Learn to create custom tasks
- **[[Quick Start]]** - Build your first workflow
- **[[Configuration]]** - Customize settings
- **[[Core Concepts]]** - Understand the architecture
