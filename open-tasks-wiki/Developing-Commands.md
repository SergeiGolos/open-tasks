# Developing Custom Commands

This guide explains how to create custom CLI commands for Open Tasks using the `CommandHandler` interface.

## Overview

Custom commands extend Open Tasks with new functionality accessible from the CLI:

```bash
open-tasks my-command <args>
```

Commands are automatically discovered from `.open-tasks/commands/` and work alongside built-in commands like `store`, `load`, and `replace`.

## Quick Start

### 1. Initialize Your Project

```bash
open-tasks init
```

This creates `.open-tasks/commands/` directory for your custom commands.

### 2. Create a Command File

Create `.open-tasks/commands/greet.ts`:

```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle } from 'open-tasks-cli';
import { TokenDecorator } from 'open-tasks-cli/decorators';

export default class GreetCommand extends CommandHandler {
  name = 'greet';
  description = 'Greet someone by name';
  examples = [
    'open-tasks greet --ref name',
    'open-tasks greet "Alice" --token greeting'
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // Get name from reference or argument
    const nameRef = Array.from(refs.values())[0];
    const name = nameRef ? nameRef.content : (args[0] || 'World');
    
    // Create greeting
    const greeting = `Hello, ${name}!`;

    // Store result using workflow context
    const memoryRef = await context.workflowContext.store(
      greeting,
      [new TokenDecorator('greeting')]
    );
    
    // Return reference handle
    return context.referenceManager.createReference(
      memoryRef.id,
      greeting,
      'greeting'
    );
  }
}
```

### 3. Use Your Command

```bash
open-tasks store "Alice" --token name
open-tasks greet --ref name
# Output: Hello, Alice!
# File: .open-tasks/outputs/{timestamp}-greet/greeting.txt
```

## CommandHandler Interface

All custom commands extend the `CommandHandler` abstract class:

```typescript
abstract class CommandHandler {
  abstract name: string;
  abstract description: string;
  abstract examples: string[];
  
  abstract execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

### Required Properties

#### `name: string`

The command name used in the CLI:

```typescript
name = 'validate-email';  // ✓ Good
name = 'ValidateEmail';   // ✗ Bad: not lowercase
name = 'validate_email';  // ✗ Bad: use hyphens
```

**Rules:**
- Lowercase only
- Use hyphens for multi-word commands
- Must be unique across all commands

#### `description: string`

Brief description shown in help output:

```typescript
description = 'Validate email addresses using regex';
```

#### `examples: string[]`

Array of usage examples:

```typescript
examples = [
  'open-tasks validate-email test@example.com',
  'open-tasks validate-email --ref input --all',
];
```

### Execute Method

The `execute` method contains your command logic:

```typescript
async execute(
  args: string[],                      // Command-line arguments
  refs: Map<string, ReferenceHandle>,  // Referenced values
  context: ExecutionContext            // Shared services
): Promise<ReferenceHandle>            // Return value reference
```

**Parameters:**

- **`args`** - Command-line arguments array (positional args and flags)
- **`refs`** - Map of reference handles from `--ref` flags
- **`context`** - Execution context with shared services

**Returns:**

- **`Promise<ReferenceHandle>`** - Reference to the command's output

## Command Discovery

Commands are automatically discovered from `.open-tasks/commands/`:

### Discovery Rules

1. **Location** - Must be in `.open-tasks/commands/` directory
2. **Extension** - `.js` or `.ts` files only
3. **Export** - Must use `export default`
4. **Extends** - Class must extend `CommandHandler`

### Directory Structure

```
.open-tasks/
├── commands/
│   ├── validate-email.ts      # ✓ Discovered
│   ├── transform-data.js      # ✓ Discovered
│   ├── utils/
│   │   └── helpers.ts         # ✗ Subdirectories ignored
│   └── README.md              # ✗ Not .js/.ts
├── outputs/
└── config.json
```

### Export Format

**Correct:**

```typescript
export default class MyCommand extends CommandHandler {
  // ...
}
```

**Incorrect:**

```typescript
export class MyCommand extends CommandHandler {  // ✗ Missing default
  // ...
}
```

## Execution Context

The `ExecutionContext` provides shared services:

```typescript
interface ExecutionContext {
  cwd: string;                      // Current working directory
  outputDir: string;                // Output directory path
  referenceManager: ReferenceManager;  // Reference management
  outputHandler: OutputHandler;     // File output utilities
  workflowContext: IWorkflowContext;   // Workflow processing API
  config: Record<string, any>;      // Configuration object
}
```

### Key Services

#### `workflowContext: IWorkflowContext`

The internal workflow processing API:

```typescript
// Store data with decorators
const ref = await context.workflowContext.store(data, decorators);

