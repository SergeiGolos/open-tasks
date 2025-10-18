# Documentation (Deprecated)

**⚠️ This documentation directory is deprecated. All documentation has been migrated to the wiki.**

## 📚 Find Documentation in the Wiki

All Open Tasks CLI documentation is now located in **[open-tasks-wiki](../open-tasks-wiki/)**

**Start Here**: [open-tasks-wiki/index.md](../../open-tasks-wiki/index.md)

### Vision

The tool bridges the gap between shell scripting and complex automation by providing:

- **Task-Command Architecture**: Clear separation where tasks (files) compose commands (ICommand implementations)
- **Pre-built Command Library**: Rich set of commands (PowershellCommand, ClaudeCommand, RegexCommand, etc.)
- **Command Composition**: Chain operations together via MemoryRef[] passing
- **Context Management**: IWorkflowContext API for storing and running commands
- **Extensibility**: Create custom tasks and commands specific to your workflow
- **AI Integration**: ClaudeCommand for seamless AI processing
- **Observable Execution**: TaskOutcome with logs and errors for full transparency

### Architecture Components

**Tasks** - Workflow orchestration files in `.open-tasks/tasks/`
- Files extending TaskHandler
- Compose pre-built and custom commands
- Auto-discovered and integrated as CLI commands
- Return TaskOutcome with logs and errors

**Pre-built Commands** - Library of ICommand implementations
- PowershellCommand - Execute shell commands
- ClaudeCommand - AI processing
- RegexCommand - Pattern matching
- TemplateCommand - Variable substitution
- FileCommand - File operations
- And more...

**Custom Commands** - User-defined ICommand implementations
- Created within task files
- Consume and produce MemoryRef[]
- Composed with pre-built commands

**IWorkflowContext API** - Internal task interface
- `context.store()` - Store values and get MemoryRef
- `context.token()` - Generate unique tokens
- `context.run()` - Execute commands
- Used within tasks, not exposed as CLI commands

**System Commands** - Framework management
- `init` - Initialize project structure
- `create` - Scaffold new task templates

## Project Goals

### Primary Goals

1. **Command Composition**: Enable tasks to compose commands that pass MemoryRef[] between operations

2. **Extensibility**: Allow users to create custom tasks in `.open-tasks/tasks/` that are auto-discovered and integrated seamlessly

3. **Pre-built Library**: Provide rich command library (PowershellCommand, ClaudeCommand, RegexCommand, etc.) for common operations

4. **Transparent Execution**: TaskOutcome with complete logs and errors for observability

5. **Memory Management**: MemoryRef system with decorators (TokenDecorator, TimestampDecorator) for flexible storage

6. **AI-Powered Workflows**: ClaudeCommand for seamless AI integration in task workflows

### Use Cases

**Code Analysis Workflow**
```bash
# Create task that reads code, analyzes with AI, and generates report
open-tasks create analyze-code
# Edit .open-tasks/tasks/analyze-code.ts to compose commands
# Use PowershellCommand → ClaudeCommand → FileCommand
open-tasks analyze-code ./src/app.ts
```

**Multi-File Processing**
```bash
# Task that processes multiple files with AI
# Compose: PowershellCommand (read files) → ClaudeCommand (analyze) → FileCommand (write summary)
open-tasks analyze-project ./src/
```

**Template Generation**
```bash
# Task that generates config from templates
# Compose: FileCommand (read template) → TemplateCommand (substitute) → FileCommand (write)
open-tasks generate-config production
```

## Non-Goals

- ❌ Building a full task management system (focus is on command composition)
- ❌ Providing a GUI or TUI interface (CLI-only in v1)
- ❌ Managing authentication for external services (assumes pre-configured API keys)
- ❌ Cross-platform shell support beyond PowerShell (future enhancement)

## Architecture Philosophy

### Task-Command Design

**Tasks = Files that compose commands**
- Tasks are files in `.open-tasks/tasks/` extending TaskHandler
- Tasks compose one or more commands to build workflows
- Tasks are invoked as CLI commands by users

**Commands = ICommand implementations**
- Commands consume MemoryRef[] and produce MemoryRef[]
- Commands can be pre-built (library) or custom (user-defined)
- Commands are chained together within tasks

**Memory References = Data flow**
- MemoryRef tracks stored values with {id, token, fileName}
- Commands pass MemoryRef[] between each other
- Decorators enhance MemoryRef with metadata

**IWorkflowContext Interface**
- Three methods: store(), token(), run()
- Used within tasks to manage workflow
- Implementation determines where data is stored (in-memory, directory, remote)

**Context Implementations**
- InMemoryWorkflowContext - Testing and transient workflows
- DirectoryOutputContext - Local file storage (default)
- RemoteOutputContext - Cloud/remote storage (future)

### Command Pattern

Each command implements ICommand:
- `execute(context: IWorkflowContext): Promise<MemoryRef[]>`
- Consumes MemoryRef[] (via constructor or context)
- Produces MemoryRef[] (return value)
- Stateless and composable

### Task Pattern

Each task extends TaskHandler:
- `execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome>`
- Composes multiple commands
- Tracks execution in TaskOutcome.logs
- Reports errors in TaskOutcome.errors
- Auto-discovered from `.open-tasks/tasks/`

### Data Flow

```
User invokes:   open-tasks analyze-code ./app.ts
                      ↓
Task:           AnalyzeCodeTask.execute()
                      ↓
Commands:       PowershellCommand → ClaudeCommand → FileCommand
                      ↓
Context:        context.run(command) executes each
                      ↓
Memory:         MemoryRef[] flows between commands
                      ↓
Outcome:        TaskOutcome with logs and errors
```

### Explicit References

Unlike traditional piping, data flow is explicit:
- MemoryRef tracks each value with {id, token, fileName}
- Commands pass MemoryRef[] between each other
- Files persist in `.open-tasks/outputs/`
- References can be decorated with metadata

### Fail-Safe

Tasks don't throw errors:
- Errors added to TaskOutcome.errors[]
- Logs track successful operations
- Partial results still captured
- User sees full execution trace

## Technology Stack

- **Runtime**: Node.js 18.x+
- **Language**: TypeScript (compiled to JavaScript)
- **CLI Framework**: Commander.js or similar
- **Output**: chalk (colors), ora (spinners)
- **Testing**: Vitest
- **Build**: tsup

## Project Status

**Current Status**: Specification Phase  
**Target Version**: 1.0.0  
**Development Phase**: Pre-implementation

The project is currently in the specification phase. All capabilities have been documented in the OpenSpec format with detailed requirements, scenarios, and design decisions.

## Quick Links

- [Installation Guide](Installation.md)
- [Getting Started](Getting-Started.md)
- [Pre-built Commands](Process-Functions.md)
- [Building Custom Tasks](Building-Custom-Tasks.md)
- [Architecture Overview](Architecture.md)

## Contributing

Custom tasks and commands are encouraged! See [Building Custom Tasks](Building-Custom-Tasks.md) for details on extending the CLI with your own tasks and commands.

## License

[License information to be added]
