---
title: "Architecture"
---

# Architecture

Understanding the design and structure of Open Tasks CLI.

## Overview

Open Tasks CLI is built on a **three-layer architecture** that provides clear separation between internal APIs, user-facing commands, and composable operations.

## Three-Layer Design

### Layer 1: IWorkflowContext (Internal API)

**Purpose**: Internal functions used by task and command implementations  
**Visibility**: NOT exposed to end users directly

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

**Key Point**: Users NEVER invoke `context.store()` directly from the CLI. These are implementation details used within tasks.

### Layer 2: Tasks (User-Facing CLI Commands)

**Purpose**: Tasks users invoke via `open-tasks <task-name>`  
**Visibility**: Public CLI interface

**Two Types:**

**1. System Commands** - Project management
```bash
open-tasks init     # Initialize project structure
open-tasks create   # Scaffold task templates
```

**2. User Tasks** - Custom workflows
```bash
open-tasks analyze-repo   # User-defined task
open-tasks process-data   # User-defined task
```

- Located in `.open-tasks/tasks/`
- Extend `TaskHandler` abstract class
- Compose commands to build workflows
- Auto-discovered and exposed as CLI commands

### Layer 3: Commands (Composable Operations)

**Purpose**: Executable operations composed within tasks  
**Visibility**: API for task developers

**Two Types:**

**1. Pre-built Commands** - Library commands
```typescript
import { PowershellCommand, ClaudeCommand, FileCommand } from 'open-tasks-cli/commands';
```

**2. Custom Commands** - User-defined ICommand implementations
```typescript
class MyCustomCommand implements ICommand {
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    // Custom logic
  }
}
```

## Architectural Diagram

```
┌─────────────────────────────────────────────────────┐
│  USER                                                │
│  Invokes: open-tasks analyze-repo                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 2: Tasks (CLI Commands)                      │
│  • System Commands (init, create)                   │
│  • User Tasks (.open-tasks/tasks/*.ts)              │
│  • TaskHandler implementations                      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 3: Commands (ICommand implementations)       │
│  • Pre-built Commands (library)                     │
│    - PowershellCommand                              │
│    - ClaudeCommand                                  │
│    - RegexCommand                                   │
│  • Custom Commands (user-defined)                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 1: IWorkflowContext (Internal API)           │
│  • context.store()                                  │
│  • context.token()                                  │
│  • context.run()                                    │
│  (NOT exposed to users)                             │
└─────────────────────────────────────────────────────┘
```

## Core Types

### TaskHandler

Abstract class for CLI-invokable tasks:

```typescript
abstract class TaskHandler {
  static name: string;          // Task name (CLI command)
  static description: string;   // Help text
  
  abstract execute(
    args: string[],               // CLI arguments
    context: IWorkflowContext     // Workflow API
  ): Promise<TaskOutcome>;        // Structured results
}
```

### ICommand

Interface for executable operations:

```typescript
interface ICommand {
  execute(context: IWorkflowContext): Promise<MemoryRef[]>;
}
```

### TaskOutcome

Structured result from task execution:

```typescript
interface TaskOutcome {
  id: string;           // Unique execution ID
  name: string;         // Task name
  logs: TaskLog[];      // Operation logs
  errors: string[];     // Error messages
}
```

### TaskLog

Tracking entry for each operation:

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

### MemoryRef

Reference to stored values:

```typescript
interface MemoryRef {
  id: string;         // Unique identifier (UUID)
  token?: string;     // Optional token name
  fileName: string;   // Path to output file
}
```

## Command Flow

### 1. CLI Invocation

```bash
open-tasks analyze-repo ./src
```

### 2. Task Discovery

- CLI scans `.open-tasks/tasks/` directory
- Finds `analyze-repo.ts` (or `.js`)
- Loads TaskHandler class

### 3. Task Execution

```typescript
export default class AnalyzeRepoTask extends TaskHandler {
  static name = 'analyze-repo';
  
  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    // Execute workflow
  }
}
```

### 4. Command Composition

```typescript
// Task composes commands
const cmd1 = new PowershellCommand("git log --oneline -10");
const [logRef] = await context.run(cmd1);

const cmd2 = new ClaudeCommand("Analyze this git history", [logRef]);
const [analysisRef] = await context.run(cmd2);
```

### 5. Context Operations

```typescript
// IWorkflowContext handles:
// - Storing values → MemoryRef
// - Looking up tokens
// - Running commands
// - Managing outputs
```

### 6. Result Return

```typescript
return {
  id: generateId(),
  name: 'analyze-repo',
  logs: [/* TaskLog entries */],
  errors: []
};
```

## Data Flow

### MemoryRef Chain

```
PowershellCommand
    ↓
  MemoryRef { id: "uuid-1", fileName: ".open-tasks/outputs/..." }
    ↓
ClaudeCommand (uses uuid-1 as input)
    ↓
  MemoryRef { id: "uuid-2", fileName: ".open-tasks/outputs/..." }
    ↓
FileCommand (uses uuid-2 to write file)
```

### Context Store Flow

```typescript
// 1. Store value
const ref = await context.store(
  "data",
  [new TokenDecorator('mytoken')]
);

// 2. Creates file
// .open-tasks/outputs/20251018-143022-456-mytoken.txt

// 3. Returns MemoryRef
{
  id: "uuid-123",
  token: "mytoken",
  fileName: ".open-tasks/outputs/20251018-143022-456-mytoken.txt"
}

// 4. Later retrieval
const value = context.token('mytoken');  // Returns file content
```

