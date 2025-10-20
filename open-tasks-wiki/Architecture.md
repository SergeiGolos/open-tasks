# Architecture

A comprehensive overview of Open Tasks CLI architecture, design principles, and core concepts.

## Overview

Open Tasks CLI is built on a **workflow orchestration framework** that separates concerns into distinct, composable layers. The architecture follows functional programming principles with immutable data flow and explicit state management.

---

## Core Concepts

### 1. Commands (ICommand)

**Single-responsibility execution units** that perform specific operations.

```typescript
interface ICommand {
  execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]>;
}
```

**Characteristics:**
- **Stateless** - No side effects on execution context
- **Composable** - Can be chained with other commands
- **Reusable** - Same command, different contexts
- **Testable** - Pure functions, easy to test

**Examples:** `SetCommand`, `ReadCommand`, `TemplateCommand`, `AgentCommand`

### 2. Tasks (ITaskHandler)

**Workflow orchestrators** that coordinate multiple commands to accomplish complex goals.

```typescript
interface ITaskHandler {
  name: string;
  description: string;
  examples: string[];
  
  execute(
    args: string[],
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

**Characteristics:**
- **CLI-exposed** - Available as `ot <task-name>`
- **Stateful** - Manage workflow state
- **Context-aware** - Use ExecutionContext
- **Coordinating** - Chain multiple commands

**Examples:** `init`, `create`, `code-review`, `news-summary`

### 3. Workflow Context (IFlow)

**Execution environment** that manages state and provides services to commands.

```typescript
interface IFlow {
  cwd: string;
  outputDir: string;
  Tokens: Map<string, StringRef>;
  
  run(command: ICommand): Promise<StringRef[]>;
  get(ref: StringRef): Promise<string | undefined>;
  set(value: any, decorators?: IRefDecorator[]): Promise<StringRef>;
}
```

**Responsibilities:**
- Execute commands
- Manage reference storage
- Handle file I/O
- Maintain token registry

### 4. References (StringRef)

**Immutable handles** to stored values.

```typescript
interface StringRef {
  id: string;           // Unique UUID
  token?: string;       // Optional named token
  timestamp?: Date;     // Creation timestamp
  fileName?: string;    // Associated file path
}
```

**Purpose:**
- Enable value passing between commands
- Avoid in-memory data duplication
- Support lazy evaluation
- Provide audit trail

### 5. Decorators (IRefDecorator)

**Metadata enrichment** for references.

```typescript
interface IRefDecorator {
  decorate(ref: StringRef): StringRef;
}
```

**Built-in Decorators:**
- `TokenDecorator` - Add named token
- `TimestampedFileNameDecorator` - Add timestamped filename

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLI Layer (index.ts)                │
│  • Argument parsing (Commander.js)                      │
│  • Task routing                                         │
│  • Global options handling                              │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  Task Layer (ITaskHandler)              │
│  • User-facing workflows                                │
│  • Argument validation                                  │
│  • Progress reporting                                   │
│  • Error handling                                       │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│              Command Layer (ICommand)                   │
│  • Atomic operations                                    │
│  • Reference-based I/O                                  │
│  • Composable units                                     │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│           Workflow Context (IFlow)                      │
│  • Reference management                                 │
│  • File I/O                                             │
│  • Token registry                                       │
│  • Command execution                                    │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  Storage Layer                          │
│  • File system (DirectoryOutputContext)                 │
│  • Timestamped outputs                                  │
│  • Reference persistence                                │
└─────────────────────────────────────────────────────────┘
```

---

## Key Components

### CommandRouter

Routes task names to their handlers.

```typescript
class CommandRouter {
  private handlers: Map<string, ITaskHandler>;
  
  register(name: string, handler: ITaskHandler): void;
  execute(name: string, args: string[], context: ExecutionContext): Promise<ReferenceHandle>;
  listCommands(): Array<{name: string, description: string}>;
}
```

**Responsibilities:**
- Register task handlers
- Dispatch execution
- Provide command metadata

### CommandLoader

Dynamically loads task definitions from directories.

```typescript
class CommandLoader {
  async loadCommandSource(
    dir: string,
    options?: { warnOnMissing: boolean }
  ): Promise<LoadedCommand[]>;
}
```

**Responsibilities:**
- Scan directories for tasks
- Import ES modules
- Validate task structure
- Return loaded commands

### DirectoryOutputContext

Implementation of IFlow that persists outputs to files.

