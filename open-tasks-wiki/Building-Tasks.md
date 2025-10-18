---
title: "Building Tasks"
---

# Building Tasks

Learn how to create custom workflow tasks with Open Tasks CLI.

## Overview

Tasks are TypeScript/JavaScript files in `.open-tasks/tasks/` that compose commands to build workflows. They extend the `TaskHandler` abstract class and are automatically discovered and integrated as CLI commands.

## Quick Start

### 1. Create Task Template

```bash
open-tasks create my-task
```

This creates `.open-tasks/tasks/my-task.ts` with a complete template.

### 2. Edit the Task

Open the generated file and customize it:

```typescript
import { TaskHandler, IWorkflowContext, TaskOutcome, generateId } from 'open-tasks-cli';
import { PowershellCommand } from 'open-tasks-cli/commands';

export default class MyTask extends TaskHandler {
  static name = 'my-task';
  static description = 'My custom workflow';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    // Your workflow logic here
  }
}
```

### 3. Run Your Task

```bash
open-tasks my-task arg1 arg2
```

## Task Structure

### Required Elements

Every task must have:

```typescript
export default class MyTask extends TaskHandler {
  // 1. Name: Used as CLI command
  static name = 'my-task';
  
  // 2. Description: Shown in help text
  static description = 'What this task does';

  // 3. Execute method: Workflow logic
  async execute(
    args: string[],           // CLI arguments
    context: IWorkflowContext // Workflow API
  ): Promise<TaskOutcome> {   // Structured results
    // Implementation
  }
}
```

### TaskOutcome Structure

Always return a properly formed `TaskOutcome`:

```typescript
const outcome: TaskOutcome = {
  id: generateId(),      // Unique execution ID
  name: 'my-task',       // Task name
  logs: [],              // Operation logs (TaskLog[])
  errors: []             // Error messages (string[])
};
```

## Composing Commands

### Using Pre-built Commands

Import and use commands from the library:

```typescript
import { 
  PowershellCommand, 
  ClaudeCommand, 
  FileCommand,
  RegexCommand 
} from 'open-tasks-cli/commands';

// In your execute() method:
const cmd = new PowershellCommand("git status");
const [statusRef] = await context.run(cmd);
```

### Chaining Commands

Pass `MemoryRef` outputs as inputs to subsequent commands:

```typescript
async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
  const outcome = this.initOutcome();

  // Step 1: Read file
  const readCmd = new PowershellCommand(`Get-Content ${args[0]}`);
  const [fileRef] = await context.run(readCmd);
  
  this.logCommand(outcome, fileRef, 'PowershellCommand', [`Get-Content ${args[0]}`]);

  // Step 2: Process with AI (using output from step 1)
  const aiCmd = new ClaudeCommand("Summarize this file", [fileRef]);
  const [summaryRef] = await context.run(aiCmd);
  
  this.logCommand(outcome, summaryRef, 'ClaudeCommand', ["Summarize this file"]);

  // Step 3: Extract key points (using output from step 2)
  const extractCmd = new RegexCommand(/^- (.+)$/gm, summaryRef);
  const [pointsRef] = await context.run(extractCmd);
  
  this.logCommand(outcome, pointsRef, 'RegexCommand', [/^- (.+)$/gm]);

  return outcome;
}
```

### Creating Custom Commands

Define commands within your task file:

```typescript
import { ICommand, MemoryRef, IWorkflowContext } from 'open-tasks-cli';
import { TokenDecorator } from 'open-tasks-cli/decorators';
import * as fs from 'fs/promises';

// Custom command implementation
class UppercaseCommand implements ICommand {
  constructor(private input: MemoryRef) {}
  
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    // Read from input MemoryRef
    const content = await fs.readFile(this.input.fileName, 'utf-8');
    
    // Transform
    const uppercased = content.toUpperCase();
    
    // Store and return new MemoryRef
    const resultRef = await context.store(
      uppercased,
      [new TokenDecorator('uppercased')]
    );
    
    return [resultRef];
  }
}

// Use in your task
export default class MyTask extends TaskHandler {
  static name = 'uppercase-task';
  static description = 'Convert text to uppercase';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome = this.initOutcome();

    // Store input
    const inputRef = await context.store(args[0], [new TokenDecorator('input')]);
    
    // Use custom command
    const cmd = new UppercaseCommand(inputRef);
    const [outputRef] = await context.run(cmd);
    
    this.logCommand(outcome, outputRef, 'UppercaseCommand', [args[0]]);

    return outcome;
  }
}
```

## Working with Context

### Storing Values

Use `context.store()` to create MemoryRefs:

