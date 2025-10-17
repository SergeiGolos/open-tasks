# Design Document: Add CLI Framework

**Change ID:** `add-cli-framework`  
**Last Updated:** 2025-10-17

## Architecture Overview

The CLI framework follows a command pattern architecture with:

```
┌─────────────────────────────────────────────────────┐
│                   CLI Entry Point                    │
│              (open-tasks <command> [...])            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│               Command Router                         │
│  • Parse command name and arguments                  │
│  • Discover built-in and custom commands             │
│  • Route to appropriate CommandHandler               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│             Command Handler (Base)                   │
│  • Async execute() method                            │
│  • Input: args, context refs                         │
│  • Output: ReferenceHandle                           │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   Built-in   │          │   Custom     │
│   Commands   │          │   Commands   │
│              │          │              │
│ • store      │          │ • User-      │
│ • load       │          │   defined    │
│ • replace    │          │   commands   │
│ • powershell │          │   from       │
│ • ai-cli     │          │   .open-     │
│ • extract    │          │   tasks/     │
└──────┬───────┘          └──────┬───────┘
       │                         │
       └────────┬────────────────┘
                ▼
┌─────────────────────────────────────────────────────┐
│           Reference Manager                          │
│  • UUID-based reference handles                      │
│  • In-memory storage during execution                │
│  • Token-based retrieval                             │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            Output Handler                            │
│  • Write to timestamped files                        │
│  • Format terminal output with colors                │
│  • Directory: .open-tasks/outputs/                   │
└─────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Reference Management

**Decision:** Use UUID-based references for command outputs with optional user-provided tokens.

**Rationale:**
- UUIDs ensure uniqueness without coordination
- Tokens provide human-readable aliases
- References are transient (memory-only during execution chain)
- Files persist for auditing and reuse across sessions

**Implementation:**
```typescript
interface ReferenceHandle {
  id: string;          // UUID or user token
  content: any;        // In-memory data
  timestamp: Date;     // Creation time
  outputFile: string;  // Path to persisted file
}
```

### 2. File Naming Convention

**Pattern:** `YYYYMMDD-HHmmss-SSS-{token|uuid}.{ext}`

**Examples:**
- With token: `20251017-143022-456-mydata.txt`
- Without token: `20251017-143022-456-a3f2c9d1-b4e5-4f6a-8b9c-1d2e3f4a5b6c.txt`

**Rationale:**
- Timestamp first enables chronological sorting
- Millisecond precision avoids collisions
- Token/UUID provides uniqueness and traceability

### 3. Command Discovery

**Built-in commands:** Packaged with the CLI in `src/commands/`

**Custom commands:** 
- Location: `.open-tasks/commands/` (relative to CWD)
- File pattern: `*.js`, `*.ts` (if ts-node available)
- Export requirement: `export default class extends CommandHandler`

**Discovery process:**
1. Load all built-in commands at startup
2. Scan `.open-tasks/commands/` if it exists
3. Dynamically import each module
4. Register command name from filename (e.g., `my-command.js` → `my-command`)

### 4. Async Execution Model

All commands return `Promise<ReferenceHandle>`:

```typescript
abstract class CommandHandler {
  abstract execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

**Flow:**
1. User invokes command with args and reference tokens
2. Router resolves references from tokens
3. Command executes asynchronously
4. Output written to file
5. Reference created and returned
6. Terminal displays formatted result

### 5. AI CLI Integration

**Approach:** Generic subprocess execution pattern

```typescript
class AiCliCommand extends CommandHandler {
  private config: AiCliConfig; // Loaded from .open-tasks/ai-config.json
  
  async execute(args: string[], refs: Map<string, ReferenceHandle>) {
    // 1. Resolve context file references
    // 2. Build CLI command with context files as args
    // 3. Execute subprocess
    // 4. Capture output
    // 5. Return reference to output
  }
}
```

**Configuration schema:**
```json
{
  "command": "copilot",
  "args": ["chat", "--context"],
  "contextPattern": "{{files}}",
  "outputParser": "markdown"
}
```

### 6. Terminal Formatting

**Color scheme:**
- **Commands:** Cyan (user input echo)
- **References:** Yellow (token/ID display)
- **Output:** White (command results)
- **Errors:** Red (failures, exceptions)
- **Success:** Green (completion markers)
- **Info:** Blue (metadata, timestamps)

**Libraries:** Use `chalk` for cross-platform color support

### 7. Error Handling

**Strategy:** Fail-fast with detailed error context

- Each command wraps execution in try-catch
- Errors include: command name, args, reference tokens, stack trace
- Failed commands write error details to file (`.error` extension)
- Terminal displays formatted error with recovery suggestions
- Execution chain halts on first error (no automatic retry/fallback)

## Data Flow Example

User command:
```bash
open-tasks store "Hello World" --token greeting
open-tasks replace "{{text}} from TypeScript" --ref greeting --token message
open-tasks ai-cli "Summarize this" --ref message
```

**Flow:**

1. **store command:**
   - Input: `"Hello World"`, token=`greeting`
   - Output file: `20251017-143000-001-greeting.txt`
   - Reference: `{id: "greeting", content: "Hello World", ...}`
   - Terminal: `✓ Stored reference: greeting`

2. **replace command:**
   - Input: `"{{text}} from TypeScript"`, ref=`greeting`, token=`message`
   - Resolves `greeting` → `"Hello World"`
   - Performs replacement: `"Hello World from TypeScript"`
   - Output file: `20251017-143001-234-message.txt`
   - Reference: `{id: "message", content: "Hello World from TypeScript", ...}`
   - Terminal: `✓ Replaced and stored: message`

3. **ai-cli command:**
   - Input: `"Summarize this"`, ref=`message`
   - Resolves `message` → file path
   - Executes: `copilot chat --context 20251017-143001-234-message.txt "Summarize this"`
   - Captures AI output
   - Output file: `20251017-143005-789-c7a2f1b9-....txt`
   - Reference: `{id: "c7a2f1b9-...", content: "...", ...}`
   - Terminal: (AI response displayed with syntax highlighting)

## File Structure

```
open-tasks-cli/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── router.ts                # Command routing
│   ├── reference-manager.ts     # Reference/token management
│   ├── output-handler.ts        # File and terminal output
│   ├── command-handler.ts       # Base command class
│   ├── command-loader.ts        # Discovery and loading
│   └── commands/                # Built-in commands
│       ├── store.ts
│       ├── load.ts
│       ├── replace.ts
│       ├── powershell.ts
│       ├── ai-cli.ts
│       └── extract.ts
├── templates/                   # Templates for custom commands
│   └── example-command.ts
└── README.md
```

## Technology Choices

- **Language:** TypeScript (compile to JS for distribution)
- **CLI Framework:** Commander.js (argument parsing, help generation)
- **Output Formatting:** chalk (colors), cli-table3 (tables if needed)
- **File I/O:** Node.js fs/promises
- **Process Execution:** Node.js child_process with async/await
- **Testing:** Vitest (fast, TypeScript-native)
- **Build:** tsup (bundle for npm distribution)

## Security Considerations

1. **Command Injection:** Sanitize all arguments passed to shell commands
2. **File Access:** Restrict output directory to `.open-tasks/outputs/`
3. **Custom Commands:** Execute in isolated context (no access to internal APIs)
4. **AI CLI Calls:** Pass only explicitly referenced files (no automatic context leakage)

## Performance Considerations

- Commands execute sequentially (no parallel execution in v1)
- Reference storage in memory (not optimized for large datasets)
- File writes are buffered (not streaming)
- Custom command discovery scans directory on every invocation (could cache)

## Future Enhancements (Out of Scope)

- Scripting support (read command sequence from file)
- Parallel execution with dependency graphs
- Streaming output for large data
- Remote command execution
- Command history and replay
- Reference persistence across sessions
- Plugin marketplace/registry
