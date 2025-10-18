# Custom Command Development Guide

This guide explains how to create custom commands for open-tasks-cli, from basic implementations to advanced patterns.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Command Handler Interface](#command-handler-interface)
3. [Command Discovery](#command-discovery)
4. [Execution Context](#execution-context)
5. [Working with References](#working-with-references)
6. [Workflow Context API](#workflow-context-api)
7. [Advanced Patterns](#advanced-patterns)
8. [Best Practices](#best-practices)
9. [Testing Commands](#testing-commands)
10. [Deployment](#deployment)

## Quick Start

###  1. Initialize Your Project

```bash
open-tasks init
```

This creates `.open-tasks/commands/` directory for your custom commands.

### 2. Create a Command File

Create `.open-tasks/commands/hello.ts`:

```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle } from 'open-tasks-cli';

export default class HelloCommand extends CommandHandler {
  name = 'hello';
  description = 'Say hello to someone';
  examples = ['open-tasks hello --ref name'];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const nameRef = Array.from(refs.values())[0];
    const name = nameRef ? nameRef.content : 'World';
    const greeting = `Hello, ${name}!`;

    const memoryRef = await context.workflowContext.store(greeting, []);
    
    return context.referenceManager.createReference(
      memoryRef.id,
      greeting
    );
  }
}
```

### 3. Use Your Command

```bash
open-tasks store "Alice" --token name
open-tasks hello --ref name
# Output: Hello, Alice!
```

## Command Handler Interface

All custom commands must extend the `CommandHandler` abstract class:

```typescript
abstract class CommandHandler {
  // REQUIRED: Command name (lowercase, hyphen-separated)
  abstract name: string;
  
  // REQUIRED: Short description for help text
  abstract description: string;
  
  // REQUIRED: Usage examples (array of strings)
  abstract examples: string[];
  
  // REQUIRED: Execute method with command logic
  abstract execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

### Required Properties

#### `name: string`

The command name used in the CLI. Must be:
- Lowercase
- Hyphen-separated for multi-word commands
- Unique across all commands

```typescript
name = 'validate-email';  // ✓ Good
name = 'ValidateEmail';   // ✗ Bad: not lowercase
name = 'validate_email';  // ✗ Bad: use hyphens, not underscores
```

#### `description: string`

A brief description shown in help output:

```typescript
description = 'Validate email addresses using regex';  // ✓ Good
description = 'Validates emails';                      // ✓ Acceptable
description = 'This command validates...';            // ✗ Too verbose
```

#### `examples: string[]`

Array of usage examples shown in command-specific help:

```typescript
examples = [
  'open-tasks validate-email --ref input',
  'open-tasks validate-email "test@example.com"',
  'open-tasks validate-email --ref emails --all',
];
```

### Execute Method

The `execute` method contains your command logic:

```typescript
async execute(
  args: string[],               // Command-line arguments
  refs: Map<string, ReferenceHandle>,  // Referenced values
  context: ExecutionContext     // Shared services
): Promise<ReferenceHandle>     // Return value reference
```

**Parameters:**

- `args`: Array of command-line arguments (positional args and flags)
- `refs`: Map of reference handles passed via `--ref` flags
- `context`: Execution context with shared services

**Returns:**

- `Promise<ReferenceHandle>`: Reference to the command's output

## Command Discovery

Custom commands are automatically discovered from `.open-tasks/commands/`:

### Discovery Rules

1. **File Location**: Must be in `.open-tasks/commands/` directory
2. **File Extension**: `.js` or `.ts` files
3. **Default Export**: Must export class as `default`
4. **Extends CommandHandler**: Class must extend `CommandHandler`

### Example Directory Structure

```
.open-tasks/
├── commands/
│   ├── validate-email.ts      # ✓ Discovered
│   ├── transform-data.js      # ✓ Discovered
│   ├── utils/
│   │   └── helpers.ts         # ✗ Not discovered (subdirectory)
│   └── README.md              # ✗ Not discovered (not .js/.ts)
├── outputs/
└── config.json
```

### Export Format

**Correct (Default Export):**

```typescript
export default class MyCommand extends CommandHandler {
  // ...
}
```

**Incorrect (Named Export):**

```typescript
export class MyCommand extends CommandHandler {  // ✗ Won't be discovered
  // ...
}
```

## Execution Context

The `ExecutionContext` provides access to shared services:

```typescript
interface ExecutionContext {
  cwd: string;                      // Current working directory
  outputDir: string;                // Output directory path
  referenceManager: ReferenceManager; // Reference management
  outputHandler: OutputHandler;     // File output operations
  workflowContext: DirectoryOutputContext; // Workflow API
  config: Record<string, any>;      // Configuration object
}
```

### Services

#### `cwd: string`

Current working directory where CLI was invoked:

```typescript
const configPath = path.join(context.cwd, 'config.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
```

#### `outputDir: string`

Directory for output files (typically `.open-tasks/outputs/`):

```typescript
const outputPath = path.join(context.outputDir, 'custom.txt');
await fs.writeFile(outputPath, content);
```

#### `referenceManager: ReferenceManager`

Manage in-memory references:

```typescript
// Create a reference
const ref = context.referenceManager.createReference(
  'unique-id',
  'content',
  'my-token',
  '/path/to/file.txt'
);

// Retrieve a reference
const retrieved = context.referenceManager.getReference('my-token');

// List all references
const all = context.referenceManager.listReferences();
```

#### `outputHandler: OutputHandler`

Write files and error logs:

```typescript
// Write output file
const filePath = await context.outputHandler.writeOutput(
  content,
  'filename.txt'
);

// Write error log
await context.outputHandler.writeError(error, {
  command: this.name,
  args,
});

// Get output directory
const dir = context.outputHandler.getOutputDir();
```

#### `workflowContext: DirectoryOutputContext`

Workflow processing API:

```typescript
// Store a value with automatic file creation
const memoryRef = await context.workflowContext.store(value, decorators);

// Look up a token
const value = context.workflowContext.token('my-token');

// Execute a command
const results = await context.workflowContext.run(commandInstance);
```

#### `config: Record<string, any>`

Project configuration from `.open-tasks/config.json`:

```typescript
const customSetting = context.config.myCustomSetting || 'default';
```

## Working with References

References enable command chaining by passing outputs between commands.

### Understanding References

```typescript
interface ReferenceHandle {
  id: string;           // Unique UUID
  token?: string;       // Optional user-defined token
  content: any;         // The actual value
  timestamp: Date;      // When created
  outputFile?: string;  // Path to output file (if any)
}
```

### Accessing References

References are passed to commands via `--ref` flags:

```bash
open-tasks store "data" --token mydata
open-tasks my-command --ref mydata
```

In your command:

```typescript
async execute(args, refs, context) {
  // Get all reference keys
  const refKeys = Array.from(refs.keys());
  
  // Get first reference
  const firstRef = Array.from(refs.values())[0];
  
  // Get specific reference by token
  const myRef = refs.get('mydata');
  
  if (myRef) {
    const content = myRef.content;
    const filePath = myRef.outputFile;
    // Use the data...
  }
}
```

### Creating References

Always return a `ReferenceHandle` from your command:

```typescript
// Method 1: Using workflow context (recommended)
const memoryRef = await context.workflowContext.store(result, []);
return context.referenceManager.createReference(
  memoryRef.id,
  result,
  token,
  memoryRef.fileName
);

// Method 2: Manual creation
return context.referenceManager.createReference(
  uuidv4(),
  result,
  token,
  outputFilePath
);
```

### Reference Lifetime

**Important**: References are ephemeral!

- ✓ Exist in memory during CLI execution
- ✓ Files persist in `.open-tasks/outputs/`
- ✗ References NOT preserved across CLI invocations

**Cross-session usage:**

```bash
# Session 1: Store data
open-tasks store "data" --token mydata
# Creates: .open-tasks/outputs/20251018T143052-mydata.txt

# Session 2: Load from file
open-tasks load .open-tasks/outputs/20251018T143052-mydata.txt --token mydata
open-tasks my-command --ref mydata
```

## Workflow Context API

The Workflow Context provides an internal API for orchestrating operations:

### `store(value, decorators)`

Store a value and create a memory reference:

```typescript
import { TokenDecorator } from 'open-tasks-cli/workflow';

const memoryRef = await context.workflowContext.store(
  'my value',
  [new TokenDecorator('mytoken')]
);

// memoryRef.id        // Unique ID
// memoryRef.token     // 'mytoken'
// memoryRef.fileName  // Output file name
```

### `token(name)`

Look up a value by token (synchronous):

```typescript
const value = context.workflowContext.token('mytoken');
if (value) {
  // Token exists, use the value
} else {
  // Token not found
}
```

### `run(command)`

Execute an `ICommand` implementation:

```typescript
import { TokenReplaceCommand } from 'open-tasks-cli/workflow';

const command = new TokenReplaceCommand({
  template: 'Hello {{name}}!',
  tokens: { name: 'World' }
});

const results = await context.workflowContext.run(command);
// results is an array of MemoryRef objects
```

## Advanced Patterns

### Pattern 1: Multi-Step Processing

```typescript
async execute(args, refs, context) {
  // Step 1: Get input
  const input = args[0];
  
  // Step 2: Process
  const processed = await this.processData(input);
  
  // Step 3: Store intermediate result
  const intermediate = await context.workflowContext.store(
    processed,
    [new TokenDecorator('intermediate')]
  );
  
  // Step 4: Further transform
  const final = await this.transform(processed);
  
  // Step 5: Store final result
  const result = await context.workflowContext.store(
    final,
    [new TokenDecorator('final')]
  );
  
  return context.referenceManager.createReference(
    result.id,
    final,
    'final',
    result.fileName
  );
}
```

### Pattern 2: File Operations

```typescript
import { promises as fs } from 'fs';
import path from 'path';

async execute(args, refs, context) {
  // Read additional config file
  const configPath = path.join(context.cwd, '.open-tasks', 'my-config.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
  
  // Process based on config
  const result = await this.processWithConfig(config);
  
  // Write custom output
  const customPath = path.join(context.outputDir, 'report.html');
  await fs.writeFile(customPath, result);
  
  // Return reference
  const memoryRef = await context.workflowContext.store(result, []);
  return context.referenceManager.createReference(
    memoryRef.id,
    result,
    undefined,
    customPath
  );
}
```

### Pattern 3: External Process Execution

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async execute(args, refs, context) {
  const script = args[0];
  
  try {
    const { stdout, stderr } = await execAsync(script, {
      cwd: context.cwd,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    
    if (stderr) {
      console.warn('Warning:', stderr);
    }
    
    const memoryRef = await context.workflowContext.store(stdout, []);
    return context.referenceManager.createReference(
      memoryRef.id,
      stdout
    );
  } catch (error) {
    await context.outputHandler.writeError(error as Error, {
      command: this.name,
      script,
    });
    throw error;
  }
}
```

### Pattern 4: Progress Indicators

```typescript
import ora from 'ora';

async execute(args, refs, context) {
  const spinner = ora('Processing data...').start();
  
  try {
    // Long operation
    const result = await this.longRunningTask();
    
    spinner.text = 'Saving results...';
    const memoryRef = await context.workflowContext.store(result, []);
    
    spinner.succeed('Processing complete!');
    
    return context.referenceManager.createReference(
      memoryRef.id,
      result
    );
  } catch (error) {
    spinner.fail('Processing failed');
    throw error;
  }
}
```

### Pattern 5: Validation and Error Handling

```typescript
async execute(args, refs, context) {
  // Validate inputs
  if (args.length === 0) {
    throw new Error('Command requires at least one argument');
  }
  
  if (refs.size === 0) {
    throw new Error('Command requires --ref flag with input data');
  }
  
  const input = args[0];
  
  // Validate format
  if (!/^[a-z0-9-]+$/.test(input)) {
    throw new Error('Input must contain only lowercase letters, numbers, and hyphens');
  }
  
  try {
    const result = await this.processInput(input);
    const memoryRef = await context.workflowContext.store(result, []);
    
    return context.referenceManager.createReference(
      memoryRef.id,
      result
    );
  } catch (error) {
    // Log detailed error
    await context.outputHandler.writeError(error as Error, {
      command: this.name,
      input,
      refs: Array.from(refs.keys()),
    });
    
    // Throw user-friendly error
    throw new Error(`Failed to process input: ${(error as Error).message}`);
  }
}
```

## Best Practices

### 1. Input Validation

Always validate inputs before processing:

```typescript
// ✓ Good: Validate early
if (args.length === 0) {
  throw new Error('Command requires an input argument');
}

const input = args[0];
if (!input.trim()) {
  throw new Error('Input cannot be empty');
}

// ✗ Bad: No validation
const input = args[0];  // May be undefined
const result = input.toUpperCase();  // May crash
```

### 2. Helpful Error Messages

Provide context in error messages:

```typescript
// ✓ Good: Specific and helpful
throw new Error('Email validation failed: invalid format for "user@"');

// ✗ Bad: Vague
throw new Error('Invalid input');
```

### 3. Use Tokens for Outputs

Make results easy to reference in workflows:

```typescript
// ✓ Good: Named token
const token = args.find((arg, i) => args[i - 1] === '--token');
const memoryRef = await context.workflowContext.store(
  result,
  token ? [new TokenDecorator(token)] : []
);

// ✗ Bad: Always anonymous
const memoryRef = await context.workflowContext.store(result, []);
```

### 4. Support Common Flags

Implement standard CLI patterns:

```typescript
const verbose = args.includes('--verbose');
const quiet = args.includes('--quiet');
const dryRun = args.includes('--dry-run');

if (verbose) {
  console.log('Detailed processing information...');
}
```

### 5. Document Examples

Provide real, tested examples:

```typescript
examples = [
  'open-tasks my-command "input"',              // Basic usage
  'open-tasks my-command --ref data',           // With reference
  'open-tasks my-command "input" --token out',  // With token
  'open-tasks my-command --verbose',            // With flag
];
```

### 6. Clean Resource Management

Always clean up resources:

```typescript
async execute(args, refs, context) {
  const file = await fs.open(filePath, 'r');
  try {
    const content = await file.readFile('utf-8');
    // Process content...
    return result;
  } finally {
    await file.close();  // Always close
  }
}
```

### 7. Consistent Return Values

Always return `ReferenceHandle`:

```typescript
// ✓ Good: Consistent return
async execute(args, refs, context): Promise<ReferenceHandle> {
  const result = await this.process();
  const memoryRef = await context.workflowContext.store(result, []);
  return context.referenceManager.createReference(memoryRef.id, result);
}

// ✗ Bad: Direct return
async execute(args, refs, context) {
  return "result";  // Wrong type
}
```

## Testing Commands

### Manual Testing

```bash
# 1. Build the CLI
npm run build

# 2. Link for testing
npm link

# 3. Test your command
open-tasks my-command "test input"

# 4. Test with references
open-tasks store "data" --token d
open-tasks my-command --ref d

# 5. Check output files
ls .open-tasks/outputs/
cat .open-tasks/outputs/YYYYMMDDTHHMMSS-*.txt
```

### Unit Testing

Create test file in `test/my-command.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import MyCommand from '../src/commands/my-command.js';
import { ExecutionContext, ReferenceManager, OutputHandler } from '../src/types.js';
import { DirectoryOutputContext } from '../src/workflow/index.js';

describe('MyCommand', () => {
  let command: MyCommand;
  let context: ExecutionContext;

  beforeEach(() => {
    command = new MyCommand();
    const outputDir = './test-output';
    
    context = {
      cwd: process.cwd(),
      outputDir,
      referenceManager: new ReferenceManager(),
      outputHandler: new OutputHandler(outputDir),
      workflowContext: new DirectoryOutputContext(outputDir),
      config: {},
    };
  });

  it('should process input correctly', async () => {
    const result = await command.execute(
      ['test input'],
      new Map(),
      context
    );

    expect(result.content).toBe('expected output');
  });

  it('should handle references', async () => {
    const ref = context.referenceManager.createReference('id1', 'data', 'token1');
    const refs = new Map([['token1', ref]]);

    const result = await command.execute([], refs, context);

    expect(result.content).toContain('data');
  });

  it('should throw error for invalid input', async () => {
    await expect(
      command.execute([], new Map(), context)
    ).rejects.toThrow('Command requires an input argument');
  });
});
```

### Integration Testing

Test command in realistic workflows:

```bash
#!/bin/bash

# integration-test.sh

set -e

echo "Testing my-command workflow..."

# Setup
open-tasks init

# Step 1: Store data
open-tasks store "test data" --token input

# Step 2: Process with custom command
open-tasks my-command --ref input --token output

# Step 3: Verify output exists
if [ ! -f .open-tasks/outputs/*-output.txt ]; then
  echo "Error: Output file not created"
  exit 1
fi

echo "✓ Workflow test passed"
```

## Deployment

### Project-Specific Commands

For commands specific to one project:

1. Keep in `.open-tasks/commands/`
2. Add to `.gitignore` if sensitive
3. Or commit to share with team

### Shared Commands

For reusable commands across projects:

**Option 1: Template System**

```bash
# Create templates directory
mkdir -p ~/.open-tasks/templates/

# Copy command template
cp my-command.ts ~/.open-tasks/templates/

# Use in new projects
cp ~/.open-tasks/templates/my-command.ts .open-tasks/commands/
```

**Option 2: npm Package**

1. Create package structure:

```
my-commands/
├── package.json
├── src/
│   ├── command1.ts
│   └── command2.ts
└── README.md
```

2. Configure `package.json`:

```json
{
  "name": "my-open-tasks-commands",
  "version": "1.0.0",
  "main": "dist/index.js",
  "peerDependencies": {
    "open-tasks-cli": "^1.0.0"
  }
}
```

3. Publish and install:

```bash
npm publish
cd my-project
npm install my-open-tasks-commands
```

4. Link commands:

```bash
# Manually link or copy to .open-tasks/commands/
cp node_modules/my-open-tasks-commands/dist/*.js .open-tasks/commands/
```

### Documentation

Always include:

1. **README**: Usage instructions
2. **Examples**: Real-world scenarios
3. **Dependencies**: Required tools/packages
4. **Configuration**: Required setup
5. **Testing**: How to test the command

---

## Additional Resources

- [Main README](../README.md) - Installation and usage
- [Example Template](../templates/example-command.ts) - Full template with comments
- [API Documentation](../README.md#api-documentation) - Type definitions
- [Built-in Commands](../src/commands/) - Reference implementations

## Getting Help

- Check existing commands for examples
- Read error messages carefully
- Test incrementally
- Use `--verbose` flag for debugging
- Review workflow context documentation

Happy commanding! 🚀
