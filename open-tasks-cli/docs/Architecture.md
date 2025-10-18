# Architecture Overview

## Core Architectural Concepts

Open Tasks CLI is built on a **task composition architecture** where:

1. **Tasks** are files in the `.open-tasks/tasks/` directory
2. **Tasks** are composed of one or more **Commands** 
3. **Commands** implement the `ICommand` interface
4. **Commands** consume `MemoryRef[]` inputs and generate `MemoryRef[]` outputs
5. A **library of pre-built commands** is provided for users to compose tasks
6. Users can **create custom commands** within their task files

### The Task-Command Relationship

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
│  • CurlCommand(url, options)                                │
│  • ClaudeCommand(prompt, contextRefs)                       │
│  • RegexCommand(pattern, inputRef)                          │
│  • TokenizeCommand(template, tokenMap)                      │
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

### Example Task Composition

```typescript
// .open-tasks/tasks/analyze-repo.ts
export default class AnalyzeRepoTask extends TaskHandler {
  static name = 'analyze-repo';
  
  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    // 1. Use pre-built PowershellCommand to get git log
    const gitLogCmd = new PowershellCommand("git log --oneline -10");
    const [logRef] = await context.run(gitLogCmd);
    
    // 2. Use pre-built PowershellCommand to get file count
    const fileCountCmd = new PowershellCommand("git ls-files | wc -l");
    const [countRef] = await context.run(fileCountCmd);
    
    // 3. Use pre-built ClaudeCommand with context
    const analyzeCmd = new ClaudeCommand(
      "Analyze this repository",
      [logRef, countRef]
    );
    const [analysisRef] = await context.run(analyzeCmd);
    
    // 4. Store final result with custom decorator
    const finalRef = await context.store(
      context.token('analysis'), 
      [new TokenDecorator('final-analysis')]
    );
    
    return {
      id: generateId(),
      name: 'analyze-repo',
      logs: [/* tracking info */],
      errors: []
    };
  }
}
```

## Three-Layer Architecture

Open Tasks CLI maintains a **three-layer architecture** for clarity and extensibility:

### Layer 1: IWorkflowContext (Internal Programmatic API)

**Purpose**: Internal functions used by task and command implementations  
**Visibility**: NOT exposed to end users directly  
**Location**: Core framework code

The IWorkflowContext provides programmatic functions for workflow processing:

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
**Types**:

1. **System Commands** - Project management
   - `init` - Initialize project structure (creates `.open-tasks/tasks/` directory)
   - `create` - Scaffold task templates

2. **User Tasks** - Custom task definitions
   - Located in `.open-tasks/tasks/`
   - Extend TaskHandler abstract class
   - Compose commands to build workflows
   - Exposed as CLI commands via `open-tasks <task-name>`

**Example**:
```bash
# User invokes their task
open-tasks analyze-repo

# Internally, the task uses:
# - PowershellCommand to execute git commands
# - ClaudeCommand to analyze results
# - context.run() to execute commands
# - context.store() to save results
```

### Layer 3: Command Library (Implementation Layer)

**Purpose**: Reusable ICommand implementations for composing tasks  
**Visibility**: API for task developers

**Pre-built Command Library**:
- `PowershellCommand` - Execute PowerShell scripts
- `CurlCommand` - Make HTTP requests  
- `ClaudeCommand` / `GeminiCommand` / `CodexCommand` - AI CLI integrations
- `RegexCommand` - Extract with regex patterns
- `TokenizeCommand` - Token replacement in templates
- Custom commands users create in their task files

```typescript
// ICommand interface - all commands implement this
interface ICommand {
  execute(context: IWorkflowContext): Promise<MemoryRef[]>;
}

// Example pre-built command
class PowershellCommand implements ICommand {
  constructor(private script: string, private args: string[] = []) {}
  
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    // Execute PowerShell, capture output
    // Use context.store() to save results
    // Return array of MemoryRefs
  }
}

// Example custom command in task file
class MyCustomCommand implements ICommand {
  constructor(private input: string) {}
  
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    // Custom logic here
    const result = this.input.toUpperCase();
    const ref = await context.store(result, []);
    return [ref];
  }
}
```

**Relationship Between Layers**:

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
│  LAYER 3: Command Library                           │
│  • Pre-built ICommand implementations               │
│    - PowershellCommand                              │
│    - ClaudeCommand                                  │
│    - RegexCommand                                   │
│    - TokenizeCommand                                │
│  • Custom ICommand implementations                  │
│    - User-defined in task files                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 1: IWorkflowContext (Internal)               │
│  • context.store()                                  │
│  • context.token()                                  │
│  • context.run()                                    │
│  (NOT exposed to users)                             │
└─────────────────────────────────────────────────────┘
```

---

**Example**:
```bash
# User invokes CLI command
open-tasks store "Hello World" --token greeting

