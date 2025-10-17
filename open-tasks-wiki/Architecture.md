# Architecture Overview

## System Architecture

Open Tasks CLI follows a command pattern architecture with explicit context passing and reference management. This document explains the internal architecture, data flows, and design decisions.

## High-Level Architecture

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
│  • Discover built-in commands                        │
│  • Scan .open-tasks/commands/ for custom commands   │
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
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   Built-in   │          │   Custom     │
│   Commands   │          │   Commands   │
│              │          │              │
│ • store      │          │ • Dynamically│
│ • load       │          │   loaded from│
│ • replace    │          │   .open-tasks│
│ • powershell │          │   /commands/ │
│ • ai-cli     │          │              │
│ • extract    │          │              │
└──────┬───────┘          └──────┬───────┘
       │                         │
       └────────┬────────────────┘
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
```

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
- Scan `.open-tasks/commands/` for custom commands
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
    const customDir = path.join(process.cwd(), '.open-tasks/commands');
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
