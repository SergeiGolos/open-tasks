---
title: "Quick Start"
---

# Quick Start

Get up and running with Open Tasks CLI in 5 minutes. Learn the basics of building AI-powered workflows.

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
├── commands/     # Your custom commands (deprecated, use for compatibility)
├── outputs/      # Command execution outputs (timestamped per run)
└── config.json   # Configuration (optional)
```

**Directory Isolation**: Each command execution creates its own timestamped directory:
```
.open-tasks/outputs/
└── 20240119T143022-store/
    └── data.txt
```

## Step 2: Try Built-in Commands

Let's use some built-in commands to understand the workflow:

### Store and Reference Data

```bash
# Store a simple value
open-tasks store "Hello, World!" --token greeting

# You'll see output like:
# ✅ Stored with token: greeting
# 📁 File: .open-tasks/outputs/20240119-143022-store/greeting.txt
```

### Load a File

```bash
# Create a test file
echo "OpenTasks is awesome!" > test.txt

# Load it
open-tasks load test.txt --token content

# Output shows where it's stored
```

### Chain Commands

```bash
# Extract data from the stored content
open-tasks extract "[A-Z][a-z]+" --ref content --all

# This extracts all capitalized words
```

## Step 3: Create a Custom Command

Now let's create a custom command:

```bash
open-tasks create word-count
```

This creates `.open-tasks/commands/word-count.ts`.

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


## Common Workflow Patterns

### Pattern 1: Store and Reference

```bash
# Store data
open-tasks store "important data" --token mydata

# Load file
open-tasks load ./input.txt --token source

# Use references together
open-tasks replace "Data: {{mydata}}, Source: {{source}}" --ref mydata --ref source
```

### Pattern 2: Command Chaining

```bash
# Step 1: Load file
open-tasks load README.md --token readme

# Step 2: Extract information
open-tasks extract "version.*" --ref readme --token version

# Step 3: Use extracted data
open-tasks store "Version is: {{version}}" --ref version
```

### Pattern 3: AI-Powered Analysis

```bash
# Configure AI CLI first (if not done)
echo '{"command":"gh copilot suggest","contextFlag":"-t","timeout":30000}' > .open-tasks/ai-config.json

# Gather context
open-tasks load ./src/api.ts --token code
open-tasks powershell "git log --oneline -5" --token history

# Analyze with AI
open-tasks ai-cli "Review this code and its history" --ref code --ref history
```

## What's Next?

Now that you understand the basics, explore:

- **[[Commands]]** - Complete command reference
- **[[Example-Tasks]]** - Real-world examples (code review, news summary)
- **[[Building-Custom-Commands]]** - Create reusable commands
- **[[Building-Custom-Tasks]]** - Build complex workflows
- **[[Architecture]]** - Understand the system design

## Common Operations

### Working with Files

```bash
# Load multiple files
open-tasks load file1.txt --token f1
open-tasks load file2.txt --token f2
open-tasks load file3.txt --token f3

# Combine with template
open-tasks replace "Files:\n{{f1}}\n{{f2}}\n{{f3}}" --ref f1 --ref f2 --ref f3
```

### Shell Commands

```bash
# Execute git commands
open-tasks powershell "git status --short" --token status
open-tasks powershell "git log --oneline -10" --token log

# System information
open-tasks powershell "Get-Process | Select-Object -First 10" --token processes
```

### Data Extraction

```bash
# Extract emails
open-tasks load contacts.txt --token contacts
open-tasks extract "[a-z]+@[a-z.]+" --ref contacts --all --token emails

# Extract URLs
open-tasks load webpage.html --token html
open-tasks extract 'href="([^"]+)"' --ref html --all --token urls
```

## Getting Help

```bash
# General help
open-tasks --help

# Command-specific help
open-tasks store --help
open-tasks ai-cli --help

# Check version
open-tasks --version
```

## Troubleshooting

**Command not found?**
```bash
# Check installation
npm list -g open-tasks-cli

# Reinstall if needed
npm install -g open-tasks-cli
```

**Reference not found?**
- References only exist during the CLI session
- Use files for persistent storage between runs
- Check token names are correct

**AI CLI not working?**
```bash
# Verify configuration
cat .open-tasks/ai-config.json

# Test AI CLI directly
gh copilot suggest "test prompt"
```

For more help, see:
- **[[Installation]]** - Installation and setup
- **[[Commands]]** - Full command documentation
- **[[Developer-Guide]]** - Contributing and development