## Directory Structure

```
your-project/
├── .open-tasks/
│   ├── tasks/                           # User tasks (Layer 2)
│   │   ├── analyze-repo.ts
│   │   ├── process-data.ts
│   │   └── ...
│   ├── outputs/                         # Task execution outputs
│   │   ├── 20251018T140000000Z-analyze-repo/
│   │   │   ├── 20251018T140001000Z-log.txt
│   │   │   └── 20251018T140002000Z-analysis.md
│   │   └── 20251018T150000000Z-process-data/
│   │       └── 20251018T150001000Z-result.txt
│   └── config.json                      # Configuration
├── src/                                  # Your application code
└── package.json
```

## Component Responsibilities

### CLI Entry Point

- Parse command-line arguments
- Load configuration
- Initialize services
- Route to appropriate TaskHandler

### Task Discovery

- Scan `.open-tasks/tasks/` directory
- Load TypeScript/JavaScript files
- Register TaskHandler classes
- Map task names to handlers

### Task Execution

- Validate arguments
- Create IWorkflowContext instance
- Execute task's `execute()` method
- Collect TaskOutcome
- Display results

### IWorkflowContext

- Manage MemoryRef creation and storage
- Provide token lookup functionality
- Execute ICommand implementations
- Track operations in context

### Output Management

- Create timestamped files in `.open-tasks/outputs/`
- Apply decorators (token, timestamp, custom)
- Manage file lifecycle
- Provide content retrieval

### Terminal Formatting

- Color-coded output (chalk)
- Progress indicators (ora)
- Structured result display
- Error highlighting

## Design Principles

### 1. Separation of Concerns

- **Layer 1**: Internal workflow processing
- **Layer 2**: User-facing CLI commands
- **Layer 3**: Composable operations

### 2. Explicit Context Passing

- No global state
- Context passed through IWorkflowContext
- Clear data dependencies

### 3. Command Composition

- Small, focused commands
- Chain via MemoryRef passing
- Reusable building blocks

### 4. Observable Execution

- TaskOutcome with full logs
- TaskLog entries for each operation
- File outputs for persistence

### 5. Extensibility

- User tasks in `.open-tasks/tasks/`
- Custom ICommand implementations
- Decorator pattern for MemoryRef
- Plugin architecture

### 6. Type Safety

- TypeScript interfaces throughout
- Compile-time validation
- Clear API contracts

### 7. Async-First

- All operations async
- Promise-based APIs
- Non-blocking execution

## Implementation Contexts

### InMemoryWorkflowContext

Store values in memory (for testing):

```typescript
class InMemoryWorkflowContext implements IWorkflowContext {
  private storage: Map<string, string> = new Map();
  
  async store(value: string, decorators: IMemoryDecorator[]): Promise<MemoryRef> {
    // Store in Map, return MemoryRef
  }
}
```

### DirectoryOutputContext

Store values as files (production):

```typescript
class DirectoryOutputContext implements IWorkflowContext {
  async store(value: string, decorators: IMemoryDecorator[]): Promise<MemoryRef> {
    // Create timestamped file in .open-tasks/outputs/
    // Return MemoryRef pointing to file
  }
}
```

### Future: RemoteOutputContext

Store values remotely (cloud storage):

```typescript
class RemoteOutputContext implements IWorkflowContext {
  async store(value: string, decorators: IMemoryDecorator[]): Promise<MemoryRef> {
    // Upload to S3/Azure Blob
    // Return MemoryRef with URL
  }
}
```

## Command Patterns

### Simple Command

```typescript
class EchoCommand implements ICommand {
  constructor(private message: string) {}
  
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    const ref = await context.store(
      this.message,
      [new TokenDecorator('echo')]
    );
    return [ref];
  }
}
```

### Transform Command

```typescript
class UppercaseCommand implements ICommand {
  constructor(private input: MemoryRef) {}
  
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    const content = await fs.readFile(this.input.fileName, 'utf-8');
    const uppercased = content.toUpperCase();
    
    const ref = await context.store(
      uppercased,
      [new TokenDecorator('uppercased')]
    );
    return [ref];
  }
}
```

### Multi-Output Command

```typescript
class SplitCommand implements ICommand {
  constructor(private input: MemoryRef, private delimiter: string) {}
  
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    const content = await fs.readFile(this.input.fileName, 'utf-8');
    const parts = content.split(this.delimiter);
    
    const refs: MemoryRef[] = [];
    for (let i = 0; i < parts.length; i++) {
      const ref = await context.store(
        parts[i],
        [new TokenDecorator(`part-${i}`)]
      );
      refs.push(ref);
    }
    
    return refs;
  }
}
```

## Summary

**Key Architectural Points:**

1. **Three layers** - Clear separation of internal API, CLI, and operations
2. **Task-Command pattern** - Tasks compose commands to build workflows
3. **Explicit context** - IWorkflowContext passed through operations
4. **MemoryRef chain** - Data flows via reference passing
5. **Observable** - TaskOutcome provides complete execution trace
6. **Extensible** - User tasks and custom commands
7. **Type-safe** - TypeScript throughout
8. **Async-first** - Promise-based APIs

## Next Steps

- **[[Core Concepts]]** - Understand the fundamentals
- **[[Building Tasks]]** - Create custom workflows
- **[[Creating Commands]]** - Build custom ICommand implementations
- **[[Workflow API]]** - Deep dive into IWorkflowContext
