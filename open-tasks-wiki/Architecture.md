# Architecture & Core Concepts

This document provides a high-level overview of Open Tasks CLI's architecture and core concepts for developers.

## System Overview

Open Tasks CLI is built on a **command-driven workflow orchestration** architecture. The system enables:

1. **Atomic Command Execution** - Individual commands perform specific operations
2. **Workflow Composition** - Commands chain together to build complex workflows
3. **Reference Management** - Outputs are stored and referenced across commands
4. **Visual Output** - Structured, formatted output using card builders
5. **Extensibility** - Custom commands and tasks auto-discovered and loaded

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Entry Point                      │
│                         (index.ts)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├──> ConfigLoader ──> Load project/user config
                     │
                     ├──> CommandLoader ──> Discover & load commands
                     │         │
                     │         ├──> Built-in commands (tasks/)
                     │         └──> Custom commands (.open-tasks/tasks/)
                     │
                     ├──> CommandRouter ──> Register & route commands
                     │
                     ├──> ContextBuilder ──> Build execution context
                     │         │
                     │         ├──> IFlow (Workflow Context)
                     │         ├──> IOutputSynk (Output Handler)
                     │         └──> Configuration
                     │
                     └──> Execute Command
                              │
                              ├──> TaskHandler.execute()
                              │
                              ├──> Return ReferenceHandle
                              │
                              └──> ResultPresenter ──> Format & display output
```

## Core Components

### 1. Command Router

**Location:** `src/router.ts`

The router manages command registration and execution:

```typescript
class CommandRouter {
  private commands: Map<string, ITaskHandler>;
  
  register(name: string, handler: ITaskHandler): void
  get(name: string): ITaskHandler | undefined
  execute(commandName: string, args: string[], context: ExecutionContext): Promise<ReferenceHandle>
  listCommands(): Array<{ name: string; description: string }>
}
```

**Responsibilities:**
- Maintain registry of available commands
- Route command invocations to handlers
- Provide command discovery and help

### 2. Command Loader

**Location:** `src/command-loader.ts`

Discovers and loads commands from file system:

```typescript
class CommandLoader {
  async loadCommandSource(
    dir: string, 
    options: { warnOnMissing: boolean }
  ): Promise<LoadedCommand[]>
}
```

**Responsibilities:**
- Scan directories for command files
- Import and instantiate command classes
- Handle both built-in and custom commands
- Support JavaScript and TypeScript

### 3. Execution Context

**Location:** `src/types.ts`

Provides commands with everything they need:

```typescript
interface ExecutionContext {
  cwd: string;                  // Current working directory
  outputDir: string;            // Output directory for files
  outputSynk: IOutputSynk;      // Output handler
  workflowContext: IFlow;       // Workflow operations
  config: Record<string, any>;  // Configuration
  verbosity?: VerbosityLevel;   // Output verbosity
}
```

**Components:**
- **cwd** - Execution directory
- **outputDir** - Where to save files
- **outputSynk** - Visual output handler
- **workflowContext** - Workflow state and operations
- **config** - Project/user settings
- **verbosity** - Output detail level

### 4. Workflow Context (IFlow)

**Location:** `src/types.ts`, `src/directory-output-context.ts`

Core interface for workflow operations:

```typescript
interface IFlow {
  cwd: string;
  
  // Store a value
  set(value: any, decorators?: IRefDecorator[]): Promise<StringRef>;
  
  // Retrieve a value
  get(ref: StringRef): Promise<string | undefined>;
  
  // Execute a command
  run(command: ICommand): Promise<StringRef[]>;
}
```

**Implementation:** `DirectoryOutputContext`

Manages:
- Value storage with file persistence
- Reference creation and management
- Decorator application
- Command execution orchestration

### 5. Output System

**Location:** `src/output-builders.ts`, `src/cards/`

Handles formatted visual output:

```typescript
interface IOutputSynk {
  write(message: string, verbosity?: VerbosityLevel): void;
  write(card: ICardBuilder, verbosity?: VerbosityLevel): void;
}
```

**Card Builders:**
- **MessageCard** - Simple messages in styled boxes
- **TableCard** - Tabular data
- **ListCard** - Lists (ordered/unordered)
- **TreeCard** - Hierarchical structures
- **KeyValueCard** - Key-value pairs

All cards use [boxen](https://github.com/sindresorhus/boxen) for rendering.

### 6. Reference Management

**Location:** `src/ReferenceManager.ts`

Tracks command outputs:

```typescript
interface StringRef {
  id: string;           // UUID or token
  token?: string;       // Optional named token
  timestamp: Date;      // Creation time
  fileName: string;     // Persisted file path
}