# Internally, the store command implementation may use:
# await context.store("Hello World", "greeting")
```

### Layer 3: Command Handler (Implementation Layer)

**Purpose**: Base classes and interfaces for implementing commands  
**Visibility**: API for command developers

```typescript
abstract class CommandHandler {
  abstract execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

**Relationship Between Layers**:

```
┌─────────────────────────────────────────────────────┐
│  USER                                                │
│  Invokes: open-tasks store "value"                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 2: CLI Commands                              │
│  • System Commands (init, create)                   │
│  • Built-in CLI Commands (store, load, etc.)        │
│  • Process Commands (.open-tasks/tasks/*.js)     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 3: Command Handlers                          │
│  • CommandHandler base class                        │
│  • execute() method implementations                 │
│  • May use Context API internally ↓                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 1: Context API (Internal)                    │
│  • context.store()                                  │
│  • context.load()                                   │
│  • context.transform()                              │
│  • context.run()                                    │
│  (NOT exposed to users)                             │
└─────────────────────────────────────────────────────┘
```

---

## System Architecture

Open Tasks CLI follows a command pattern architecture with explicit context passing and reference management. This document explains the internal architecture, data flows, and design decisions.

## Command Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLI Entry Point                    │
│              (open-tasks <command> [...])            │
│                                                      │
│  • Parse command line arguments                      │
│  • Load configuration                                │
│  • Initialize core services                          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│               Command Router                         │
│                                                      │
│  • Discover system commands (init, create)           │
│  • Discover built-in CLI commands (store, etc.)     │
│  • Scan .open-tasks/tasks/ for process commands  │
│  • Route to appropriate CommandHandler               │
│  • Resolve --ref tokens to ReferenceHandles         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│             Command Handler (Base)                   │
│                                                      │
│  • execute(args, refs, context): Promise<Reference> │
│  • Input: positional args + resolved references     │
│  • Output: ReferenceHandle with result              │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┬─────────────┐
        ▼                         ▼             ▼
┌──────────────┐          ┌─────────────┐  ┌──────────────┐
│   System     │          │  Built-in   │  │   Process    │
│   Commands   │          │     CLI     │  │   Commands   │
│              │          │   Commands  │  │              │
│ • init       │          │             │  │ • User-      │
│ • create     │          │ • store     │  │   defined in │
│              │          │ • load      │  │   .open-     │
│              │          │ • replace   │  │   tasks/     │
│              │          │ • powershell│  │   commands/  │
│              │          │ • ai-cli    │  │              │
│              │          │ • extract   │  │ • May use    │
│              │          │             │  │   Context    │
│              │          │             │  │   API        │
└──────┬───────┘          └──────┬──────┘  └──────┬───────┘
       │                         │                │
       └────────────────┬────────┴────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│           Reference Manager                          │
│                                                      │
│  • Map<string, ReferenceHandle> (in-memory)         │
│  • createReference(content, token?)                 │
│  • getReference(id): ReferenceHandle | undefined    │
│  • UUID generation for auto-IDs                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            Output Handler                            │
│                                                      │
│  • writeOutput(content, token?, ext?)               │
│  • Format: YYYYMMDD-HHmmss-SSS-{token|uuid}.ext    │
│  • Directory: .open-tasks/outputs/                  │
│  • Terminal formatting with colors (chalk)          │
└─────────────────────────────────────────────────────┘
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Context API Layer (Internal - Not Exposed)    │ │
│  │                                                 │ │
│  │  • context.store(value, propertyName)          │ │
│  │  • context.load(fileName)                      │ │
│  │  • context.transform(ref, transforms)          │ │
│  │  • context.run(command, ...args)               │ │
│  │                                                 │ │
│  │  Used by command implementations internally    │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Core Components

### Complete TypeScript Interface Definitions

#### Layer 1: Context API (Internal)

```typescript
/**
 * WorkflowContext - Internal API for workflow processing
 * NOT exposed as CLI commands to end users
 */
interface WorkflowContext {
  /**
   * Store a value and create a file reference
   * @param value - Content to store
   * @param propertyName - Property name for the file reference
   * @returns Promise resolving to MemoryRef
   */
  store(value: string, propertyName: string): Promise<MemoryRef>;
  
  /**
   * Load file content and create a reference
   * @param fileName - Path to file to load
   * @returns Promise resolving to MemoryRef with file content
   */
  load(fileName: string): Promise<MemoryRef>;
  
  /**
   * Apply transformations to a reference
   * @param reference - Input MemoryRef
   * @param transforms - Array of Transform functions
   * @returns Promise resolving to new MemoryRef with transformed content
   */
  transform(reference: MemoryRef, transforms: Transform[]): Promise<MemoryRef>;
  
  /**
   * Execute a command implementation
   * @param command - Command instance implementing ICommand
   * @param args - Additional arguments to pass to command
   * @returns Promise resolving to MemoryRef with command output
   */
  run(command: ICommand, ...args: any[]): Promise<MemoryRef>;
}

/**
 * MemoryRef - Result of Context API operations
 * Represents a stored file with metadata
 */
interface MemoryRef {
  /**
   * Absolute path to the file
   */
  filePath: string;
  
  /**
   * Property name used when creating the reference
   */
  propertyName: string;
  
  /**
   * Timestamp when the file was created
   */
  timestamp: Date;
  
  /**
   * Load the file content
   * @returns Promise resolving to file content as string
   */
  getContent(): Promise<string>;
  
  /**
   * Optional metadata about the operation
   */
  metadata?: {
    originalFileName?: string;
    transformsApplied?: string[];
    sourceCommand?: string;
  };
}

/**
 * ICommand - Interface for command implementations
 * Used with context.run()
 */
interface ICommand {
  /**
   * Execute the command with the workflow context
   * @param context - WorkflowContext for accessing Context API
   * @param args - Additional arguments passed to the command
   * @returns Promise resolving to MemoryRef
   */
  execute(context: WorkflowContext, ...args: any[]): Promise<MemoryRef>;
}

/**
 * Transform - Function for transforming reference content
 */
type Transform = (content: string) => string | Promise<string>;
```

#### Layer 2 & 3: CLI Command Interface

```typescript
/**
 * CommandHandler - Base class for all CLI commands
 * Extended by system commands, built-in commands, and process commands
 */
abstract class CommandHandler {
  /**
   * Execute the command
   * @param args - Positional arguments passed to the command
   * @param refs - Map of resolved references (from --ref flags)
   * @param context - Execution context with shared resources
   * @returns Promise resolving to a ReferenceHandle
   */
  abstract execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;

  /**
   * Command description for help output (optional)
   */
  static description?: string;

  /**
   * Usage examples for help output (optional)
   */
  static examples?: string[];
}

/**
 * ReferenceHandle - Result of CLI command execution
 * Stored in ReferenceManager for use in subsequent commands
 */
interface ReferenceHandle {
  /**
   * Unique identifier (user token or auto-generated UUID)
   */
  id: string;
  
  /**
   * Command output content (any type: string, buffer, object, etc.)
   */
  content: any;
  
  /**
   * When the reference was created
   */
  timestamp: Date;
  
  /**
   * Absolute path to the output file
   */
  outputFile: string;
  
  /**
   * Optional metadata about command execution
   */
  metadata?: {
    commandName: string;    // Name of command that created this
    args: string[];         // Arguments passed to command
    duration: number;       // Execution time in milliseconds
    [key: string]: any;     // Additional command-specific metadata
  };
}

/**
 * ExecutionContext - Context passed to all CLI commands
 * Provides access to shared CLI framework resources
 */
interface ExecutionContext {
  /**
   * Current working directory
   */
  cwd: string;
  
  /**
   * Output directory path (from config or default)
   */
  outputDir: string;
  
  /**
   * Reference manager for creating and retrieving references
   */
  referenceManager: ReferenceManager;
  
  /**
   * Output handler for file and terminal output
   */
  outputHandler: OutputHandler;
  
  /**
   * Loaded configuration (merged from files and defaults)
   */
  config: Record<string, any>;
  
  /**
   * User-provided token from --token flag (if any)
   */
  token?: string;
}
```

#### Core Framework Services

```typescript
/**
 * ReferenceManager - Manages in-memory references during CLI session
 */
interface ReferenceManager {
  /**
   * Create a new reference
   * @param content - Content to store in reference
   * @param token - Optional user-provided token (generates UUID if omitted)
   * @returns Created ReferenceHandle
   */
  createReference(content: any, token?: string): ReferenceHandle;
  
  /**
   * Get a reference by ID
   * @param id - Reference ID (token or UUID)
   * @returns ReferenceHandle if found, undefined otherwise
   */
  getReference(id: string): ReferenceHandle | undefined;
  
  /**
   * List all references in current session
   * @returns Array of all ReferenceHandles
   */
  listReferences(): ReferenceHandle[];
  
  /**
   * Check if a reference exists
   * @param id - Reference ID to check
   * @returns true if reference exists
   */
  hasReference(id: string): boolean;
  
  /**
   * Clear all references (called on CLI exit)
   */
  clear(): void;
}

/**
 * OutputHandler - Handles file writing and terminal formatting
 */
interface OutputHandler {
  /**
   * Write content to output file
   * @param content - Content to write
   * @param token - Optional user token for filename
   * @param ext - File extension (default: 'txt')
   * @returns Promise resolving to absolute file path
   */
  writeOutput(content: any, token?: string, ext?: string): Promise<string>;
  
  /**
   * Write error to error file
   * @param error - Error object
   * @param context - Additional context about the error
   * @returns Promise resolving to error file path
   */
  writeError(error: Error, context: any): Promise<string>;
  
  /**
   * Format success message for terminal
   * @param message - Message text
   * @returns Formatted string with colors
   */
  formatSuccess(message: string): string;
  
  /**
   * Format error message for terminal
   * @param message - Error message text
   * @returns Formatted string with colors
   */
  formatError(message: string): string;
  
  /**
   * Format info message for terminal
   * @param message - Info message text
   * @returns Formatted string with colors
   */
  formatInfo(message: string): string;
  
  /**
   * Format reference ID for terminal
   * @param id - Reference ID
   * @returns Formatted string with colors
   */
  formatReference(id: string): string;
  
  /**
   * Format command name for terminal
   * @param name - Command name
   * @returns Formatted string with colors
   */
  formatCommand(name: string): string;
}

/**
 * CommandRouter - Routes command invocations to handlers
 */
interface CommandRouter {
  /**
   * Discover and register all commands
   * - System commands (init, create)
   * - Built-in CLI commands (store, load, etc.)
   * - Process commands from .open-tasks/tasks/
   */
  discoverCommands(): Promise<void>;
  
  /**
   * Route a command invocation to its handler
   * @param commandName - Name of command to execute
   * @param args - Positional arguments
   * @param refTokens - Array of reference tokens from --ref flags
   * @returns Promise resolving to ReferenceHandle
   */
  route(
    commandName: string,
    args: string[],
    refTokens: string[]
  ): Promise<ReferenceHandle>;
  
  /**
   * Get list of all registered commands
   * @returns Array of command names
   */
  listCommands(): string[];
  
  /**
   * Get help for a specific command
   * @param commandName - Command to get help for
   * @returns Help text with description and examples
   */
  getCommandHelp(commandName: string): string;
}

/**
 * Configuration - CLI configuration schema
 */
interface Configuration {
  /**
   * Output directory for command results
   * @default ".open-tasks/outputs"
   */
  outputDir: string;
  
  /**
   * Directory for custom process commands
   * @default ".open-tasks/tasks"
   */
  customCommandsDir: string;
  
  /**
   * Timestamp format for output files
   * @default "YYYYMMDD-HHmmss-SSS"
   */
  timestampFormat: string;
  
  /**
   * Default file extension for outputs
   * @default "txt"
   */
  defaultFileExtension: string;
  
  /**
   * Enable colored terminal output
   * @default true
   */
  colors: boolean;
  
  /**
   * Maximum file size for loading (bytes)
   * @default 10485760 (10 MB)
   */
  maxFileSize?: number;
  
  /**
   * AI CLI configuration (optional)
   */
  aiCli?: {
    command: string;
    args: string[];
    contextFlag: string;
    timeout: number;
  };
}
```

---

## Core Components

### 1. CLI Entry Point (`src/index.ts`)

**Responsibilities:**
- Parse command-line arguments using Commander.js
- Load configuration from files and defaults
- Initialize core services (ReferenceManager, OutputHandler)
- Create ExecutionContext
- Delegate to CommandRouter

**Flow:**
```typescript
async function main() {
  // 1. Parse arguments
  const program = new Command();
  program.parse(process.argv);

  // 2. Load configuration
  const config = await loadConfiguration();

  // 3. Initialize services
  const referenceManager = new ReferenceManager();
  const outputHandler = new OutputHandler(config);

  // 4. Create context
  const context = {
    cwd: process.cwd(),
    outputDir: config.outputDir,
    referenceManager,
    outputHandler,
    config,
  };

  // 5. Route command
  const router = new CommandRouter(context);
  await router.route(commandName, args, refs);
}
```

### 2. Command Router (`src/router.ts`)

**Responsibilities:**
- Discover and register built-in commands
- Scan `.open-tasks/tasks/` for custom commands
- Resolve `--ref` tokens to ReferenceHandles
- Route to appropriate command handler
- Handle unknown commands with suggestions

**Discovery Process:**
```typescript
class CommandRouter {
  private commands: Map<string, CommandHandler>;

  async discoverCommands() {
    // 1. Register built-in commands
    this.registerBuiltins();

    // 2. Scan for custom commands
    const customDir = path.join(process.cwd(), '.open-tasks/tasks');
    if (await exists(customDir)) {
      const files = await fs.readdir(customDir);
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          await this.loadCustomCommand(file);
        }
      }
    }
  }

  async route(commandName, args, refTokens) {
    // 1. Get command handler
    const handler = this.commands.get(commandName);
    if (!handler) throw new Error(`Unknown command: ${commandName}`);

    // 2. Resolve references
    const refs = new Map();
    for (const token of refTokens) {
      const ref = this.context.referenceManager.getReference(token);
      if (!ref) throw new Error(`Reference not found: ${token}`);
      refs.set(token, ref);
    }

    // 3. Execute command
    const result = await handler.execute(args, refs, this.context);
    return result;
  }
}
```

### 3. Command Handler Base Class (`src/command-handler.ts`)

**Interface:**
```typescript
abstract class CommandHandler {
  /**
   * Execute the command asynchronously
   */
  abstract execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;

  /**
   * Optional: Command description for help
   */
  static description?: string;

  /**
   * Optional: Usage examples for help
   */
  static examples?: string[];
}
```

**Implementation Pattern:**
```typescript
class StoreCommand extends CommandHandler {
  async execute(args, refs, context) {
    // 1. Validate input
    if (args.length === 0) throw new Error('No value provided');

    // 2. Process
    const value = args[0];

    // 3. Write output file
    const outputFile = await context.outputHandler.writeOutput(
      value,
      context.token
    );

    // 4. Create reference
    return context.referenceManager.createReference(value, context.token);
  }
}
```

### 4. Reference Manager (`src/reference-manager.ts`)

**Data Structure:**
```typescript
class ReferenceManager {
  private references: Map<string, ReferenceHandle>;

  createReference(content: any, token?: string): ReferenceHandle {
    const id = token || crypto.randomUUID();
    
    const handle: ReferenceHandle = {
      id,
      content,
      timestamp: new Date(),
      outputFile: '', // Set by OutputHandler
      metadata: {},
    };

    // Check for collisions
    if (this.references.has(id)) {
      console.warn(`Warning: Overwriting existing reference: ${id}`);
    }

    this.references.set(id, handle);
    return handle;
  }

  getReference(id: string): ReferenceHandle | undefined {
    return this.references.get(id);
  }

  listReferences(): ReferenceHandle[] {
    return Array.from(this.references.values());
  }
}
```

**Reference Lifecycle:**
1. **Creation**: Command completes → ReferenceManager creates handle
2. **Storage**: Reference stored in Map with token/UUID as key
3. **Retrieval**: Subsequent commands resolve token → get ReferenceHandle
4. **Session**: References cleared when CLI process exits
5. **Persistence**: Files remain in `.open-tasks/outputs/`

### 5. Output Handler (`src/output-handler.ts`)

**File Naming:**
```typescript
class OutputHandler {
  generateFilename(token?: string, ext: string = 'txt'): string {
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss-SSS');
    const id = token || crypto.randomUUID();
    return `${timestamp}-${id}.${ext}`;
  }

  async writeOutput(
    content: any,
    token?: string,
    ext?: string
  ): Promise<string> {
    const filename = this.generateFilename(token, ext);
    const filepath = path.join(this.outputDir, filename);

    // Ensure directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    // Write metadata header
    const metadata = this.formatMetadata(content, token);
    
    // Write content
    const output = `${metadata}\n\n${content}`;
    await fs.writeFile(filepath, output, 'utf-8');

    return filepath;
  }

  formatMetadata(content: any, token?: string): string {
    return [
      '# open-tasks-cli output',
      `# Command: ${this.currentCommand}`,
      `# Timestamp: ${new Date().toISOString()}`,
      token ? `# Token: ${token}` : '# ID: [UUID]',
    ].join('\n');
  }
}
```

**Terminal Formatting:**
```typescript
class OutputHandler {
  formatSuccess(message: string): string {
    return chalk.green('✓') + ' ' + chalk.white(message);
  }

