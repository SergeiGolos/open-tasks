---
title: "Quick Start"
---

# Quick Start

Get up and running with Open Tasks CLI in 5 minutes.

## Prerequisites

Ensure you have Open Tasks CLI installed. If not, see **[[Installation]]**.

```bash
open-tasks --version  # Verify installation
```

## Step 1: Initialize Your Project

Navigate to your project directory and initialize Open Tasks:

```bash
cd your-project-directory
open-tasks init
```

This creates the `.open-tasks/` directory structure:
```
.open-tasks/
├── tasks/        # Your custom task files
├── outputs/      # Command output files
└── config.json   # Configuration (optional)
```

## Step 2: Create Your First Task

Use the `create` system command to scaffold a task template:

```bash
open-tasks create hello-world
```

This creates `.open-tasks/tasks/hello-world.ts` with a complete template.

## Step 3: Edit Your Task

Open `.open-tasks/tasks/hello-world.ts` and modify it:

```typescript
import { TaskHandler, IWorkflowContext, TaskOutcome, generateId } from 'open-tasks-cli';
import { PowershellCommand } from 'open-tasks-cli/commands';

export default class HelloWorldTask extends TaskHandler {
  static name = 'hello-world';
  static description = 'Say hello to the world';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'hello-world',
      logs: [],
      errors: []
    };

    try {
      // Use PowershellCommand to echo message
      const cmd = new PowershellCommand(`echo "Hello, ${args[0] || 'World'}!"`);
      const [outputRef] = await context.run(cmd);

      outcome.logs.push({
        ...outputRef,
        command: 'PowershellCommand',
        args: [`echo "Hello, ${args[0] || 'World'}!"`],
        start: new Date(),
        end: new Date()
      });

      console.log(`✓ Greeted ${args[0] || 'World'}`);
    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

## Step 4: Run Your Task

Execute your custom task:

```bash
open-tasks hello-world Alice
```

You should see output like:
```
✓ Greeted Alice
Task completed: hello-world
```

## Step 5: Build a Workflow

Let's create a more complex workflow that chains commands:

```bash
open-tasks create analyze-file
```

Edit `.open-tasks/tasks/analyze-file.ts`:

```typescript
import { TaskHandler, IWorkflowContext, TaskOutcome, generateId } from 'open-tasks-cli';
import { PowershellCommand, ClaudeCommand } from 'open-tasks-cli/commands';
import { TokenDecorator } from 'open-tasks-cli/decorators';

export default class AnalyzeFileTask extends TaskHandler {
  static name = 'analyze-file';
  static description = 'Analyze a file using AI';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const filename = args[0];
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'analyze-file',
      logs: [],
      errors: []
    };

    try {
      // 1. Read file with PowershellCommand
      const readCmd = new PowershellCommand(`Get-Content ${filename}`);
      const [fileRef] = await context.run(readCmd);
      
      outcome.logs.push({
        ...fileRef,
        command: 'PowershellCommand',
        args: [`Get-Content ${filename}`],
        start: new Date(),
        end: new Date()
      });

      // 2. Analyze with ClaudeCommand
      const analyzeCmd = new ClaudeCommand(
        "Analyze this file and provide a brief summary",
        [fileRef]
      );
      const [analysisRef] = await context.run(analyzeCmd);
      
      outcome.logs.push({
        ...analysisRef,
        command: 'ClaudeCommand',
        args: ["Analyze this file and provide a brief summary"],
        start: new Date(),
        end: new Date()
      });

      // 3. Store with token for later use
      const finalRef = await context.store(
        await context.token('analysis'),
        [new TokenDecorator('file-analysis')]
      );

      console.log(`✓ Analysis saved with token: file-analysis`);
      console.log(`✓ Output file: ${finalRef.fileName}`);

    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

Run it:

```bash
open-tasks analyze-file ./README.md
```

## Common Patterns

### Pattern 1: Store and Retrieve

```bash
# Store a value
open-tasks store "important data" --token mydata

# Load and process
open-tasks load ./input.txt --token source
open-tasks process --ref source --ref mydata
```

### Pattern 2: Chain Operations

```typescript
// In your task file
const step1 = new PowershellCommand("git log --oneline -5");
const [logRef] = await context.run(step1);

const step2 = new ClaudeCommand("Summarize these commits", [logRef]);
const [summaryRef] = await context.run(step2);

const step3 = new FileCommand("write", "summary.md", summaryRef);
await context.run(step3);
```

### Pattern 3: Multiple Inputs

```typescript
// Gather multiple contexts
const readme = new PowershellCommand("Get-Content README.md");
const [readmeRef] = await context.run(readme);

const package = new PowershellCommand("Get-Content package.json");
const [pkgRef] = await context.run(package);

// Process together
const analyze = new ClaudeCommand(
  "Describe this project based on its README and package.json",
  [readmeRef, pkgRef]
);
const [descRef] = await context.run(analyze);
```

## What's Next?

Now that you've created your first tasks, explore:

- **[[Core Concepts]]** - Understand the architecture
- **[[Building Tasks]]** - Advanced task development
- **[[Using Commands]]** - Full command library
- **[[Managing Context]]** - Work with MemoryRef and tokens

## Getting Help

```bash
# Get help for any command
open-tasks --help

# Get help for a specific task
open-tasks hello-world --help

# List all available tasks
open-tasks list
```

## Troubleshooting

**Task not found?**
- Ensure you ran `open-tasks init`
- Check that your task file is in `.open-tasks/tasks/`
- Verify the task exports a default class extending TaskHandler

**Import errors?**
- Ensure you have `open-tasks-cli` installed locally in your project
- Check your TypeScript configuration

**Command execution fails?**
- Check the `.open-tasks/outputs/` directory for error logs
- Enable verbose mode: `open-tasks --verbose <task-name>`

See **[[Troubleshooting]]** for more help.