```typescript
import { TokenDecorator, TimestampDecorator } from 'open-tasks-cli/decorators';

// Store with token
const ref = await context.store(
  "My data",
  [new TokenDecorator('mytoken')]
);

// Store with timestamp
const ref = await context.store(
  "Timestamped data",
  [new TimestampDecorator()]
);

// Store with multiple decorators
const ref = await context.store(
  "Complex data",
  [
    new TokenDecorator('analysis'),
    new TimestampDecorator(),
    new CustomDecorator()
  ]
);
```

### Retrieving Tokens

Use `context.token()` to look up stored values:

```typescript
// Get the latest value for a token
const value = context.token('mytoken');

if (value) {
  console.log(`Found: ${value}`);
  // Use in workflow
} else {
  console.log('Token not found');
}
```

### Running Commands

Use `context.run()` to execute commands:

```typescript
// Execute and get results
const cmd = new PowershellCommand("ls -la");
const memoryRefs = await context.run(cmd);

// Most commands return array with one MemoryRef
const [outputRef] = memoryRefs;

// Some commands may return multiple MemoryRefs
const [ref1, ref2, ...rest] = memoryRefs;
```

## Handling Arguments

### Accessing Arguments

```typescript
async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
  // args[0] = first argument
  // args[1] = second argument
  // args.length = number of arguments

  const filename = args[0] || 'default.txt';
  const mode = args[1] || 'normal';

  console.log(`Processing ${filename} in ${mode} mode`);
  
  // Use in workflow
}
```

### Validation

```typescript
async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
  const outcome = this.initOutcome();

  // Validate required arguments
  if (args.length < 1) {
    outcome.errors.push('Usage: open-tasks my-task <filename>');
    return outcome;
  }

  // Validate file exists
  const filename = args[0];
  if (!await this.fileExists(filename)) {
    outcome.errors.push(`File not found: ${filename}`);
    return outcome;
  }

  // Continue with workflow...
  return outcome;
}

private async fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
```

## Logging Operations

### Adding to TaskLog

Track each operation in the logs:

```typescript
async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
  const outcome = this.initOutcome();

  try {
    const cmd = new PowershellCommand("git log");
    const [logRef] = await context.run(cmd);
    
    // Add to TaskLog
    outcome.logs.push({
      id: logRef.id,
      token: logRef.token,
      fileName: logRef.fileName,
      command: 'PowershellCommand',
      args: ["git log"],
      start: new Date(),
      end: new Date()
    });

  } catch (error) {
    outcome.errors.push(error.message);
  }

  return outcome;
}
```

### Helper Method Pattern

Create a helper for consistent logging:

```typescript
export default class MyTask extends TaskHandler {
  static name = 'my-task';
  static description = 'My task';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome = this.initOutcome();

    try {
      const cmd = new PowershellCommand("ls");
      const [ref] = await context.run(cmd);
      
      this.logCommand(outcome, ref, 'PowershellCommand', ["ls"]);
      
    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }

  private initOutcome(): TaskOutcome {
    return {
      id: generateId(),
      name: MyTask.name,
      logs: [],
      errors: []
    };
  }

  private logCommand(
    outcome: TaskOutcome, 
    ref: MemoryRef, 
    command: string, 
    args: any[]
  ): void {
    outcome.logs.push({
      ...ref,
      command,
      args,
      start: new Date(),
      end: new Date()
    });
  }
}
```

## Error Handling

### Try-Catch Pattern

```typescript
async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
  const outcome = this.initOutcome();

  try {
    // Your workflow logic
    const cmd = new PowershellCommand("risky-command");
    const [ref] = await context.run(cmd);
    
    this.logCommand(outcome, ref, 'PowershellCommand', ["risky-command"]);
    
  } catch (error) {
    // Add to errors
    outcome.errors.push(`Failed: ${error.message}`);
    
    // Optional: Add stack trace in verbose mode
    if (process.env.VERBOSE) {
      outcome.errors.push(error.stack);
    }
  }

  return outcome;
}
```

### Partial Failures

```typescript
async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
  const outcome = this.initOutcome();

  // Step 1: Always runs
  try {
    const cmd1 = new PowershellCommand("step1");
    const [ref1] = await context.run(cmd1);
    this.logCommand(outcome, ref1, 'PowershellCommand', ["step1"]);
  } catch (error) {
    outcome.errors.push(`Step 1 failed: ${error.message}`);
    // Continue to step 2
  }

  // Step 2: Runs even if step 1 fails
  try {
    const cmd2 = new PowershellCommand("step2");
    const [ref2] = await context.run(cmd2);
    this.logCommand(outcome, ref2, 'PowershellCommand', ["step2"]);
  } catch (error) {
    outcome.errors.push(`Step 2 failed: ${error.message}`);
  }

  return outcome;
}
```