  formatError(message: string): string {
    return chalk.red('✗') + ' ' + chalk.red(message);
  }

  formatReference(id: string): string {
    return chalk.yellow(id);
  }

  formatCommand(name: string): string {
    return chalk.cyan(name);
  }
}
```

## High-Level Pseudocode Implementations

### Context API (Layer 1 - Internal)

```typescript
// WorkflowContext Implementation
class WorkflowContextImpl implements WorkflowContext {
  private outputDir: string;
  private MemoryRefs: Map<string, MemoryRef>;
  
  async store(value: string, propertyName: string): Promise<MemoryRef> {
    // 1. Generate filename with timestamp
    const timestamp = new Date();
    const fileName = `${propertyName}.${formatTimestamp(timestamp)}.md`;
    const filePath = path.join(this.outputDir, fileName);
    
    // 2. Write file with content
    await fs.writeFile(filePath, value, 'utf-8');
    
    // 3. Create MemoryRef
    const fileRef: MemoryRef = {
      filePath,
      propertyName,
      timestamp,
      getContent: async () => await fs.readFile(filePath, 'utf-8'),
    };
    
    // 4. Store in registry
    this.MemoryRefs.set(propertyName, fileRef);
    
    return fileRef;
  }
  
  async load(fileName: string): Promise<MemoryRef> {
    // 1. Resolve file path
    const filePath = path.resolve(fileName);
    
    // 2. Check file exists
    if (!await fs.exists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // 3. Read content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // 4. Generate property name from filename
    const propertyName = path.basename(fileName, path.extname(fileName));
    
    // 5. Store content and create reference
    return await this.store(content, propertyName);
  }
  
  async transform(reference: MemoryRef, transforms: Transform[]): Promise<MemoryRef> {
    // 1. Get original content
    let content = await reference.getContent();
    
    // 2. Apply transforms sequentially
    for (const transform of transforms) {
      content = await transform(content);
    }
    
    // 3. Generate new property name
    const newPropertyName = `${reference.propertyName}.transform`;
    
    // 4. Store transformed content
    return await this.store(content, newPropertyName);
  }
  
  async run(command: ICommand, ...args: any[]): Promise<MemoryRef> {
    // 1. Execute command with this context
    const result = await command.execute(this, ...args);
    
    // 2. Return the file reference from command execution
    return result;
  }
}
```

### CLI Entry Point

```typescript
async function main() {
  try {
    // 1. Parse command line arguments
    const parsed = parseArgs(process.argv);
    // Result: { command: 'store', args: ['value'], flags: { token: 'mytoken', ref: ['ref1'] } }
    
    // 2. Load configuration
    const config = await loadConfiguration([
      path.join(process.cwd(), '.open-tasks/config.json'),
      path.join(os.homedir(), '.open-tasks/config.json'),
    ]);
    // Merge with defaults
    config = { ...DEFAULT_CONFIG, ...config };
    
    // 3. Initialize core services
    const referenceManager = new ReferenceManager();
    const outputHandler = new OutputHandler(config);
    
    // 4. Create execution context
    const context: ExecutionContext = {
      cwd: process.cwd(),
      outputDir: config.outputDir,
      referenceManager,
      outputHandler,
      config,
      token: parsed.flags.token,
    };
    
    // 5. Initialize command router
    const router = new CommandRouter(context);
    await router.discoverCommands();
    
    // 6. Route and execute command
    const result = await router.route(
      parsed.command,
      parsed.args,
      parsed.flags.ref || []
    );
    
    // 7. Display success output
    console.log(outputHandler.formatSuccess(`Reference created: ${result.id}`));
    console.log(outputHandler.formatInfo(`File: ${result.outputFile}`));
    
    // 8. Exit successfully
    process.exit(0);
    
  } catch (error) {
    // Handle errors
    console.error(outputHandler.formatError(error.message));
    await outputHandler.writeError(error, { command: process.argv });
    process.exit(1);
  }
}
```

### Command Router

```typescript
class CommandRouter {
  private commands: Map<string, CommandHandler>;
  private context: ExecutionContext;
  
