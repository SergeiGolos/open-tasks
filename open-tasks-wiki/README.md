# Open Tasks CLI

## Project Overview

**Open Tasks CLI** is a flexible command-line tool designed for composable workflow automation. It enables users to chain asynchronous command operations with explicit context passing, making it ideal for building multi-step workflows where each command's output becomes input for subsequent commands.

### Vision

The tool bridges the gap between shell scripting and complex automation by providing:

- **Composable Commands**: Chain operations together with explicit reference passing
- **Context Management**: Store and reuse command outputs using tokens or UUIDs
- **Extensibility**: Add custom commands specific to your workflow
- **AI Integration**: Seamlessly integrate AI CLI tools with pre-defined context
- **Observable Execution**: Color-coded terminal feedback and persistent file outputs

### Key Features

✅ **Six Built-in Commands**
- `store` - Save values to memory and files
- `load` - Load file content into references
- `replace` - Template-based string substitution
- `powershell` - Execute PowerShell scripts
- `ai-cli` - Integrate AI CLI tools with context
- `extract` - Extract data using regular expressions

✅ **Reference Management**
- Token-based references for human-readable aliases
- UUID-based references for automatic tracking
- In-memory storage during execution
- Persistent file outputs for auditing

✅ **Custom Commands**
- Auto-discovery from `.open-tasks/commands/`
- TypeScript or JavaScript support
- Full access to CLI framework services

✅ **Rich Output**
- Color-coded terminal feedback
- Progress indicators for long operations
- Timestamped output files
- Structured metadata for traceability

## Project Goals

### Primary Goals

1. **Composable Commands**: Enable verb-based commands that can be chained together with explicit reference passing between operations

2. **Extensibility**: Allow users to add custom command modules in `.open-tasks/commands/` that are auto-discovered and integrated seamlessly

3. **Async Execution**: All commands execute asynchronously with visual progress feedback and non-blocking operation

4. **Dual Output**: Write command outputs to both the terminal (with formatting/colors) and timestamped files for later reference

5. **Reference Management**: Support memory references (tokens) that store command outputs for reuse across command chains

6. **Built-in Commands**: Provide core commands for storage, file I/O, string manipulation, shell execution, AI integration, and data extraction

### Use Cases

**Workflow Automation**
```bash
# Pre-process data, call AI, and extract results
open-tasks load ./source-code.ts --token code
open-tasks ai-cli "Review this code for bugs" --ref code --token review
open-tasks extract "Bug: (.*)" --ref review --all > bugs.txt
```

**Context Building**
```bash
# Gather context from multiple sources for AI analysis
open-tasks powershell "Get-Content README.md" --token readme
open-tasks load ./package.json --token config
open-tasks ai-cli "Summarize this project" --ref readme --ref config
```

**Template Processing**
```bash
# Dynamic template substitution
open-tasks store "Production" --token env
open-tasks store "myapp.azurewebsites.net" --token domain
open-tasks replace "Deploy to {{env}} at {{domain}}" --ref env --ref domain
```

## Non-Goals

- ❌ Building a full task management system (focus is on command orchestration)
- ❌ Providing a GUI or TUI interface (CLI-only in v1)
- ❌ Managing authentication for external services (assumes pre-authenticated CLIs)
- ❌ Cross-platform shell support beyond PowerShell (future enhancement)

## Architecture Philosophy

### Command Pattern
Each command is a self-contained handler that:
- Accepts arguments and references
- Executes asynchronously
- Returns a reference to its output
- Writes results to both terminal and file

### Explicit Context
Unlike traditional piping, references are explicit:
- Each output gets a unique identifier (token or UUID)
- References are resolved before command execution
- Context is never implicit or hidden
- Files persist for reuse across sessions

### Fail-Fast
Errors stop execution immediately:
- Clear error messages with context
- Error files with full details
- No partial or inconsistent state
- Suggestions for recovery

## Technology Stack

- **Runtime**: Node.js 18.x+
- **Language**: TypeScript (compiled to JavaScript)
- **CLI Framework**: Commander.js
- **Output**: chalk (colors), ora (spinners)
- **Testing**: Vitest
- **Build**: tsup

## Project Status

**Current Status**: Draft Specification  
**Target Version**: 1.0.0  
**Development Phase**: Pre-implementation

The project is currently in the specification phase. All capabilities have been documented in the OpenSpec format with detailed requirements, scenarios, and design decisions.

## Quick Links

- [Installation Guide](Installation.md)
- [Getting Started](Getting-Started.md)
- [Process Functions](Process-Functions.md)
- [Building Custom Commands](Building-Custom-Commands.md)
- [Architecture Overview](Architecture.md)
- [API Reference](API-Reference.md)

## Contributing

Custom commands and extensions are encouraged! See [Building Custom Commands](Building-Custom-Commands.md) for details on extending the CLI for your specific needs.

## License

[License information to be added]