interface ReferenceHandle {
  id: string;
  token?: string;
  content: any;
  timestamp: Date;
  outputFile?: string;
}
```

**Features:**
- UUID-based identification
- Optional named tokens
- File persistence
- In-memory caching

### 7. Decorators

**Location:** `src/decorators.ts`

Transform references before storage:

```typescript
interface IRefDecorator {
  decorate(ref: StringRef): StringRef;
}
```

**Built-in Decorators:**
- **TokenDecorator** - Assign named token
- **FileNameDecorator** - Set custom filename
- **TimestampedFileNameDecorator** - Add timestamp prefix
- **MetadataDecorator** - Add custom metadata

### 8. Task Handler

**Location:** `src/task-handler.ts`

Base class for all commands:

```typescript
abstract class TaskHandler implements ITaskHandler {
  abstract name: string;
  abstract description: string;
  abstract examples: string[];
  
  async execute(args: string[], context: ExecutionContext): Promise<ReferenceHandle>
  
  protected abstract executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: IFlow,
    synk: IOutputSynk
  ): Promise<ReferenceHandle>
}
```

Commands extend this to implement their logic.

## Data Flow

### Command Execution Flow

```
1. User invokes command
   ↓
2. CLI parses arguments
   ↓
3. CommandRouter routes to handler
   ↓
4. ContextBuilder creates ExecutionContext
   ↓
5. TaskHandler.execute() runs
   ↓
6. Command uses IFlow for operations
   ├─> set() to store values
   ├─> get() to retrieve values
   └─> run() to execute sub-commands
   ↓
7. Command uses IOutputSynk for output
   ├─> write() messages
   └─> write() cards
   ↓
8. Command returns ReferenceHandle
   ↓
9. ResultPresenter formats output
   ↓
10. Display to user
```

### Reference Flow

```
Command Output
   ↓
StringRef created
   ↓
Decorators applied
   ↓
Value stored to file
   ↓
ReferenceHandle returned
   ↓
Reference available for next command
```

## File Organization

```
src/
├── index.ts                      # CLI entry point
├── router.ts                     # Command routing
├── command-loader.ts             # Command discovery
├── config-loader.ts              # Configuration loading
├── context-builder.ts            # ExecutionContext builder
├── task-handler.ts               # Base command class
├── types.ts                      # Core interfaces
├── ReferenceManager.ts           # Reference tracking
├── directory-output-context.ts   # IFlow implementation
├── decorators.ts                 # Reference decorators
├── output-builders.ts            # Output handling
├── result-presenter.ts           # Result formatting
├── formatters.ts                 # Output formatters
├── option-resolver.ts            # CLI option parsing
├── utils.ts                      # Utilities
│
├── cards/                        # Card builders
│   ├── MessageCard.ts
│   ├── TableCard.ts
│   ├── ListCard.ts
│   ├── TreeCard.ts
│   └── KeyValueCard.ts
│
├── tasks/                        # Built-in commands
│   ├── init.ts
│   └── create.ts
│
└── commands/                     # Built-in command implementations
    ├── load.ts
    └── powershell.ts