  async discoverCommands(): Promise<void> {
    this.commands = new Map();
    
    // 1. Register system commands
    this.commands.set('init', new InitCommand());
    this.commands.set('create', new CreateCommand());
    
    // 2. Register built-in CLI commands
    this.commands.set('store', new StoreCommand());
    this.commands.set('load', new LoadCommand());
    this.commands.set('replace', new ReplaceCommand());
    this.commands.set('powershell', new PowerShellCommand());
    this.commands.set('ai-cli', new AiCliCommand());
    this.commands.set('extract', new ExtractCommand());
    
    // 3. Discover process commands
    const commandsDir = path.join(this.context.cwd, '.open-tasks/tasks');
    if (await fs.exists(commandsDir)) {
      const files = await fs.readdir(commandsDir);
      
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          // Load command module
          const commandPath = path.join(commandsDir, file);
          const CommandClass = await import(commandPath);
          
          // Register with filename as command name
          const commandName = path.basename(file, path.extname(file));
          this.commands.set(commandName, new CommandClass.default());
        }
      }
    }
  }
  
  async route(
    commandName: string,
    args: string[],
    refTokens: string[]
  ): Promise<ReferenceHandle> {
    // 1. Get command handler
    const handler = this.commands.get(commandName);
    if (!handler) {
      const suggestions = this.findSimilarCommands(commandName);
      throw new Error(`Unknown command: ${commandName}\n` +
                      `Did you mean: ${suggestions.join(', ')}?`);
    }
    
    // 2. Resolve references
    const refs = new Map<string, ReferenceHandle>();
    for (const token of refTokens) {
      const ref = this.context.referenceManager.getReference(token);
      if (!ref) {
        throw new Error(`Reference not found: ${token}\n` +
                        `Create it first with: open-tasks store "value" --token ${token}`);
      }
      refs.set(token, ref);
    }
    
    // 3. Execute command with resolved references
    const startTime = Date.now();
    const result = await handler.execute(args, refs, this.context);
    result.metadata = result.metadata || {};
    result.metadata.duration = Date.now() - startTime;
    
    return result;
  }
  
  private findSimilarCommands(input: string): string[] {
    // Simple similarity matching (Levenshtein distance)
    const allCommands = Array.from(this.commands.keys());
    return allCommands
      .map(cmd => ({ cmd, distance: levenshtein(input, cmd) }))
      .filter(x => x.distance <= 3)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(x => x.cmd);
  }
}
```

### Built-in CLI Commands

```typescript
// System Command: init
class InitCommand extends CommandHandler {
  static description = 'Initialize Open Tasks project structure';
  
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const force = args.includes('--force');
    const projectRoot = context.cwd;
    