## Complete Examples

### Example 1: Code Analysis Task

```typescript
import { TaskHandler, IWorkflowContext, TaskOutcome, generateId } from 'open-tasks-cli';
import { PowershellCommand, ClaudeCommand, FileCommand } from 'open-tasks-cli/commands';
import { TokenDecorator } from 'open-tasks-cli/decorators';

export default class AnalyzeCodeTask extends TaskHandler {
  static name = 'analyze-code';
  static description = 'Analyze code file with AI and generate report';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'analyze-code',
      logs: [],
      errors: []
    };

    const filename = args[0];

    if (!filename) {
      outcome.errors.push('Usage: open-tasks analyze-code <file>');
      return outcome;
    }

    try {
      // 1. Read the code file
      const readCmd = new PowershellCommand(`Get-Content ${filename}`);
      const [codeRef] = await context.run(readCmd);
      
      outcome.logs.push({
        ...codeRef,
        command: 'PowershellCommand',
        args: [`Get-Content ${filename}`],
        start: new Date(),
        end: new Date()
      });

      // 2. Analyze with AI
      const analyzeCmd = new ClaudeCommand(
        "Analyze this code for bugs, performance issues, and best practices. Provide a detailed report.",
        [codeRef]
      );
      const [analysisRef] = await context.run(analyzeCmd);
      
      outcome.logs.push({
        ...analysisRef,
        command: 'ClaudeCommand',
        args: ["Analyze this code..."],
        start: new Date(),
        end: new Date()
      });

      // 3. Save report
      const saveCmd = new FileCommand(
        "write",
        `${filename}.analysis.md`,
        analysisRef
      );
      await context.run(saveCmd);

      console.log(`✓ Analysis complete: ${filename}.analysis.md`);

    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

### Example 2: Multi-File Processing

```typescript
import { TaskHandler, IWorkflowContext, TaskOutcome, generateId, MemoryRef } from 'open-tasks-cli';
import { PowershellCommand, ClaudeCommand } from 'open-tasks-cli/commands';

export default class ProcessProjectTask extends TaskHandler {
  static name = 'process-project';
  static description = 'Process all TypeScript files in a directory';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'process-project',
      logs: [],
      errors: []
    };

    const directory = args[0] || './src';

    try {
      // 1. Get list of TypeScript files
      const listCmd = new PowershellCommand(
        `Get-ChildItem -Path ${directory} -Filter *.ts -Recurse | Select-Object -ExpandProperty FullName`
      );
      const [filesRef] = await context.run(listCmd);
      
      outcome.logs.push({
        ...filesRef,
        command: 'PowershellCommand',
        args: [`Get-ChildItem...`],
        start: new Date(),
        end: new Date()
      });

      // 2. Read all files
      const fileRefs: MemoryRef[] = [];
      const files = (await context.token(filesRef.token!))?.split('\n') || [];
      
      for (const file of files) {
        if (!file.trim()) continue;
        
        const readCmd = new PowershellCommand(`Get-Content ${file}`);
        const [fileRef] = await context.run(readCmd);
        fileRefs.push(fileRef);
        
        outcome.logs.push({
          ...fileRef,
          command: 'PowershellCommand',
          args: [`Get-Content ${file}`],
          start: new Date(),
          end: new Date()
        });
      }

      // 3. Analyze all files together
      const analyzeCmd = new ClaudeCommand(
        "Analyze this project's codebase and provide an architectural overview",
        fileRefs
      );
      const [summaryRef] = await context.run(analyzeCmd);
      
      outcome.logs.push({
        ...summaryRef,
        command: 'ClaudeCommand',
        args: ["Analyze this project's codebase..."],
        start: new Date(),
        end: new Date()
      });

      console.log(`✓ Processed ${files.length} files`);
      console.log(`✓ Summary: ${summaryRef.fileName}`);

    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

## Best Practices

1. **Always return TaskOutcome** - Even on errors
2. **Track all operations** - Add to logs for observability
3. **Handle errors gracefully** - Use try-catch and populate errors array
4. **Validate inputs** - Check arguments before processing
5. **Use descriptive names** - Make task names clear and action-oriented
6. **Document usage** - Add clear descriptions
7. **Keep focused** - One task = one workflow
8. **Compose don't duplicate** - Reuse commands, don't reimplement
9. **Test thoroughly** - Verify edge cases and error paths
10. **Clean up** - Remove unused imports and code

## Next Steps

- **[[Using Commands]]** - Explore the command library
- **[[Creating Commands]]** - Build custom ICommand implementations
- **[[Managing Context]]** - Master MemoryRef and tokens
- **[[Workflow API]]** - Deep dive into IWorkflowContext