```typescript
class DirectoryOutputContext implements IFlow {
  constructor(cwd: string, outputDir: string);
  
  async run(command: ICommand): Promise<StringRef[]>;
  async get(ref: StringRef): Promise<string | undefined>;
  async set(value: any, decorators?: IRefDecorator[]): Promise<StringRef>;
}
```

**Features:**
- UUID-based file names
- Timestamped outputs
- Token registry
- Automatic directory creation

### ConfigLoader

Loads and merges configuration from multiple sources.

```typescript
async function loadConfig(cwd: string): Promise<Record<string, any>>;
function getDefaultConfig(): Record<string, any>;
```

**Configuration Hierarchy:**
1. Default configuration
2. User-level config (`~/.open-tasks/.config.json`)
3. Project-level config (`.open-tasks/.config.json`)

### ContextBuilder

Constructs execution contexts for tasks.

```typescript
class ContextBuilder {
  constructor(cwd: string, config: Record<string, any>);
  
  build(outputDir: string, verbosity: VerbosityLevel): ExecutionContext;
}
```

**Responsibilities:**
- Create DirectoryOutputContext
- Initialize output sync
- Prepare ExecutionContext

### ResultPresenter

Formats and displays task results.

```typescript
class ResultPresenter {
  display(result: ReferenceHandle, verbosity: VerbosityLevel): void;
  async handleError(error: Error, outputSynk: IOutputSynk): Promise<void>;
}
```

**Features:**
- Verbosity-aware output
- Formatted cards (boxen)
- Error formatting
- Progress indicators (ora)

---

## Data Flow

### Execution Flow

```
1. User runs: ot task-name arg1 arg2 --option value
   │
   ▼
2. CLI parses arguments and options
   │
   ▼
3. CommandRouter finds task handler
   │
   ▼
4. ContextBuilder creates ExecutionContext
   │
   ▼
5. Task handler executes:
   │
   ├─▶ Validates arguments
   ├─▶ Reports progress
   ├─▶ Runs commands via IFlow
   │   │
   │   ├─▶ Command 1 → Returns StringRef[]
   │   ├─▶ Command 2 → Uses refs from Command 1
   │   └─▶ Command N → Final result
   │
   └─▶ Returns ReferenceHandle
   │
   ▼
6. ResultPresenter displays output
   │
   ▼
7. Output files saved to .open-tasks/logs/
```

### Reference Flow

```
Command Output
     │
     ▼
[value, decorators[]]
     │
     ▼
IFlow.set(value, decorators)
     │
     ├─▶ Generate UUID
     ├─▶ Apply decorators
     ├─▶ Write to file
     ├─▶ Update token registry
     │
     ▼
Return StringRef
     │
     ▼
Pass to next command
     │
     ▼
IFlow.get(ref)
     │
     ├─▶ Read from file
     │
     ▼
Return value
```

---

## Design Patterns

### 1. Command Pattern

Commands encapsulate operations as objects.

**Benefits:**
- Decouple sender from receiver
- Enable undo/redo (via reference history)
- Support command queuing
- Facilitate logging/auditing

### 2. Decorator Pattern

Decorators add metadata to references without modifying structure.

**Benefits:**
- Extensible metadata
- Composable decorators
- Backward compatibility
- Clean separation of concerns

### 3. Strategy Pattern

Different execution strategies (quiet, summary, verbose) for output.

**Benefits:**
- Runtime behavior selection
- Consistent interface
- Easy to add new strategies

### 4. Builder Pattern

Fluent builders for complex configurations (agent configs, tasks).

**Benefits:**
- Readable configuration
- Optional parameters
- Immutable results
- Type-safe construction

### 5. Repository Pattern

DirectoryOutputContext acts as a repository for references.

**Benefits:**
- Abstraction over storage
- Testable with mocks
- Swappable implementations

---

## Extension Points

### 1. Custom Commands

Implement `ICommand` interface:

```typescript
export class MyCommand implements ICommand {
  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    // Your logic
  }
}
```

### 2. Custom Tasks

Implement `ITaskHandler` interface:

```typescript
export default class MyTask implements ITaskHandler {
  name = 'my-task';
  description = 'Description';
  examples = ['ot my-task'];
  
  async execute(args: string[], context: ExecutionContext) {
    // Your workflow
  }
}
```

### 3. Custom Decorators

Implement `IRefDecorator`:

```typescript
class CustomDecorator implements IRefDecorator {
  decorate(ref: StringRef): StringRef {
    return { ...ref, customField: 'value' };
  }
}
```

### 4. Custom Output Context

Implement `IFlow`:

```typescript
class DatabaseOutputContext implements IFlow {
  async run(command: ICommand): Promise<StringRef[]> { /* ... */ }
  async get(ref: StringRef): Promise<string | undefined> { /* ... */ }
  async set(value: any, decorators?: IRefDecorator[]): Promise<StringRef> { /* ... */ }
}
```

### 5. Custom Cards

Implement `ICardBuilder`:

```typescript
class CustomCard implements ICardBuilder {
  build(): string {
    return boxen('Custom formatted output', { /* options */ });
  }
}
```

---

## Directory Structure

```
src/
├── index.ts                    # CLI entry point
├── types.ts                    # Type definitions
├── router.ts                   # CommandRouter
├── command-loader.ts           # CommandLoader
├── directory-output-context.ts # DirectoryOutputContext
├── context-builder.ts          # ContextBuilder
├── result-presenter.ts         # ResultPresenter
├── config-loader.ts            # Configuration loading
├── decorators.ts               # Built-in decorators
├── output-builders.ts          # Output formatting
├── formatters.ts               # CLI formatters
├── utils.ts                    # Utility functions
│
├── commands/                   # Built-in ICommand implementations
│   ├── set.ts
│   ├── read.ts
│   ├── write.ts
│   ├── template.ts
│   ├── replace.ts
│   ├── match.ts
│   ├── join.ts
│   ├── text-transform.ts
│   ├── json-transform.ts
│   ├── question.ts
│   ├── powershell.ts
│   ├── agent.ts
│   └── agents/                 # Agent-specific configs
│       ├── base.ts
│       ├── claude.ts
│       ├── gemini.ts
│       ├── copilot.ts
│       ├── aider.ts
│       ├── llm.ts
│       ├── qwen.ts
│       └── config-loader.ts
│
├── tasks/                      # Built-in ITaskHandler implementations
│   ├── init.ts
│   ├── create.ts
│   ├── create-agent.ts
│   ├── promote.ts
│   └── clean.ts
│
└── cards/                      # Card builders
    ├── MessageCard.ts
    └── KeyValueCard.ts
```

---

## Performance Considerations

### File I/O

- **Lazy Loading** - Files read only when `get()` called
- **Streaming** - Large files can be processed in chunks
- **Caching** - Token registry avoids repeated lookups

### Memory Management

- **Reference-based** - Values not duplicated in memory
- **Disk-backed** - Large datasets don't exhaust RAM
- **Garbage Collection** - References auto-cleaned when out of scope

### Parallelization

While commands run sequentially within a workflow, tasks can:
- Run multiple workflows in parallel
- Use Promise.all() for independent operations
- Leverage worker threads for CPU-intensive tasks

---

## Security Considerations

### Input Validation

- All user inputs validated before execution
- File paths sanitized
- Command injection prevented in shell commands

### File System Access

- Restricted to project and output directories
- Absolute paths validated
- Symlink traversal prevented

### API Keys

- Never logged or exposed
- Environment variable-based
- Support for .env files

---

## Testing Strategy

### Unit Tests

Test individual commands in isolation:

```typescript
describe('UpperCaseCommand', () => {
  it('should convert text to uppercase', async () => {
    const context = new DirectoryOutputContext(cwd, outputDir);
    const inputRef = await context.run(new SetCommand('hello'));
    const outputRef = await context.run(new UpperCaseCommand(inputRef[0]));
    const result = await context.get(outputRef[0]);
    expect(result).toBe('HELLO');
  });
});
```

### Integration Tests

Test tasks with real workflows:

```typescript
describe('code-review task', () => {
  it('should review code file', async () => {
    const result = await executeTask('code-review', ['app.js'], context);
    expect(result.outputFile).toMatch(/review-.*\.md/);
  });
});
```

### End-to-End Tests

Test CLI behavior:

```bash
#!/bin/bash
ot init
ot create test-task
ot test-task
# Verify outputs
```

---

## Future Enhancements

### Planned Features

1. **Plugin System** - Third-party command packages
2. **Workflow Visualization** - Graphical workflow designer
3. **Remote Execution** - Distributed task execution
4. **Database Backend** - Alternative to file storage
5. **Web UI** - Browser-based interface
6. **Shell Integration** - Bash/Zsh completion
7. **Docker Commands** - Container management
8. **Git Workflow Commands** - Version control automation

---

## Next Steps

- **[CONTRIBUTING](https://github.com/SergeiGolos/open-tasks/blob/main/CONTRIBUTING.md)** - Development guide
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Create commands
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Create tasks

## See Also

- **[Core Commands](./Core-Commands.md)** - Command reference
- **[Core Tasks](./Core-Tasks.md)** - Task reference
- **[Installation](./Installation.md)** - Setup guide