    // 1. Check if already initialized
    const openTasksDir = path.join(projectRoot, '.open-tasks');
    if (await fs.exists(openTasksDir) && !force) {
      throw new Error('Project already initialized. Use --force to reinitialize.');
    }
    
    // 2. Create directory structure
    await fs.mkdir(path.join(openTasksDir, 'commands'), { recursive: true });
    await fs.mkdir(path.join(openTasksDir, 'outputs'), { recursive: true });
    
    // 3. Create default config
    const defaultConfig = {
      outputDir: '.open-tasks/outputs',
      customCommandsDir: '.open-tasks/tasks',
      timestampFormat: 'YYYYMMDD-HHmmss-SSS',
      defaultFileExtension: 'txt',
      colors: true,
    };
    await fs.writeFile(
      path.join(openTasksDir, 'config.json'),
      JSON.stringify(defaultConfig, null, 2),
      'utf-8'
    );
    
    // 4. Ensure package.json exists
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (!await fs.exists(packageJsonPath)) {
      const packageJson = {
        name: path.basename(projectRoot),
        version: '1.0.0',
        description: 'Open Tasks CLI project',
        scripts: {
          tasks: 'open-tasks',
        },
        devDependencies: {
          'open-tasks-cli': '^1.0.0',
        },
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    }
    
    // 5. Create output message
    const message = `✓ Initialized Open Tasks project\n` +
                    `  • Created .open-tasks/ directory\n` +
                    `  • Created default config\n` +
                    `  • Ready to use\n\n` +
                    `Next steps:\n` +
                    `  1. Create a process command: open-tasks create my-command\n` +
                    `  2. Start using CLI commands: open-tasks store "value"`;
    
    // 6. Write output and create reference
    const outputFile = await context.outputHandler.writeOutput(message, 'init-result');
    return context.referenceManager.createReference(message, 'init-result');
  }
}