```

## Design Patterns

### 1. Command Pattern

Each command is a self-contained unit implementing `ITaskHandler`:
- Encapsulates a specific operation
- Receives ExecutionContext
- Returns ReferenceHandle
- Can be composed into workflows

### 2. Decorator Pattern

References are transformed through decorators:
- Decorators modify StringRef before storage
- Multiple decorators can be chained
- Separation of concerns (storage vs. metadata)

### 3. Builder Pattern

Card builders construct visual output:
- Fluent API for creating cards
- Separation of content from presentation
- Flexible styling and formatting

### 4. Strategy Pattern

Output verbosity levels change behavior:
- `quiet` - Minimal output
- `summary` - Default, formatted
- `verbose` - Detailed information

Each command implements its own strategy.

### 5. Registry Pattern

CommandRouter maintains command registry:
- Centralized command management
- Dynamic discovery and registration
- Easy to add new commands

## Extension Points

### 1. Custom Commands

Create new commands by:
1. Extending `TaskHandler`
2. Implementing `executeCommand()`
3. Placing in `.open-tasks/tasks/`

Auto-discovered and loaded by CommandLoader.

### 2. Custom Card Builders

Create visual output by:
1. Implementing `ICardBuilder`
2. Using in `outputSynk.write()`

### 3. Custom Decorators

Transform references by:
1. Implementing `IRefDecorator`
2. Passing to `flow.set()`

### 4. Custom Workflows

Compose commands by:
1. Creating a task that calls multiple commands
2. Using `flow.run()` to execute sub-commands
3. Passing references between commands

## Key Abstractions

### IFlow - The Workflow Interface

The core abstraction for workflow operations. Enables:
- Value storage and retrieval
- Command composition
- Reference management
- File persistence

**Why it matters:** Allows commands to be composed without knowing about file I/O or state management.

### IOutputSynk - The Output Interface

Abstraction for formatted output. Enables:
- Verbosity-aware output
- Card-based formatting
- Consistent visual style

**Why it matters:** Commands create content without worrying about presentation details.

### StringRef - The Reference Abstraction

Lightweight handle to stored values. Enables:
- Cross-command communication
- Value persistence
- Token-based lookup

**Why it matters:** Commands can pass data without tight coupling.

## Configuration System

### Configuration Hierarchy

1. **Built-in Defaults**
   ```typescript
   {
     outputDir: '.open-tasks/outputs',
     customCommandsDir: '.open-tasks/tasks'
   }
   ```

2. **User Config** (`~/.open-tasks/config.json`)
   - Global defaults for all projects

3. **Project Config** (`.open-tasks/config.json`)
   - Project-specific overrides

**Precedence:** Project > User > Defaults

### Configuration Loading

**Location:** `src/config-loader.ts`

```typescript
async function loadConfig(cwd: string): Promise<Record<string, any>>
```

Merges configurations in order of precedence.

## Output Directory Structure

```
.open-tasks/
├── config.json                   # Project configuration
├── ai-config.json               # AI CLI configuration
├── tasks/                       # Custom commands
│   ├── my-task.ts
│   └── another-task.js
└── outputs/                     # Command outputs
    ├── 20250118T143052-store/
    │   └── output.txt
    ├── 20250118T143105-replace/
    │   └── result.txt
    └── 20250118T143120-extract/
        └── emails.txt
```

**Key Features:**
- Timestamped directories prevent conflicts
- Each command execution isolated
- Easy to track and debug workflows
- Clean separation of concerns

## Testing Strategy

Current test infrastructure uses Vitest:

```json
{
  "test": "vitest",
  "test:coverage": "vitest --coverage"
}
```

**Test Structure:**
- Unit tests for individual components
- Integration tests for command execution
- End-to-end tests for workflows

## Dependencies

### Production Dependencies

- **commander** - CLI framework and argument parsing
- **chalk** - Terminal text styling
- **boxen** - Box/card rendering
- **ora** - Progress indicators
- **fs-extra** - Enhanced file system operations
- **uuid** - UUID generation

### Development Dependencies

- **TypeScript** - Type safety
- **tsup** - Build tool
- **Vitest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Performance Considerations

### 1. File I/O

- All outputs written to timestamped directories
- Minimal overhead from directory creation
- Async I/O throughout

### 2. Memory Management

- References stored in memory during execution
- Files persisted for cross-invocation access
- No caching between CLI invocations

### 3. Command Loading

- Commands loaded once at startup
- Dynamic import for tree-shaking
- Lazy loading for custom commands

## Security Considerations

### 1. File System Access

- Commands execute with user permissions
- Output directory configurable but validated
- No privilege escalation

### 2. Command Execution

- PowerShell commands execute in new sessions
- No input sanitization (user's responsibility)
- AI CLI commands pass through to external tools

### 3. Configuration

- JSON configuration files
- No code execution in config
- Validated structure

## Next Steps

- **[Developer Guide](./Developer-Guide.md)** - Get started developing
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Create commands
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Compose workflows

---

**Contributing?** Check the [Developer Guide](./Developer-Guide.md) for setup and contribution guidelines.
