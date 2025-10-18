# Building Custom Tasks with TypeScript

## Overview

Open Tasks CLI allows you to extend its functionality by creating **tasks** in TypeScript or JavaScript. Tasks are files that compose **Commands** (ICommand implementations) to build custom workflows. Tasks are automatically discovered from the `.open-tasks/tasks/` directory and integrated with the CLI framework.

**Terminology**:
- **Tasks**: Files in `.open-tasks/tasks/` that extend TaskHandler and compose commands
- **Commands**: ICommand implementations that consume and produce MemoryRef[]
- **Pre-built Commands**: Library commands (PowershellCommand, ClaudeCommand, RegexCommand, etc.)
- **Custom Commands**: ICommand implementations you create within your task files
- **System Commands**: Framework commands (init, create)
- **IWorkflowContext**: Internal API (context.store(), context.token(), context.run()) - used within tasks

**Key Architecture**: Tasks are files that compose one or more commands. Commands can be pre-built (from the library) or custom (ICommand implementations you create).

## Quick Start

### 1. Initialize Your Project

First, ensure your project is initialized:

```bash
open-tasks init
```

This creates the `.open-tasks/tasks/` directory where your task files will live.

### 2. Create Your First Task

Use the `create` system command to scaffold a template:

```bash
open-tasks create uppercase
```

This creates `.open-tasks/tasks/uppercase.ts` (or `.js`) with a complete template.

Or create it manually - `.open-tasks/tasks/uppercase.ts`:

```typescript
import { TaskHandler, IWorkflowContext, TaskOutcome, MemoryRef, ICommand } from 'open-tasks-cli';

// Custom command implementation
class UppercaseCommand implements ICommand {
  constructor(private input: MemoryRef) {}
  
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    // Read content from input reference
    const content = await fs.readFile(this.input.fileName, 'utf-8');
    const uppercased = content.toUpperCase();
    
    // Store result and return new reference
    const resultRef = await context.store(
      uppercased,
      [new TokenDecorator('uppercased')]
    );
    return [resultRef];
  }
}

export default class UppercaseTask extends TaskHandler {
  static name = 'uppercase';
  static description = 'Convert text to uppercase';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'uppercase',
      logs: [],
      errors: []
    };

    try {
      // 1. Store input text
      const inputRef = await context.store(
        args[0],
        [new TokenDecorator('input')]
      );

      // 2. Use custom command to transform
      const cmd = new UppercaseCommand(inputRef);
      const [outputRef] = await context.run(cmd);

      // 3. Track operation in logs
      outcome.logs.push({
        ...outputRef,
        command: 'UppercaseCommand',
        args: [args[0]],
        start: new Date(),
        end: new Date()
      });
    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

### 3. Use Your Task

```bash
# Invoke your task just like any CLI command
open-tasks uppercase "hello world"
# Output shows TaskOutcome with logs

# The result is stored and can be referenced by token
open-tasks uppercase "hello world" --token mytext
```

**Note**: Tasks work as CLI commands from the user's perspective, but internally they compose commands to build workflows.

## Task Handler Interface

### Base Class

All tasks must extend `TaskHandler`:

```typescript
abstract class TaskHandler {
  /**
   * Execute the task
   * @param args - Positional arguments passed to the task
   * @param context - IWorkflowContext for command execution
   * @returns Promise resolving to TaskOutcome
   */
  abstract execute(
    args: string[],
    context: IWorkflowContext
  ): Promise<TaskOutcome>;

  /**
   * Task name for CLI invocation (optional, defaults to filename)
   */
  static name?: string;

  /**
   * Task description for help output (optional)
   */
  static description?: string;
}
```

### Method Parameters

#### `args: string[]`
Positional arguments passed after the task name.

**Example:**
```bash
open-tasks mytask arg1 arg2 arg3
# args = ["arg1", "arg2", "arg3"]
```

#### `context: IWorkflowContext`
Workflow context for executing commands and storing results.

**Interface:**
```typescript
interface IWorkflowContext {
  /**
   * Store a value with optional decorators
   * @param value - Value to store
   * @param decorators - Optional array of IMemoryDecorator
   * @returns Promise resolving to MemoryRef
   */
  store(value: any, decorators?: IMemoryDecorator[]): Promise<MemoryRef>;

  /**
   * Generate a unique token
   * @param prefix - Optional prefix for token
   * @returns Generated token string
   */
  token(prefix?: string): string;

  /**
   * Execute a command
   * @param command - ICommand instance to execute
   * @returns Promise resolving to array of MemoryRef
   */
  run(command: ICommand): Promise<MemoryRef[]>;
}
```

### Return Value

Tasks must return a `Promise<TaskOutcome>`:

```typescript
interface TaskOutcome {
  id: string;              // Task execution ID
  name: string;            // Task name
  logs: TaskLog[];         // Execution logs
  errors: string[];        // Error messages if any
}

