# open-tasks-cli

A CLI tool for executing tasks with explicit workflow context and file-based input/output tracking.

## Features

- **Workflow Processing**: Store, load, and transform data with automatic file tracking
- **Built-in Commands**: Core operations for common tasks
- **Custom Commands**: Extend functionality with your own command modules
- **Reference System**: Pass data between commands using tokens
- **File Persistence**: All operations are automatically logged to timestamped files

## Installation

### Global Installation

```bash
npm install -g open-tasks-cli
```

### Project-Local Installation

```bash
npm install --save-dev open-tasks-cli
```

Then use with `npx`:

```bash
npx open-tasks <command>
```

## Quick Start

1. **Initialize a project**:
```bash
open-tasks init
```

This creates:
- `.open-tasks/commands/` - Directory for custom commands
- `.open-tasks/outputs/` - Directory for output files
- `.open-tasks/config.json` - Configuration file

2. **Store a value**:
```bash
open-tasks store "Hello World" --token greeting
```

3. **Load a file**:
```bash
open-tasks load ./myfile.txt --token content
```

4. **Create a custom command**:
```bash
open-tasks create my-command
```

## Built-in Commands

### System Commands

#### `init`
Initialize a new open-tasks project.

```bash
open-tasks init
open-tasks init --force  # Reinitialize existing project
```

#### `create`
Create a new custom command template.

```bash
open-tasks create my-command
open-tasks create my-command --typescript
open-tasks create my-command --description "My custom command"
```

### Data Commands

#### `store`
Store a value and create a reference.

```bash
open-tasks store "Hello World"
open-tasks store "Hello World" --token greeting
```

#### `load`
Load content from a file.

```bash
open-tasks load ./file.txt
open-tasks load ./file.txt --token myfile
```

#### `replace`
Replace tokens in a template string with referenced values.

```bash
# First create some references
open-tasks store "John" --token name
open-tasks store "Hello" --token greeting

# Then use them in a template (note: refs must be from same session)
# For cross-session use, directly reference the file content
```

Note: References are session-specific. To use values across commands, load them from the output files.

#### `extract`
Extract text using regex patterns.

```bash
# Load a file first
open-tasks load data.txt --token data

# Then extract from it
open-tasks extract "\\d+" --ref data
open-tasks extract "\\w+@\\w+\\.\\w+" --ref data --all
```

#### `powershell`
Execute PowerShell scripts.

```bash
open-tasks powershell "Get-Date"
open-tasks powershell "Get-Content myfile.txt"
```

#### `ai-cli`
Execute an AI CLI tool with context files.

First, create `.open-tasks/ai-config.json`:

```json
{
  "command": "copilot",
  "args": ["chat"],
  "timeout": 60000
}
```

Then use it:

```bash
open-tasks ai-cli "Summarize this document" --ref document
```

## Output Files

All command outputs are automatically saved to `.open-tasks/outputs/` with timestamped filenames:

Format: `YYYYMMDDTHHmmss-SSS-{token|uuid}.txt`

Examples:
- `20251018T033130-946-name.txt`
- `20251018T033131-054-greeting.txt`

## Custom Commands

Create custom commands in `.open-tasks/commands/`:

```javascript
// .open-tasks/commands/my-command.js
export default class MyCommand {
  name = 'my-command';
  description = 'My custom command';
  examples = [
    'open-tasks my-command',
    'open-tasks my-command arg1 --token result',
  ];

  async execute(args, refs, context) {
    // Access arguments
    const arg = args[0];
    
    // Access references
    const refValue = refs.get('sometoken')?.content;
    
    // Use workflow context
    const result = await context.workflowContext.store(
      'My result',
      []
    );
    
    // Return a reference
    return context.referenceManager.createReference(
      result.id,
      'My result',
      'myresult'
    );
  }
}
```

## Configuration

Configuration file: `.open-tasks/config.json`

```json
{
  "outputDir": ".open-tasks/outputs",
  "customCommandsDir": ".open-tasks/commands",
  "timestampFormat": "YYYYMMDD-HHmmss-SSS",
  "defaultFileExtension": "txt",
  "colors": true
}
```

## Workflow Context API

The workflow context provides an internal API for command implementations:

```typescript
// Store a value
const ref = await context.workflowContext.store(value, decorators);

// Load from file
const ref = await context.workflowContext.load(filePath, token);

// Get value by token (synchronous)
const value = context.workflowContext.token('mytoken');

// Execute a command
const refs = await context.workflowContext.run(commandInstance);
```

## Architecture

### Three-Layer Design

1. **Workflow Processing Layer**: Internal API for context-based operations
   - `IWorkflowContext` interface
   - `MemoryRef` type for tracking stored values
   - `ICommand` interface for composable operations

2. **CLI Commands Layer**: User-facing commands
   - System commands: `init`, `create`
   - Built-in commands: `store`, `load`, `replace`, etc.
   - Custom commands: User-defined in `.open-tasks/commands/`

3. **Command Handler Layer**: Base classes and execution engine
   - `CommandHandler` abstract class
   - Command routing and discovery
   - Output formatting and error handling

## Requirements

- Node.js >= 18.0.0
- PowerShell (for `powershell` command)
- AI CLI tool (for `ai-cli` command, e.g., GitHub Copilot CLI)

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## License

MIT