// Load file
const fileRef = await context.workflowContext.load(filePath, decorators);

// Transform MemoryRef
const transformed = await context.workflowContext.transform(ref, transformer);
```

#### `referenceManager: ReferenceManager`

Manages reference handles for command chaining:

```typescript
// Create reference handle
const handle = context.referenceManager.createReference(
  memoryRef.id,
  content,
  token,
  outputFile
);

// Lookup reference by token
const ref = context.referenceManager.getReference('mytoken');
```

#### `outputHandler: OutputHandler`

File output utilities:

```typescript
// Write output file
await context.outputHandler.writeOutput(content, 'file.txt');

// Write error log
await context.outputHandler.writeError(error, metadata);
```

## Working with References

### Accessing References

References are passed via `--ref` flags:

```bash
open-tasks store "data" --token mydata
open-tasks my-command --ref mydata
```

In your command:

```typescript
async execute(args, refs, context) {
  // Get reference by token
  const dataRef = refs.get('mydata');
  if (!dataRef) {
    throw new Error('Required reference "mydata" not found');
  }
  
  // Access content
  const content = dataRef.content;
  
  // Access metadata
  const token = dataRef.token;
  const id = dataRef.id;
  const outputFile = dataRef.outputFile;
}
```

### Creating References

Always return a `ReferenceHandle` from your command:

```typescript
// Store result
const memoryRef = await context.workflowContext.store(result, decorators);

// Create reference handle
return context.referenceManager.createReference(
  memoryRef.id,
  result,
  token,      // Optional: named token
  outputFile  // Optional: output file path
);
```

## Working with Decorators

Decorators transform `MemoryRef` objects **before** file creation:

```typescript
import { 
  TokenDecorator, 
  FileNameDecorator,
  TimestampedFileNameDecorator,
  MetadataDecorator 
} from 'open-tasks-cli/decorators';

async execute(args, refs, context) {
  const data = "Hello World";
  
  // Apply decorators before storing
  const memoryRef = await context.workflowContext.store(data, [
    new TokenDecorator('greeting'),
    new FileNameDecorator('message.txt'),
    new MetadataDecorator({ author: 'system' })
  ]);
  
  // File written to: .open-tasks/outputs/{timestamp}-my-command/message.txt
  
  return context.referenceManager.createReference(
    memoryRef.id,
    data,
    'greeting'
  );
}
```

### Built-in Decorators

- **`TokenDecorator(token)`** - Assign named token
- **`FileNameDecorator(name)`** - Set custom filename
- **`TimestampedFileNameDecorator(name)`** - Add timestamp prefix
- **`MetadataDecorator(metadata)`** - Attach custom metadata

See [Managing Context](./Managing-Context.md) for complete decorator documentation.

## Output Directory Structure

Each command execution creates an isolated timestamped directory:

```
.open-tasks/
  outputs/
    20250118T143052-store/
      20250118T143052-greeting.txt
    20250118T143105-greet/
      greeting.txt
```

**Pattern:** `.open-tasks/outputs/{timestamp}-{command-name}/`

**Benefits:**
- No file naming conflicts
- Easy command history tracking
- Clean separation between executions
- Simplified debugging

## Parsing Arguments

### Basic Argument Parsing

```typescript
async execute(args, refs, context) {
  // Positional arguments
  const input = args[0];
  const secondArg = args[1];
  
  // Flag detection
  const verbose = args.includes('--verbose');
  const force = args.includes('--force');
  
  // Flag with value
  const token = args.find((arg, i) => args[i - 1] === '--token');
  const output = args.find((arg, i) => args[i - 1] === '--output');
}
```

### Advanced Argument Parsing

```typescript
interface ParsedArgs {
  positional: string[];
  flags: Map<string, string | boolean>;
}

function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string | boolean>();
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('--')) {
        flags.set(key, nextArg);
        i++; // Skip next arg
      } else {
        flags.set(key, true);
      }
    } else {
      positional.push(arg);
    }
  }
  
  return { positional, flags };
}