// System Command: create
class CreateCommand extends CommandHandler {
  static description = 'Create a new process command template';
  
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Command name required. Usage: open-tasks create <name>');
    }
    
    const commandName = args[0];
    const useTypeScript = args.includes('--typescript');
    const description = args.find(a => a.startsWith('--description='))
                           ?.split('=')[1] || 'Custom command';
    
    // 1. Validate command name
    if (!/^[a-z0-9-]+$/.test(commandName)) {
      throw new Error(`Invalid command name: ${commandName}\n` +
                      `Use only lowercase letters, numbers, and hyphens.`);
    }
    
    // 2. Check if command already exists
    const ext = useTypeScript ? '.ts' : '.js';
    const commandFile = path.join(context.cwd, '.open-tasks/tasks', `${commandName}${ext}`);
    if (await fs.exists(commandFile)) {
      throw new Error(`Command already exists: ${commandName}\n` +
                      `File: ${commandFile}`);
    }
    
    // 3. Generate template
    const template = useTypeScript
      ? this.generateTypeScriptTemplate(commandName, description)
      : this.generateJavaScriptTemplate(commandName, description);
    
    // 4. Write file
    await fs.writeFile(commandFile, template, 'utf-8');
    
    // 5. Create result message
    const message = `✓ Created process command: ${commandName}\n` +
                    `  File: ${commandFile}\n\n` +
                    `Usage:\n` +
                    `  open-tasks ${commandName} <args>`;
    
    const outputFile = await context.outputHandler.writeOutput(message, 'create-result');
    return context.referenceManager.createReference(message, 'create-result');
  }
  
  private generateTypeScriptTemplate(name: string, desc: string): string {
    return `import { CommandHandler, ReferenceHandle, ExecutionContext } from 'open-tasks-cli';

/**
 * ${desc}
 */
export default class ${this.toPascalCase(name)}Command extends CommandHandler {
  static description = '${desc}';
  static examples = [
    'open-tasks ${name} <input>',
    'open-tasks ${name} --ref <token>',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // TODO: Implement your command logic here
    
    // Get input from args or first reference
    const input = args[0] || refs.values().next().value?.content;
    if (!input) {
      throw new Error('No input provided');
    }
    
    // Process the input
    const output = \`Processed: \${input}\`;
    
    // Write output and create reference
    const outputFile = await context.outputHandler.writeOutput(output, context.token);
    return context.referenceManager.createReference(output, context.token);
  }
}
`;
  }
  
  private toPascalCase(str: string): string {
    return str.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }
}

// Built-in CLI Command: store
class StoreCommand extends CommandHandler {
  static description = 'Store a value in memory and create a reference';
  
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // 1. Validate input
    if (args.length === 0) {
      throw new Error('No value provided. Usage: open-tasks store "value" [--token name]');
    }
    
    // 2. Get value to store
    const value = args[0];
    
    // 3. Write output file
    const outputFile = await context.outputHandler.writeOutput(value, context.token);
    
    // 4. Create and return reference
    return context.referenceManager.createReference(value, context.token);
  }
}

// Built-in CLI Command: load
class LoadCommand extends CommandHandler {
  static description = 'Load file content and create a reference';
  
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // 1. Validate input
    if (args.length === 0) {
      throw new Error('No file path provided. Usage: open-tasks load <path> [--token name]');
    }
    
    // 2. Resolve file path
    const filePath = path.resolve(context.cwd, args[0]);
    