interface TaskLog extends MemoryRef {
  command: string;         // Name of command executed
  args: any[];             // Arguments passed to command
  start: Date;             // Start time
  end: Date;               // End time
}

interface MemoryRef {
  id: string;              // Unique identifier
  token: string;           // Named token for reference
  fileName: string;        // Path to stored file
}
```

## TypeScript Types

### Importing Types

```typescript
import { 
  TaskHandler,
  IWorkflowContext,
  TaskOutcome,
  TaskLog,
  MemoryRef,
  ICommand,
  IMemoryDecorator
} from 'open-tasks-cli';
```

### Core Type Definitions

```typescript
// Memory reference - tracks stored values
interface MemoryRef {
  id: string;              // Unique identifier
  token: string;           // Named token for retrieval
  fileName: string;        // Path to stored file
}

// Task execution outcome
interface TaskOutcome {
  id: string;              // Task execution ID
  name: string;            // Task name
  logs: TaskLog[];         // Execution logs
  errors: string[];        // Error messages
}

// Task execution log entry
interface TaskLog extends MemoryRef {
  command: string;         // Command name
  args: any[];             // Command arguments
  start: Date;             // Start time
  end: Date;               // End time
}

// Workflow context interface
interface IWorkflowContext {
  store(value: any, decorators?: IMemoryDecorator[]): Promise<MemoryRef>;
  token(prefix?: string): string;
  run(command: ICommand): Promise<MemoryRef[]>;
}

// Command interface
interface ICommand {
  execute(context: IWorkflowContext): Promise<MemoryRef[]>;
}

// Memory decorator interface
interface IMemoryDecorator {
  decorate(source: MemoryRef): MemoryRef;
}
```

### Context Implementations

Three context implementations are available:

```typescript
// In-memory storage (testing)
class InMemoryWorkflowContext implements IWorkflowContext {
  store(value: any, decorators?: IMemoryDecorator[]): Promise<MemoryRef>;
  token(prefix?: string): string;
  run(command: ICommand): Promise<MemoryRef[]>;
}

// Directory-based storage (local)
class DirectoryOutputContext implements IWorkflowContext {
  constructor(outputDir: string);
  store(value: any, decorators?: IMemoryDecorator[]): Promise<MemoryRef>;
  token(prefix?: string): string;
  run(command: ICommand): Promise<MemoryRef[]>;
}

// Remote storage (cloud)
class RemoteOutputContext implements IWorkflowContext {
  constructor(remoteConfig: RemoteConfig);
  store(value: any, decorators?: IMemoryDecorator[]): Promise<MemoryRef>;
  token(prefix?: string): string;
  run(command: ICommand): Promise<MemoryRef[]>;
}
```

## Task Examples

### Example 1: Simple Transformer Task

Convert text to lowercase using a custom command:

```typescript
// .open-tasks/tasks/lowercase.ts
import { TaskHandler, IWorkflowContext, TaskOutcome, ICommand, MemoryRef, TokenDecorator } from 'open-tasks-cli';

// Custom command
class LowercaseCommand implements ICommand {
  constructor(private input: MemoryRef) {}
  
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    const content = await fs.readFile(this.input.fileName, 'utf-8');
    const lowercased = content.toLowerCase();
    
    const resultRef = await context.store(
      lowercased,
      [new TokenDecorator('lowercased')]
    );
    return [resultRef];
  }
}