async execute(args, refs, context) {
  const parsed = parseArgs(args);
  
  const input = parsed.positional[0];
  const verbose = parsed.flags.get('verbose') === true;
  const token = parsed.flags.get('token') as string;
}
```

## Advanced Patterns

### Multiple Output Files

```typescript
async execute(args, refs, context) {
  // Store multiple results in same directory
  const result1 = await context.workflowContext.store(
    data1,
    [new TokenDecorator('output1')]
  );
  
  const result2 = await context.workflowContext.store(
    data2,
    [new TokenDecorator('output2')]
  );
  
  // Both files in: .open-tasks/outputs/{timestamp}-my-command/
  
  // Return primary result
  return context.referenceManager.createReference(
    result1.id,
    data1,
    'output1'
  );
}
```

### File System Operations

```typescript
import { promises as fs } from 'fs';
import path from 'path';

async execute(args, refs, context) {
  // Read config file
  const configPath = path.join(context.cwd, 'config.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
  
  // Process data
  const result = processData(config);
  
  // Write custom output
  await context.outputHandler.writeOutput(result, 'custom.txt');
}
```

### Progress Indicators

```typescript
import ora from 'ora';

async execute(args, refs, context) {
  const spinner = ora('Processing data...').start();
  
  try {
    await longRunningOperation();
    spinner.succeed('Processing complete!');
  } catch (error) {
    spinner.fail('Processing failed');
    throw error;
  }
}
```

### Error Handling

```typescript
async execute(args, refs, context) {
  try {
    const data = await fetchData();
    return await storeResult(data);
  } catch (error) {
    // Write error log
    await context.outputHandler.writeError(error as Error, {
      command: this.name,
      args,
    });
    
    // Throw with context
    throw new Error(`Failed to fetch data: ${(error as Error).message}`);
  }
}
```

### Child Process Execution

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async execute(args, refs, context) {
  const { stdout, stderr } = await execAsync('some-command', {
    cwd: context.cwd,
    timeout: 30000,
  });
  
  const result = await context.workflowContext.store(stdout, []);
  return context.referenceManager.createReference(result.id, stdout);
}
```

## Best Practices

### Input Validation

Always validate inputs before processing:

```typescript
async execute(args, refs, context) {
  // Check required arguments
  if (args.length === 0) {
    throw new Error('Command requires at least one argument');
  }
  
  // Validate argument format
  const email = args[0];
  if (!email.includes('@')) {
    throw new Error(`Invalid email format: ${email}`);
  }
  
  // Check required references
  const required = refs.get('required-token');
  if (!required) {
    throw new Error('Required reference "required-token" not found');
  }
}
```

### Error Messages

Provide helpful error messages with context:

```typescript
// ✓ Good
throw new Error(`Invalid email format: ${email}. Expected format: user@domain.com`);

// ✗ Bad
throw new Error('Invalid email');
```

### Token Naming

Use clear, descriptive tokens:

```typescript
// ✓ Good
new TokenDecorator('validated-email')
new TokenDecorator('api-response')

// ✗ Bad
new TokenDecorator('result')
new TokenDecorator('data')
```

### Documentation

Document your command thoroughly:

```typescript
/**
 * ValidateEmailCommand validates email addresses using regex.
 * 
 * Supports:
 * - Single email validation
 * - Batch validation with --all flag
 * - Custom regex patterns with --pattern flag
 * 
 * Examples:
 *   open-tasks validate-email test@example.com
 *   open-tasks validate-email --ref emails --all
 *   open-tasks validate-email --ref input --pattern "[a-z]+@[a-z.]+"
 */
export default class ValidateEmailCommand extends CommandHandler {
  // ...
}
```

### Resource Cleanup

Clean up resources in error paths:

```typescript
async execute(args, refs, context) {
  const tempFile = await createTempFile();
  
  try {
    await processFile(tempFile);
  } finally {
    await fs.unlink(tempFile); // Always cleanup
  }
}
```

## Testing Commands

### Manual Testing

```bash
# 1. Build the CLI
npm run build

# 2. Copy command to .open-tasks/commands/
cp my-command.ts .open-tasks/commands/

# 3. Test execution
open-tasks my-command "test input"

# 4. Test with references
open-tasks store "data" --token d
open-tasks my-command --ref d

# 5. Check output files
ls .open-tasks/outputs/
```

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest';
import MyCommand from './.open-tasks/commands/my-command.js';

describe('MyCommand', () => {
  it('should have correct metadata', () => {
    const cmd = new MyCommand();
    expect(cmd.name).toBe('my-command');
    expect(cmd.description).toBeTruthy();
    expect(cmd.examples.length).toBeGreaterThan(0);
  });
  
  it('should execute successfully', async () => {
    const cmd = new MyCommand();
    const mockContext = createMockContext();
    const mockRefs = new Map();
    
    const result = await cmd.execute(['test'], mockRefs, mockContext);
    
    expect(result).toBeDefined();
    expect(result.content).toBe('expected output');
  });
});
```

## Deployment

### Project-Specific Commands

Keep in `.open-tasks/commands/` (gitignored by default):

```bash
# .gitignore
.open-tasks/commands/
.open-tasks/outputs/
```

### Shared Across Team

Commit to version control:

```bash
# Remove from .gitignore
# .open-tasks/commands/  # <- Remove this line

# Commit
git add .open-tasks/commands/my-command.ts
git commit -m "Add custom my-command"
```

### Reusable Library

Publish as npm package:

```json
{
  "name": "my-open-tasks-commands",
  "version": "1.0.0",
  "peerDependencies": {
    "open-tasks-cli": "^1.0.0"
  },
  "files": [
    "dist/"
  ]
}
```

Install in projects:

```bash
npm install my-open-tasks-commands
cp node_modules/my-open-tasks-commands/dist/*.js .open-tasks/commands/
```

## Example: Complete Command

Here's a complete example demonstrating best practices:

```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle } from 'open-tasks-cli';
import { TokenDecorator, FileNameDecorator } from 'open-tasks-cli/decorators';
import ora from 'ora';

/**
 * ExtractEmailsCommand extracts email addresses from text.
 * 
 * Features:
 * - Regex-based extraction
 * - Single or all matches (--all flag)
 * - Custom output filename (--output flag)
 * 
 * Examples:
 *   open-tasks extract-emails "Contact: test@example.com"
 *   open-tasks extract-emails --ref text --all
 *   open-tasks extract-emails --ref text --output emails.txt
 */
export default class ExtractEmailsCommand extends CommandHandler {
  name = 'extract-emails';
  description = 'Extract email addresses from text';
  examples = [
    'open-tasks extract-emails "Contact: test@example.com"',
    'open-tasks extract-emails --ref text --all',
    'open-tasks extract-emails --ref text --output emails.txt',
  ];

  private readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // Parse arguments
    const extractAll = args.includes('--all');
    const outputFile = args.find((arg, i) => args[i - 1] === '--output');
    const token = args.find((arg, i) => args[i - 1] === '--token') || 'emails';
    
    // Get input text
    const refValues = Array.from(refs.values());
    const inputText = refValues.length > 0
      ? String(refValues[0].content)
      : args[0];
    
    if (!inputText) {
      throw new Error('No input text provided. Use positional argument or --ref flag.');
    }
    
    // Extract emails
    const spinner = ora('Extracting emails...').start();
    
    try {
      const matches = inputText.match(this.EMAIL_REGEX);
      
      if (!matches || matches.length === 0) {
        spinner.warn('No email addresses found');
        throw new Error('No email addresses found in input text');
      }
      
      const result = extractAll
        ? matches.join('\n')
        : matches[0];
      
      spinner.succeed(`Found ${matches.length} email(s)`);
      
      // Store result with decorators
      const decorators = [
        new TokenDecorator(token),
        ...(outputFile ? [new FileNameDecorator(outputFile)] : []),
      ];
      
      const memoryRef = await context.workflowContext.store(result, decorators);
      
      // Return reference handle
      return context.referenceManager.createReference(
        memoryRef.id,
        result,
        token
      );
      
    } catch (error) {
      spinner.fail('Email extraction failed');
      throw error;
    }
  }
}
```

## Next Steps

- See [Managing Context](./Managing-Context.md) for decorator details
- See [Building Tasks](./Building-Tasks.md) for task-level workflows
- See [Command Library](./Command-Library.md) for built-in command examples
- See [Architecture](./Architecture.md) for system design

## Related Resources

- [CommandHandler API Reference](./Core-Concepts.md#commandhandler)
- [IWorkflowContext API](./Core-Concepts.md#iworkflowcontext)
- [Custom Command Template](../open-tasks-cli/templates/example-command.ts)
