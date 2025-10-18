---
title: "Core Concepts"
---

# Core Concepts

Understanding the foundational concepts of Open Tasks CLI.

## Overview

Open Tasks CLI is built on a **task-command architecture** where tasks compose commands to build workflows. This page explains the key concepts and how they work together.

## The Task-Command Relationship

```
┌─────────────────────────────────────────────────────────────┐
│  TASK (file in .open-tasks/tasks/)                         │
│  └─ TaskHandler class                                       │
│     └─ execute() method                                     │
│        ├─ Creates Command instances                         │
│        ├─ Runs commands via context.run(command)            │
│        └─ Returns TaskOutcome with logs and results         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  COMMANDS (ICommand implementations)                        │
│                                                              │
│  Pre-built Commands (library):                              │
│  • PowershellCommand(script, args)                          │
│  • ClaudeCommand(prompt, contextRefs)                       │
│  • RegexCommand(pattern, inputRef)                          │
│  • FileCommand(operation, path, data)                       │
│                                                              │
│  Custom Commands (user-defined in task file):               │
│  • class MyCustomCommand implements ICommand { ... }        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW CONTEXT (IWorkflowContext)                        │
│                                                              │
│  • store(value, decorators) → MemoryRef                     │
│  • token(name) → string | undefined                         │
│  • run(command) → MemoryRef[]                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MEMORY REFERENCES (MemoryRef)                              │
│                                                              │
│  { id, token, fileName }                                    │
│  • Outputs from commands                                    │
│  • Inputs to commands                                       │
│  • Tracked in TaskLog entries                               │
└─────────────────────────────────────────────────────────────┘
```

## Tasks

**Tasks** are files in `.open-tasks/tasks/` that define CLI-invokable workflows.

### Key Characteristics

- **Files**: TypeScript/JavaScript files in `.open-tasks/tasks/`
- **Class**: Extend `TaskHandler` abstract class
- **Auto-discovery**: Automatically integrated as CLI commands
- **Composition**: Combine multiple commands to build workflows
- **Output**: Return `TaskOutcome` with logs and errors

### Task Structure

```typescript
import { TaskHandler, IWorkflowContext, TaskOutcome, generateId } from 'open-tasks-cli';

export default class MyTask extends TaskHandler {
  // Required: Task name (used as CLI command)
  static name = 'my-task';
  
  // Required: Description for help text
  static description = 'Does something useful';

  // Required: Execute method
  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'my-task',
      logs: [],
      errors: []
    };

    try {
      // Your workflow logic here
      // Use context.run() to execute commands
      // Track operations in outcome.logs
    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

### Invoking Tasks

```bash
# Task file: .open-tasks/tasks/analyze-repo.ts
# Task name: 'analyze-repo'
open-tasks analyze-repo

# With arguments
open-tasks analyze-repo --verbose ./src
```

## Commands

**Commands** are `ICommand` implementations that perform specific operations.

### Two Types of Commands

**1. Pre-built Commands** - Library commands provided by the framework
```typescript
import { PowershellCommand, ClaudeCommand, FileCommand } from 'open-tasks-cli/commands';

// Use in your tasks
const cmd = new PowershellCommand("git log --oneline -5");
const [logRef] = await context.run(cmd);
```

**2. Custom Commands** - Commands you create within task files
```typescript
class UppercaseCommand implements ICommand {
  constructor(private input: MemoryRef) {}
  
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    const content = await fs.readFile(this.input.fileName, 'utf-8');
    const uppercased = content.toUpperCase();
    
    const resultRef = await context.store(
      uppercased,
      [new TokenDecorator('uppercased')]
    );
    return [resultRef];
  }
}
```

### Command Interface

```typescript
interface ICommand {
  /**
   * Execute the command with the workflow context
   * @param context - WorkflowContext for accessing Context API
   * @returns Promise resolving to MemoryRef[]
   */
  execute(context: IWorkflowContext): Promise<MemoryRef[]>;
}
```

### Command Composition

Commands work together by passing `MemoryRef[]` between operations:

```typescript
// Step 1: Read file
const readCmd = new PowershellCommand("Get-Content README.md");
const [fileRef] = await context.run(readCmd);

// Step 2: Process with AI (uses output from step 1)
const aiCmd = new ClaudeCommand("Summarize this", [fileRef]);
const [summaryRef] = await context.run(aiCmd);

// Step 3: Save to file (uses output from step 2)
const saveCmd = new FileCommand("write", "summary.txt", summaryRef);
await context.run(saveCmd);
```

## IWorkflowContext API

**IWorkflowContext** provides internal functions for workflow processing.

### Key Methods

```typescript
interface IWorkflowContext {
  // Store a value and create a MemoryRef
  store(value: string, transforms: IMemoryDecorator[]): Promise<MemoryRef>;
  
  // Look up the latest value for a token
  token(name: string): string | undefined;
  
