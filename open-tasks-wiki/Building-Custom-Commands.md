# Building Custom Commands with TypeScript

## Overview

Open Tasks CLI allows you to extend its functionality by creating custom commands in TypeScript or JavaScript. Custom commands are automatically discovered from the `.open-tasks/commands/` directory and integrated with the CLI framework.

## Quick Start

### 1. Create Commands Directory

```bash
mkdir -p .open-tasks/commands
```

### 2. Create Your First Command

Create `.open-tasks/commands/uppercase.ts`:

```typescript
import { CommandHandler, ReferenceHandle, ExecutionContext } from 'open-tasks-cli';

export default class UppercaseCommand extends CommandHandler {
  static description = 'Convert text to uppercase';
  static examples = [
    'open-tasks uppercase "hello world"',
    'open-tasks uppercase --ref mytext',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // Get input from args or first reference
    let input: string;
    if (args.length > 0) {
      input = args[0];
    } else if (refs.size > 0) {
      const firstRef = refs.values().next().value;
      input = firstRef.content.toString();
    } else {
      throw new Error('No input provided. Use: open-tasks uppercase "text" or --ref token');
    }

    // Transform to uppercase
    const output = input.toUpperCase();

    // Create reference using context services
    const outputFile = await context.outputHandler.writeOutput(
      output,
      context.token
    );

    return {
      id: context.token || this.generateUUID(),
      content: output,
      timestamp: new Date(),
      outputFile,
      metadata: {
        commandName: 'uppercase',
        args,
        duration: 0,
      },
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
```

### 3. Use Your Command

```bash
# Invoke your custom command
open-tasks uppercase "hello world"
# Output: HELLO WORLD

# Use with references
open-tasks store "hello world" --token text
open-tasks uppercase --ref text
# Output: HELLO WORLD
```

## Command Handler Interface

### Base Class

All custom commands must extend `CommandHandler`:

```typescript
abstract class CommandHandler {
  /**
   * Execute the command
   * @param args - Positional arguments passed to the command
   * @param refs - Map of resolved references (token -> ReferenceHandle)
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
```

### Method Parameters

#### `args: string[]`
Positional arguments passed after the command name.

**Example:**
```bash
open-tasks mycommand arg1 arg2 arg3
# args = ["arg1", "arg2", "arg3"]
```

#### `refs: Map<string, ReferenceHandle>`
Map of resolved references from `--ref` flags.

**Example:**
```bash
open-tasks mycommand --ref token1 --ref token2
# refs = Map {
#   "token1" => ReferenceHandle {...},
#   "token2" => ReferenceHandle {...}
# }
```

#### `context: ExecutionContext`
Execution context with shared CLI resources.

**Structure:**
```typescript
interface ExecutionContext {
  cwd: string;                     // Current working directory
  outputDir: string;               // Output directory path
  referenceManager: ReferenceManager;
  outputHandler: OutputHandler;
  config: Record<string, any>;     // Loaded configuration
  token?: string;                  // User-provided token (from --token flag)
}
```

### Return Value

Commands must return a `Promise<ReferenceHandle>`:

```typescript
interface ReferenceHandle {
  id: string;              // UUID or user-provided token
  content: any;            // Command output (string, buffer, object)
  timestamp: Date;         // Creation timestamp
  outputFile: string;      // Absolute path to output file
  metadata?: {
    commandName: string;   // Name of command that created this
    args: string[];        // Arguments passed to command
    duration: number;      // Execution time in milliseconds
  };
}
```

## TypeScript Types

### Importing Types

```typescript
import { 
  CommandHandler, 
  ReferenceHandle, 
  ExecutionContext,
  ReferenceManager,
  OutputHandler 
} from 'open-tasks-cli';
```

### Type Definitions

```typescript
// Reference to command output
interface ReferenceHandle {
  id: string;
  content: any;
  timestamp: Date;
  outputFile: string;
  metadata?: {
    commandName: string;
    args: string[];
    duration: number;
  };
}

// Execution context passed to commands
interface ExecutionContext {
  cwd: string;
  outputDir: string;
  referenceManager: ReferenceManager;
  outputHandler: OutputHandler;
  config: Record<string, any>;
  token?: string;
}

// Reference manager for creating/retrieving references
interface ReferenceManager {
  createReference(content: any, token?: string): ReferenceHandle;
  getReference(id: string): ReferenceHandle | undefined;
  listReferences(): ReferenceHandle[];
}

// Output handler for writing files and terminal output
interface OutputHandler {
  writeOutput(content: any, token?: string, ext?: string): Promise<string>;
  writeError(error: Error, context: any): Promise<string>;
  formatSuccess(message: string): string;
  formatError(message: string): string;
  formatInfo(message: string): string;
}
```

## Command Examples

### Example 1: Simple Transformer

Convert text to lowercase:

```typescript
// .open-tasks/commands/lowercase.ts
import { CommandHandler, ReferenceHandle, ExecutionContext } from 'open-tasks-cli';

export default class LowercaseCommand extends CommandHandler {
  static description = 'Convert text to lowercase';

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const input = args[0] || refs.values().next().value?.content;
    if (!input) throw new Error('No input provided');

    const output = input.toString().toLowerCase();
    const outputFile = await context.outputHandler.writeOutput(output, context.token);

    return context.referenceManager.createReference(output, context.token);
  }
}
```

**Usage:**
```bash
open-tasks lowercase "HELLO WORLD"
open-tasks store "HELLO" --token greeting
open-tasks lowercase --ref greeting
```

### Example 2: File Operation

Count lines in a file:

```typescript
// .open-tasks/commands/linecount.ts
import { CommandHandler, ReferenceHandle, ExecutionContext } from 'open-tasks-cli';
import { promises as fs } from 'fs';

export default class LineCountCommand extends CommandHandler {
  static description = 'Count lines in a file or text';
  static examples = [
    'open-tasks linecount ./file.txt',
    'open-tasks linecount --ref mytext',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    let content: string;

    // Get content from file path or reference
    if (args.length > 0) {
      const filePath = args[0];
      content = await fs.readFile(filePath, 'utf-8');
    } else if (refs.size > 0) {
      const ref = refs.values().next().value;
      content = ref.content.toString();
    } else {
      throw new Error('Provide a file path or --ref token');
    }

    // Count lines
    const lines = content.split('\n').length;
    const output = `Lines: ${lines}`;

    // Write output
    const outputFile = await context.outputHandler.writeOutput(
      output,
      context.token
    );

    return {
      id: context.token || this.generateUUID(),
      content: lines,
      timestamp: new Date(),
      outputFile,
      metadata: {
        commandName: 'linecount',
        args,
        duration: 0,
      },
    };
  }

  private generateUUID(): string {
    return crypto.randomUUID();
  }
}
```

**Usage:**
```bash
open-tasks linecount ./README.md
open-tasks load ./data.txt --token data
open-tasks linecount --ref data
```

### Example 3: Multiple References

Concatenate multiple text references:

```typescript
// .open-tasks/commands/concat.ts
import { CommandHandler, ReferenceHandle, ExecutionContext } from 'open-tasks-cli';

export default class ConcatCommand extends CommandHandler {
  static description = 'Concatenate multiple references';
  static examples = [
    'open-tasks concat --ref text1 --ref text2 --ref text3',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (refs.size === 0) {
      throw new Error('Provide at least one --ref token');
    }

    // Concatenate all references
    const parts: string[] = [];
    for (const [token, ref] of refs) {
      parts.push(ref.content.toString());
    }

    const output = parts.join('\n\n---\n\n');

    // Write output
    const outputFile = await context.outputHandler.writeOutput(
      output,
      context.token
    );

    return context.referenceManager.createReference(output, context.token);
  }
}
```

**Usage:**
```bash
open-tasks store "Part 1" --token p1
open-tasks store "Part 2" --token p2
open-tasks store "Part 3" --token p3
open-tasks concat --ref p1 --ref p2 --ref p3
```

### Example 4: External Process

Execute git commands:

```typescript
// .open-tasks/commands/git.ts
import { CommandHandler, ReferenceHandle, ExecutionContext } from 'open-tasks-cli';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default class GitCommand extends CommandHandler {
  static description = 'Execute git commands';
  static examples = [
    'open-tasks git "log --oneline -5"',
    'open-tasks git "status"',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Provide a git command');
    }

    const gitCommand = args.join(' ');

    try {
      const { stdout, stderr } = await execAsync(`git ${gitCommand}`, {
        cwd: context.cwd,
      });

      const output = stdout || stderr;
      const outputFile = await context.outputHandler.writeOutput(
        output,
        context.token
      );

      return context.referenceManager.createReference(output, context.token);
    } catch (error) {
      throw new Error(`Git command failed: ${error.message}`);
    }
  }
}
```

**Usage:**
```bash
open-tasks git "log --oneline -10" --token gitlog
open-tasks git "diff HEAD~1" --token changes
```

### Example 5: JSON Processing

Parse and query JSON data:

```typescript
// .open-tasks/commands/jq.ts
import { CommandHandler, ReferenceHandle, ExecutionContext } from 'open-tasks-cli';

export default class JqCommand extends CommandHandler {
  static description = 'Query JSON data using JSONPath-like syntax';
  static examples = [
    'open-tasks jq "name" --ref jsondata',
    'open-tasks jq "items[0].title" --ref jsondata',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (args.length === 0 || refs.size === 0) {
      throw new Error('Provide a query and --ref token');
    }

    const query = args[0];
    const ref = refs.values().next().value;
    
    // Parse JSON
    let data: any;
    try {
      data = JSON.parse(ref.content.toString());
    } catch {
      throw new Error('Reference content is not valid JSON');
    }

    // Simple query implementation (extend as needed)
    const result = this.queryData(data, query);
    const output = JSON.stringify(result, null, 2);

    const outputFile = await context.outputHandler.writeOutput(
      output,
      context.token,
      'json'
    );

    return context.referenceManager.createReference(result, context.token);
  }

  private queryData(data: any, query: string): any {
    const parts = query.split('.');
    let current = data;

    for (const part of parts) {
      if (current === undefined || current === null) break;
      
      // Handle array indexing: items[0]
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        const [, prop, index] = match;
        current = current[prop]?.[parseInt(index)];
      } else {
        current = current[part];
      }
    }

    return current;
  }
}
```

**Usage:**
```bash
open-tasks load ./package.json --token pkg
open-tasks jq "version" --ref pkg
open-tasks jq "dependencies" --ref pkg --token deps
```

## Best Practices

### 1. Validate Input

Always validate arguments and references:

```typescript
async execute(args, refs, context) {
  if (args.length === 0 && refs.size === 0) {
    throw new Error('No input provided. Use: command <arg> or --ref <token>');
  }
  // ... rest of implementation
}
```

### 2. Provide Help Metadata

Include description and examples:

```typescript
export default class MyCommand extends CommandHandler {
  static description = 'Clear, concise description';
  static examples = [
    'open-tasks mycommand "example 1"',
    'open-tasks mycommand --ref token',
  ];
  // ...
}
```

### 3. Handle Errors Gracefully

Throw descriptive errors:

```typescript
if (!fileExists) {
  throw new Error(`File not found: ${filePath}\nCheck the path and try again.`);
}
```

### 4. Use Context Services

Leverage the framework:

```typescript
// Use OutputHandler for files
await context.outputHandler.writeOutput(content, context.token);

// Use ReferenceManager for references
const ref = context.referenceManager.createReference(data, token);

// Access configuration
const maxSize = context.config.maxFileSize || 1048576;
```

### 5. Support Both Args and Refs

Make commands flexible:

```typescript
const input = args[0] || refs.values().next().value?.content;
if (!input) throw new Error('No input provided');
```

## Command Naming

### File Naming Rules

- Use kebab-case: `my-command.ts`
- Only `.ts` and `.js` files are scanned
- Filename becomes command name: `my-command.ts` → `my-command`
- Avoid special characters (only alphanumeric, hyphens, underscores)

### Examples

| Filename | Command Name | Valid? |
|----------|--------------|--------|
| `uppercase.ts` | `uppercase` | ✅ |
| `line-count.ts` | `line-count` | ✅ |
| `my_command.ts` | `my_command` | ✅ |
| `git-log.ts` | `git-log` | ✅ |
| `my@command.ts` | - | ❌ Invalid |
| `sub/cmd.ts` | - | ❌ Subdirectories not scanned |

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
    "rootDir": "./commands",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["commands/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Dependencies

Install type definitions:

```bash
npm install --save-dev @types/node
```

## Testing Custom Commands

### Manual Testing

```bash
# Test your command
open-tasks mycommand "test input"

# Check output file
cat .open-tasks/outputs/$(ls -t .open-tasks/outputs | head -1)

# Test with references
open-tasks store "test" --token t1
open-tasks mycommand --ref t1
```

### Unit Testing

Use Vitest or Jest:

```typescript
// my-command.test.ts
import { describe, it, expect } from 'vitest';
import MyCommand from '../commands/my-command';

describe('MyCommand', () => {
  it('should transform input correctly', async () => {
    const cmd = new MyCommand();
    const mockContext = {
      /* mock context */
    };
    
    const result = await cmd.execute(['input'], new Map(), mockContext);
    
    expect(result.content).toBe('expected output');
  });
});
```

## Troubleshooting

### Command Not Found

**Issue**: Custom command not discovered

**Solutions**:
1. Check file is in `.open-tasks/commands/`
2. Verify filename has `.ts` or `.js` extension
3. Ensure file exports default class
4. Restart CLI (no hot-reload in v1)

### Type Errors

**Issue**: TypeScript errors in custom command

**Solutions**:
1. Install type definitions: `npm install --save-dev @types/node`
2. Import types from `open-tasks-cli`
3. Check `tsconfig.json` configuration

### Execution Errors

**Issue**: Command throws errors

**Solutions**:
1. Check error file in `.open-tasks/outputs/*.error`
2. Validate input arguments
3. Use try-catch for async operations
4. Test with `--verbose` flag (if supported)

## Next Steps

- Review [Architecture Overview](Architecture.md) for deeper understanding
- See [API Reference](API-Reference.md) for complete type definitions
- Explore built-in commands for implementation patterns