    // 3. Check file exists
    if (!await fs.exists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // 4. Check file size
    const stats = await fs.stat(filePath);
    const maxSize = context.config.maxFileSize || 10485760; // 10 MB
    if (stats.size > maxSize) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${maxSize})`);
    }
    
    // 5. Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // 6. Write to output file
    const outputFile = await context.outputHandler.writeOutput(content, context.token);
    
    // 7. Create and return reference
    return context.referenceManager.createReference(content, context.token);
  }
}

// Built-in CLI Command: replace
class ReplaceCommand extends CommandHandler {
  static description = 'Perform template substitution with references';
  
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // 1. Validate input
    if (args.length === 0) {
      throw new Error('No template provided. Usage: open-tasks replace "{{token}}" --ref token');
    }
    
    // 2. Get template
    let template = args[0];
    
    // 3. Replace all {{token}} placeholders
    for (const [token, ref] of refs) {
      const placeholder = `{{${token}}}`;
      const content = ref.content.toString();
      template = template.replace(new RegExp(placeholder, 'g'), content);
    }
    
    // 4. Check for unresolved placeholders
    const unresolvedMatch = template.match(/\{\{([^}]+)\}\}/);
    if (unresolvedMatch) {
      throw new Error(`Unresolved placeholder: {{${unresolvedMatch[1]}}}\n` +
                      `Create it first with: open-tasks store "value" --token ${unresolvedMatch[1]}`);
    }
    
    // 5. Write output and create reference
    const outputFile = await context.outputHandler.writeOutput(template, context.token);
    return context.referenceManager.createReference(template, context.token);
  }
}
```

### Reference Manager

```typescript
class ReferenceManager implements ReferenceManager {
  private references: Map<string, ReferenceHandle>;
  
  constructor() {
    this.references = new Map();
  }
  
  createReference(content: any, token?: string): ReferenceHandle {
    // 1. Generate ID (use token or generate UUID)
    const id = token || crypto.randomUUID();
    
    // 2. Create handle
    const handle: ReferenceHandle = {
      id,
      content,
      timestamp: new Date(),
      outputFile: '', // Will be set by OutputHandler
      metadata: {},
    };
    
    // 3. Check for conflicts
    if (this.references.has(id)) {
      console.warn(`Warning: Overwriting existing reference: ${id}`);
    }
    
    // 4. Store reference
    this.references.set(id, handle);
    
    return handle;
  }
  
  getReference(id: string): ReferenceHandle | undefined {
    return this.references.get(id);
  }
  
  listReferences(): ReferenceHandle[] {
    return Array.from(this.references.values());
  }
  
  hasReference(id: string): boolean {
    return this.references.has(id);
  }
  
  clear(): void {
    this.references.clear();
  }
}
```

### Output Handler

```typescript
class OutputHandler implements OutputHandler {
  private outputDir: string;
  private timestampFormat: string;
  private colors: boolean;
  
  constructor(config: Configuration) {
    this.outputDir = config.outputDir;
    this.timestampFormat = config.timestampFormat;
    this.colors = config.colors;
  }
  
  async writeOutput(content: any, token?: string, ext: string = 'txt'): Promise<string> {
    // 1. Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // 2. Generate filename
    const timestamp = format(new Date(), this.timestampFormat);
    const id = token || crypto.randomUUID();
    const filename = `${timestamp}-${id}.${ext}`;
    const filepath = path.join(this.outputDir, filename);
    
    // 3. Format content with metadata header
    const metadata = this.formatMetadata(content, token);
    const output = `${metadata}\n\n${content}`;
    
    // 4. Write file
    await fs.writeFile(filepath, output, 'utf-8');
    
    return filepath;
  }
  
  async writeError(error: Error, context: any): Promise<string> {
    const timestamp = format(new Date(), this.timestampFormat);
    const filename = `${timestamp}-error.error`;
    const filepath = path.join(this.outputDir, filename);
    
    const errorOutput = {
      error: {
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    };
    
    await fs.writeFile(filepath, JSON.stringify(errorOutput, null, 2), 'utf-8');
    return filepath;
  }
  
  formatSuccess(message: string): string {
    if (!this.colors) return `✓ ${message}`;
    return chalk.green('✓') + ' ' + chalk.white(message);
  }
  
  formatError(message: string): string {
    if (!this.colors) return `✗ ${message}`;
    return chalk.red('✗') + ' ' + chalk.red(message);
  }
  
  formatInfo(message: string): string {
    if (!this.colors) return message;
    return chalk.blue(message);
  }
  
  formatReference(id: string): string {
    if (!this.colors) return id;
    return chalk.yellow(id);
  }
  
  formatCommand(name: string): string {
    if (!this.colors) return name;
    return chalk.cyan(name);
  }
  
  private formatMetadata(content: any, token?: string): string {
    return [
      '# open-tasks-cli output',
      `# Timestamp: ${new Date().toISOString()}`,
      token ? `# Token: ${token}` : '# ID: [auto-generated]',
      `# Content Length: ${content.length} characters`,
    ].join('\n');
  }
}
```

---

## Data Types and Context

### ExecutionContext

The context object passed to all commands:

```typescript
interface ExecutionContext {
  // Working directory
  cwd: string;

  // Output directory (from config)
  outputDir: string;

  // Reference manager instance
  referenceManager: ReferenceManager;

  // Output handler instance
  outputHandler: OutputHandler;

  // Loaded configuration
  config: Record<string, any>;

  // User-provided token (from --token flag)
  token?: string;
}
```

**Usage in Commands:**
```typescript
async execute(args, refs, context: ExecutionContext) {
  // Access current directory
  const filePath = path.join(context.cwd, args[0]);

  // Create reference
  const ref = context.referenceManager.createReference(data, context.token);

  // Write output
  await context.outputHandler.writeOutput(data, context.token);

  // Read configuration
  const maxSize = context.config.maxFileSize || 1048576;

  return ref;
}
```

### ReferenceHandle

The data structure for command outputs:

```typescript
interface ReferenceHandle {
  // Unique identifier (token or UUID)
  id: string;

  // Command output (any type)
  content: any;

  // When the reference was created
  timestamp: Date;

  // Path to the output file
  outputFile: string;

  // Optional metadata
  metadata?: {
    commandName: string;    // Name of the command
    args: string[];         // Arguments passed
    duration: number;       // Execution time (ms)
  };
}
```

**Usage Patterns:**

**Creating:**
```typescript
const handle: ReferenceHandle = {
  id: token || crypto.randomUUID(),
  content: processedData,
  timestamp: new Date(),
  outputFile: await writeOutput(data, token),
  metadata: {
    commandName: 'mycommand',
    args: args,
    duration: 125,
  },
};
```

**Accessing:**
```typescript
async execute(args, refs: Map<string, ReferenceHandle>, context) {
  // Get first reference
  const ref = refs.values().next().value;
  
  // Access content
  const data = ref.content;
  
  // Get all references
  for (const [token, ref] of refs) {
    console.log(`${token}: ${ref.content}`);
  }
}
```

## Data Flow

### Command Execution Flow

```
User Input
    ↓
┌─────────────────────────────────────┐
│ 1. CLI Entry Point                  │
│  • Parse: open-tasks store "value"  │
│  • Extract: command="store"         │
│  • Extract: args=["value"]          │
│  • Extract: token=undefined         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Command Router                   │
│  • Discover commands                │
│  • Find "store" handler             │
│  • Resolve references (none here)   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Store Command Handler            │
│  • Validate args                    │
│  • Extract value: "value"           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Output Handler                   │
│  • Generate filename:               │
│    20251017-143022-456-uuid.txt     │
│  • Write file with metadata         │
│  • Return filepath                  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. Reference Manager                │
│  • Create ReferenceHandle           │
│  • Store in Map: uuid -> handle     │
│  • Return handle                    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 6. Output to Terminal               │
│  • Format success message           │
│  • Display reference ID (colored)   │
│  • Show output file path            │
└─────────────────────────────────────┘
```

### Reference Resolution Flow

```
User Input with --ref
    ↓