  // Execute a command implementation
  run(command: ICommand): Promise<MemoryRef[]>;
}
```

### Usage Examples

**Storing Values**
```typescript
import { TokenDecorator, TimestampDecorator } from 'open-tasks-cli/decorators';

// Store with token
const ref = await context.store(
  "Important data",
  [new TokenDecorator('mydata')]
);

// Store with timestamp
const ref = await context.store(
  "Analysis results",
  [new TimestampDecorator()]
);
```

**Looking Up Tokens**
```typescript
// Get the latest value for a token
const value = context.token('mydata');

if (value) {
  console.log(`Found: ${value}`);
}
```

**Running Commands**
```typescript
// Execute command and get results
const cmd = new PowershellCommand("git status");
const [statusRef] = await context.run(cmd);

// Use results in next command
const analyzeCmd = new ClaudeCommand("What's the repo status?", [statusRef]);
await context.run(analyzeCmd);
```

## MemoryRef

**MemoryRef** objects track stored values and command outputs.

### Structure

```typescript
interface MemoryRef {
  id: string;         // Unique identifier (UUID)
  token?: string;     // Optional token name
  fileName: string;   // Path to output file
}
```

### How MemoryRefs Work

1. **Created** - When you store a value or run a command
2. **Decorated** - IMemoryDecorators transform the ref (set fileName, token, etc.)
3. **Persisted** - Content saved to `.open-tasks/outputs/{timestamp}-{task-name}/`
4. **Passed** - As inputs to subsequent commands
5. **Tracked** - In TaskLog entries for auditing

### Example Flow

```typescript
// Command creates MemoryRef
const cmd = new PowershellCommand("echo 'Hello'");
const [ref] = await context.run(cmd);

console.log(ref.id);        // "uuid-123-456"
console.log(ref.fileName);  // "20251018T143022456Z-hello.txt"
// Full path: .open-tasks/outputs/20251018T143022456Z-task-name/20251018T143022456Z-hello.txt

// MemoryRef passed to next command
const nextCmd = new ProcessCommand(ref);
await context.run(nextCmd);
```

## TaskOutcome

**TaskOutcome** provides structured results from task execution.

### Structure

```typescript
interface TaskOutcome {
  id: string;           // Unique task execution ID
  name: string;         // Task name
  logs: TaskLog[];      // Operation logs
  errors: string[];     // Error messages
}
```

### TaskLog Entries

```typescript
interface TaskLog {
  id: string;           // MemoryRef ID
  token?: string;       // MemoryRef token
  fileName: string;     // MemoryRef file
  command: string;      // Command type executed
  args: any[];          // Command arguments
  start: Date;          // Start timestamp
  end: Date;            // End timestamp
}
```

### Building TaskOutcome

```typescript
const outcome: TaskOutcome = {
  id: generateId(),
  name: 'my-task',
  logs: [],
  errors: []
};

try {
  // Execute operations
  const cmd = new PowershellCommand("git log");
  const [ref] = await context.run(cmd);
  
  // Track in logs
  outcome.logs.push({
    ...ref,
    command: 'PowershellCommand',
    args: ["git log"],
    start: new Date(),
    end: new Date()
  });
} catch (error) {
  outcome.errors.push(error.message);
}

return outcome;
```

## Three-Layer Architecture

Open Tasks CLI maintains clear separation of concerns:

### Layer 1: IWorkflowContext (Internal API)
- **Purpose**: Internal functions used by task and command implementations
- **Visibility**: NOT exposed to end users directly
- **Functions**: `store()`, `token()`, `run()`

### Layer 2: Tasks (User-Facing CLI)
- **Purpose**: CLI commands users invoke
- **Types**: System commands (`init`, `create`) and user tasks
- **Visibility**: Public CLI interface

### Layer 3: Commands (Composable Operations)
- **Purpose**: Executable operations that compose workflows
- **Types**: Pre-built (library) and custom (user-defined)
- **Interface**: `ICommand` with `execute()` method

## System Commands

Special commands for project management:

**`init`** - Initialize project structure
```bash
open-tasks init
```

**`create`** - Scaffold new task templates
```bash
open-tasks create my-new-task
```

These are built into the framework and not located in `.open-tasks/tasks/`.

## Summary

**Key Takeaways:**

1. **Tasks** are files that compose commands
2. **Commands** are operations that use MemoryRef I/O
3. **IWorkflowContext** provides internal API for tasks
4. **MemoryRef** tracks values between operations
5. **TaskOutcome** provides structured results
6. Tasks invoke via CLI: `open-tasks <task-name>`
7. Commands execute via context: `context.run(command)`

## Next Steps

- **[[Building Tasks]]** - Create custom workflow tasks
- **[[Using Commands]]** - Explore the command library
- **[[Managing Context]]** - Master MemoryRef and tokens
- **[[Architecture]]** - Deep dive into the design