export default class LowercaseTask extends TaskHandler {
  static name = 'lowercase';
  static description = 'Convert text to lowercase';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'lowercase',
      logs: [],
      errors: []
    };

    try {
      // Store input
      const inputRef = await context.store(args[0], [new TokenDecorator('input')]);
      
      // Run custom command
      const cmd = new LowercaseCommand(inputRef);
      const [outputRef] = await context.run(cmd);
      
      outcome.logs.push({
        ...outputRef,
        command: 'LowercaseCommand',
        args,
        start: new Date(),
        end: new Date()
      });
    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

**Usage:**
```bash
open-tasks lowercase "HELLO WORLD"
```

### Example 2: Using Pre-built Commands

Count lines in a file using PowershellCommand:

```typescript
// .open-tasks/tasks/linecount.ts
import { TaskHandler, IWorkflowContext, TaskOutcome, PowershellCommand } from 'open-tasks-cli';
import { promises as fs } from 'fs';

export default class LineCountTask extends TaskHandler {
  static name = 'linecount';
  static description = 'Count lines in a file';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'linecount',
      logs: [],
      errors: []
    };

    try {
      const filePath = args[0];
      
      // Use pre-built PowershellCommand
      const cmd = new PowershellCommand(
        `(Get-Content ${filePath} | Measure-Object -Line).Lines`
      );
      const [resultRef] = await context.run(cmd);
      
      // Read the line count
      const lineCount = await fs.readFile(resultRef.fileName, 'utf-8');
      
      // Store formatted result
      const outputRef = await context.store(
        `Lines: ${lineCount}`,
        [new TokenDecorator('linecount')]
      );
      
      outcome.logs.push({
        ...outputRef,
        command: 'PowershellCommand',
        args,
        start: new Date(),
        end: new Date()
      });
    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

**Usage:**
```bash
open-tasks linecount ./README.md
```

### Example 3: Composing Multiple Commands

Concatenate files using multiple pre-built commands:

```typescript
// .open-tasks/tasks/concat.ts
import { TaskHandler, IWorkflowContext, TaskOutcome, PowershellCommand } from 'open-tasks-cli';
import { promises as fs } from 'fs';

export default class ConcatTask extends TaskHandler {
  static name = 'concat';
  static description = 'Concatenate multiple files';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'concat',
      logs: [],
      errors: []
    };

    try {
      const parts: string[] = [];
      
      // Read each file using PowershellCommand
      for (const filePath of args) {
        const cmd = new PowershellCommand(`Get-Content ${filePath}`);
        const [contentRef] = await context.run(cmd);
        
        const content = await fs.readFile(contentRef.fileName, 'utf-8');
        parts.push(content);
        
        outcome.logs.push({
          ...contentRef,
          command: 'PowershellCommand',
          args: [filePath],
          start: new Date(),
          end: new Date()
        });
      }

      // Store concatenated result
      const concatenated = parts.join('\n\n---\n\n');
      const finalRef = await context.store(
        concatenated,
        [new TokenDecorator('concatenated')]
      );
      
      outcome.logs.push({
        ...finalRef,
        command: 'store',
        args: [],
        start: new Date(),
        end: new Date()
      });
    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

**Usage:**
```bash
open-tasks concat ./file1.txt ./file2.txt ./file3.txt
```

### Example 4: Using External Commands

Execute git commands using PowershellCommand:

```typescript
// .open-tasks/tasks/git-status.ts
import { TaskHandler, IWorkflowContext, TaskOutcome, PowershellCommand } from 'open-tasks-cli';

export default class GitStatusTask extends TaskHandler {
  static name = 'git-status';
  static description = 'Get git repository status';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'git-status',
      logs: [],
      errors: []
    };

    try {
      const gitCommand = args[0] || 'status';
      
      const cmd = new PowershellCommand(`git ${gitCommand}`);
      const [resultRef] = await context.run(cmd);
      
      outcome.logs.push({
        ...resultRef,
        command: 'PowershellCommand',
        args: [gitCommand],
        start: new Date(),
        end: new Date()
      });
    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

**Usage:**
```bash
open-tasks git-status
open-tasks git-status "log --oneline -10"
```

### Example 5: AI-Powered Task

Use ClaudeCommand for AI processing:

```typescript
// .open-tasks/tasks/analyze-json.ts
import { TaskHandler, IWorkflowContext, TaskOutcome, ClaudeCommand, PowershellCommand } from 'open-tasks-cli';
import { promises as fs } from 'fs';

export default class AnalyzeJsonTask extends TaskHandler {
  static name = 'analyze-json';
  static description = 'Analyze JSON structure with AI';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'analyze-json',
      logs: [],
      errors: []
    };

    try {
      // 1. Read JSON file
      const readCmd = new PowershellCommand(`Get-Content ${args[0]}`);
      const [jsonRef] = await context.run(readCmd);
      
      // 2. Analyze with Claude
      const analyzeCmd = new ClaudeCommand(
        "Analyze this JSON structure and suggest improvements",
        [jsonRef]
      );
      const [analysisRef] = await context.run(analyzeCmd);
      
      outcome.logs.push(
        {
          ...jsonRef,
          command: 'PowershellCommand',
          args: [args[0]],
          start: new Date(),
          end: new Date()
        },
        {
          ...analysisRef,
          command: 'ClaudeCommand',
          args: [],
          start: new Date(),
          end: new Date()
        }
      );
    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

**Usage:**
```bash
open-tasks analyze-json ./package.json
```

## Best Practices

### 1. Validate Input

Always validate arguments in your task:

```typescript
async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
  const outcome: TaskOutcome = {
    id: generateId(),
    name: 'mytask',
    logs: [],
    errors: []
  };
  
  if (args.length === 0) {
    outcome.errors.push('No input provided. Use: mytask <arg>');
    return outcome;
  }
  // ... rest of implementation
}
```

### 2. Provide Help Metadata

Include description for documentation:

```typescript
export default class MyTask extends TaskHandler {
  static name = 'mytask';
  static description = 'Clear, concise description of what this task does';
  // ...
}
```

### 3. Handle Errors Gracefully

Add errors to TaskOutcome instead of throwing:

```typescript
try {
  // Task logic
  const cmd = new PowershellCommand(`Get-Content ${filePath}`);
  const [resultRef] = await context.run(cmd);
  
  outcome.logs.push({
    ...resultRef,
    command: 'PowershellCommand',
    args: [filePath],
    start: new Date(),
    end: new Date()
  });
} catch (error) {
  outcome.errors.push(`Failed to read file: ${error.message}`);
}

return outcome;
```

### 4. Use IWorkflowContext Methods

Leverage the context API:

```typescript
// Store values with decorators
const ref = await context.store(
  value,
  [new TokenDecorator('mytoken'), new TimestampDecorator()]
);

// Generate unique tokens
const token = context.token('prefix');

// Run commands
const results = await context.run(new PowershellCommand('ls'));
```

### 5. Compose Pre-built Commands

Use the command library when possible:

```typescript
// Instead of custom file operations, use PowershellCommand
const cmd = new PowershellCommand(`Get-Content ${filePath}`);
const [contentRef] = await context.run(cmd);

// Instead of custom AI logic, use ClaudeCommand
const aiCmd = new ClaudeCommand("Analyze this", [contentRef]);
const [analysisRef] = await context.run(aiCmd);
```

### 6. Track All Operations in Logs

Add TaskLog entries for transparency:

```typescript
outcome.logs.push({
  ...resultRef,
  command: 'PowershellCommand',
  args: [filePath],
  start: startTime,
  end: new Date()
});
```

## Task Naming

### File Naming Rules

- Use kebab-case: `my-task.ts`
- Only `.ts` and `.js` files are scanned
- Use static name property or filename becomes command name: `my-task.ts` → `my-task`
- Avoid special characters (only alphanumeric, hyphens, underscores)

### Examples

| Filename | Command Name | Valid? |
|----------|--------------|--------|
| `uppercase.ts` | `uppercase` | ✅ |
| `line-count.ts` | `line-count` | ✅ |
| `my_task.ts` | `my_task` | ✅ |
| `git-log.ts` | `git-log` | ✅ |
| `my@task.ts` | - | ❌ Invalid |
| `sub/task.ts` | - | ❌ Subdirectories not scanned |

## TypeScript Configuration

### tsconfig.json

If using TypeScript, create `.open-tasks/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./tasks",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["tasks/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Dependencies

Install type definitions:

```bash
npm install --save-dev @types/node
```

## Testing Tasks

### Manual Testing

```bash
# Test your task
open-tasks mytask "test input"

# Check outcome
# TaskOutcome is displayed with logs and errors

# Test with CLI-provided tokens
open-tasks mytask "test" --token myresult
```

### Unit Testing

Use Vitest or Jest:

```typescript
// my-task.test.ts
import { describe, it, expect } from 'vitest';
import MyTask from '../tasks/my-task';
import { InMemoryWorkflowContext } from 'open-tasks-cli';

describe('MyTask', () => {
  it('should execute task correctly', async () => {
    const task = new MyTask();
    const context = new InMemoryWorkflowContext();
    
    const outcome = await task.execute(['input'], context);
    
    expect(outcome.errors).toHaveLength(0);
    expect(outcome.logs).toHaveLength(1);
    expect(outcome.name).toBe('my-task');
  });
});
```

## Troubleshooting

### Task Not Found

**Issue**: Task not discovered by CLI

**Solutions**:
1. Check file is in `.open-tasks/tasks/`
2. Verify filename has `.ts` or `.js` extension
3. Ensure file exports default class extending TaskHandler
4. Run `open-tasks init` if directory doesn't exist
5. Restart CLI (no hot-reload in v1)

### Type Errors

**Issue**: TypeScript errors in task file

**Solutions**:
1. Install type definitions: `npm install --save-dev @types/node`
2. Import types from `open-tasks-cli`
3. Check `tsconfig.json` configuration (use `tasks/` not `commands/`)

### Execution Errors

**Issue**: Task throws errors or produces unexpected outcomes

**Solutions**:
1. Check TaskOutcome.errors array for error messages
2. Review TaskOutcome.logs for execution trace
3. Validate input arguments at start of execute()
4. Use try-catch around context.run() calls
5. Test commands individually before composing

### Command Composition Issues

**Issue**: Commands not working together correctly

**Solutions**:
1. Verify MemoryRef is passed correctly between commands
2. Check that files exist at MemoryRef.fileName paths
3. Use appropriate decorators (TokenDecorator, TimestampDecorator)
4. Ensure commands return MemoryRef[] from execute()

## Next Steps

- Review [Architecture Overview](Architecture.md) for deeper understanding of task-command relationship
- Read [Process Functions](Process-Functions.md) for pre-built command library documentation
- See OpenSpec specifications for complete API reference