┌─────────────────────────────────────┐
│ 1. Parse Arguments                  │
│  • Command: replace                 │
│  • Args: ["{{greeting}} World"]     │
│  • Refs: ["greeting"]               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Resolve References               │
│  • Loop through ["greeting"]        │
│  • referenceManager.get("greeting") │
│  • Returns: ReferenceHandle         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Build Reference Map              │
│  • Map { "greeting" => Handle }     │
│  • Handle.content = "Hello"         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Execute Command                  │
│  • Replace gets:                    │
│    args = ["{{greeting}} World"]    │
│    refs = Map with "greeting"       │
│  • Access: refs.get("greeting")     │
│  • Get content: "Hello"             │
│  • Perform replacement              │
│  • Result: "Hello World"            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. Create New Reference             │
│  • Store result "Hello World"       │
│  • Create new ReferenceHandle       │
│  • Write to new file                │
└─────────────────────────────────────┘
```

## Design Decisions

### 1. In-Memory References

**Decision:** Store references in memory during session, clear on exit.

**Rationale:**
- Fast lookup (O(1) via Map)
- No database or persistence overhead
- Encourages file-based workflows
- Files persist for cross-session use

**Trade-offs:**
- ✅ Simple implementation
- ✅ Fast performance
- ❌ References lost on exit
- ❌ Not suitable for large datasets

### 2. Explicit Context Passing

**Decision:** Pass ExecutionContext to all commands explicitly.

**Rationale:**
- Clear dependencies
- Easy to test (mock context)
- No global state
- Commands see exactly what they have access to

**Alternative Considered:** Global singletons (rejected for testability)

### 3. Token vs UUID References

**Decision:** Support both user tokens and auto-generated UUIDs.

**Rationale:**
- Tokens: Human-readable, memorable for workflows
- UUIDs: Automatic, guaranteed unique, no naming overhead
- Flexibility: Users choose based on use case

**Implementation:**
```typescript
const id = userToken || crypto.randomUUID();
```

### 4. Timestamp-First File Naming

**Decision:** Format `YYYYMMDD-HHmmss-SSS-{id}.ext`

**Rationale:**
- Chronological sorting by default
- Millisecond precision prevents collisions
- Clear creation order
- Easy to find recent outputs

**Alternative Considered:** `{id}-{timestamp}.ext` (rejected for sort order)

### 5. Fail-Fast Error Handling

**Decision:** Stop execution on first error, no retry/fallback.

**Rationale:**
- Clear failure point
- Prevents inconsistent state
- User knows exactly what failed
- Detailed error files for debugging

**Trade-off:** Less resilient to transient errors (acceptable for v1)

### 6. Command Pattern Architecture

**Decision:** Each command is a self-contained handler.

**Rationale:**
- Single Responsibility Principle
- Easy to add new commands
- Clear interfaces
- Testable in isolation
- Extensible for custom commands

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Reference lookup | O(1) | Map-based storage |
| Reference creation | O(1) | Map insert + file write |
| Command discovery | O(n) | Linear scan of directory |
| Reference resolution | O(m) | m = number of --ref flags |

### Space Complexity

| Component | Space | Notes |
|-----------|-------|-------|
| Reference storage | O(n × size) | n = # references, size = content size |
| Command registry | O(c) | c = # commands (built-in + custom) |
| Output files | Persistent | Grows indefinitely (manual cleanup) |

### Bottlenecks

1. **Large reference content**: In-memory storage limits total size
2. **File I/O**: Output writes block command completion
3. **Custom command discovery**: Scans directory on every invocation

### Optimizations (Future)

- Cache custom command list (avoid repeated scans)
- Stream large outputs (avoid full memory load)
- Parallel command execution (when no dependencies)
- Reference persistence (optional database)

## Security Considerations

### 1. Command Injection

**Risk:** Shell commands with unsanitized input

**Mitigation:**
- Validate and sanitize all arguments
- Use parameterized subprocess execution
- Warn users about PowerShell command risks

### 2. File Access

**Risk:** Read/write arbitrary files on system

**Mitigation:**
- Restrict output to `.open-tasks/outputs/`
- Validate file paths (prevent traversal)
- Custom commands inherit user permissions

### 3. Custom Commands

**Risk:** Malicious custom commands

**Mitigation:**
- No sandboxing in v1 (trust model)
- Execute with user permissions (no elevation)
- Users responsible for vetting code
- Future: Optional signature verification

### 4. AI CLI Integration

**Risk:** Unintended file exposure to AI

**Mitigation:**
- Only explicitly referenced files sent
- No automatic context gathering
- Users control what's included via --ref

## Testing Strategy

### Unit Tests

Test individual components in isolation:

```typescript
// test/reference-manager.test.ts
describe('ReferenceManager', () => {
  it('creates reference with token', () => {
    const manager = new ReferenceManager();
    const ref = manager.createReference('data', 'mytoken');
    expect(ref.id).toBe('mytoken');
  });

  it('creates reference with UUID', () => {
    const manager = new ReferenceManager();
    const ref = manager.createReference('data');
    expect(ref.id).toMatch(/^[a-f0-9-]{36}$/);
  });
});
```

### Integration Tests

Test command execution end-to-end:

```typescript
// test/integration/store-command.test.ts
describe('Store Command', () => {
  it('stores value and creates file', async () => {
    await execute('store', ['Hello World'], '--token', 'greeting');
    
    const file = await readFile('.open-tasks/outputs/*-greeting.txt');
    expect(file).toContain('Hello World');
  });
});
```

### E2E Tests

Test full CLI workflows:

```bash
# test/e2e/chain-commands.sh
open-tasks store "Hello" --token greeting
open-tasks replace "{{greeting}} World" --ref greeting --token message
open-tasks ai-cli "Translate to Spanish" --ref message

# Verify outputs exist
ls .open-tasks/outputs/*-greeting.txt
ls .open-tasks/outputs/*-message.txt
```

## Next Steps

- Review [API Reference](API-Reference.md) for complete type definitions
- See [Building Custom Commands](Building-Custom-Commands.md) for extension patterns
- Read specifications in `openspec/changes/add-cli-framework/specs/`
