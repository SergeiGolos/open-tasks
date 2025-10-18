# Migration Guide: Adding Output Control to Existing Commands

This guide shows how to update existing commands to use the new output control system.

## Table of Contents

- [Overview](#overview)
- [Why Migrate?](#why-migrate)
- [Backward Compatibility](#backward-compatibility)
- [Migration Steps](#migration-steps)
- [Before and After Examples](#before-and-after-examples)
- [Common Patterns](#common-patterns)
- [Testing Your Migration](#testing-your-migration)

## Overview

The output control system adds:
- ✅ Multiple verbosity levels (quiet, summary, verbose, stream)
- ✅ Output routing (screen, logs, custom files)
- ✅ Consistent formatting across commands
- ✅ Progress reporting for long operations
- ✅ Automatic timing and error handling

**Migration is optional** - existing commands continue to work without changes.

## Why Migrate?

### Benefits of Migration

1. **Better User Experience**
   - Users can control output verbosity
   - Progress feedback for long operations
   - Consistent output format across commands

2. **Easier Debugging**
   - Verbose mode shows detailed information
   - Automatic execution timing
   - Structured error reporting

3. **Automation Friendly**
   - Quiet mode for scripts
   - Log-only mode for background jobs
   - Parseable output formats

4. **Less Code**
   - Framework handles timing, formatting, error display
   - Helper utilities for common patterns
   - No need to manage console.log statements

### When to Migrate

- ✅ **Do migrate** if command would benefit from verbosity control
- ✅ **Do migrate** if command has long-running operations
- ✅ **Do migrate** if users request better output control
- ⏸️ **Wait to migrate** if command is simple and rarely used
- ⏸️ **Wait to migrate** if command output is already perfect

## Backward Compatibility

The new system is **100% backward compatible**:

```typescript
// OLD WAY - Still works!
export default class MyCommand extends CommandHandler {
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    console.log('Processing...');
    // ... command logic
    return result;
  }
}

// NEW WAY - Opt-in to output control
export default class MyCommand extends CommandHandler {
  async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    builder: IOutputBuilder
  ): Promise<ReferenceHandle> {
    builder.addProgress?.('Processing...');
    // ... command logic
    return result;
  }
}
```

**Key Points:**
- Old `execute()` method still works
- New `executeCommand()` method opts into output control
- Framework detects which method is implemented
- No breaking changes to existing code

## Migration Steps

### Step 1: Update Method Signature

**Before:**
```typescript
async execute(
  args: string[],
  refs: Map<string, ReferenceHandle>,
  context: ExecutionContext
): Promise<ReferenceHandle>
```

**After:**
```typescript
async executeCommand(
  args: string[],
  refs: Map<string, ReferenceHandle>,
  context: ExecutionContext,
  builder: IOutputBuilder
): Promise<ReferenceHandle>
```

**Changes:**
- Rename `execute` → `executeCommand`
- Add `builder: IOutputBuilder` parameter

### Step 2: Add Import

**Before:**
```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle } from '../types.js';
```

**After:**
```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle, IOutputBuilder } from '../types.js';
```

### Step 3: Replace console.log

**Before:**
```typescript
console.log('Processing file...');
```

**After:**
```typescript
builder.addProgress?.('Processing file...');
```

### Step 4: Add Verbose Details

**Before:**
```typescript
if (verbose) {
  console.log(`File size: ${size} bytes`);
  console.log(`Format: ${format}`);
}
```

**After:**
```typescript
if (context.verbosity === 'verbose') {
  builder.addSection('Processing Details', `
    File Size: ${size} bytes
    Format: ${format}
  `);
}
```

### Step 5: Remove Manual Timing

**Before:**
```typescript
const startTime = Date.now();
// ... do work
const duration = Date.now() - startTime;
console.log(`Completed in ${duration}ms`);
```

**After:**
```typescript
// Timing is automatic!
// Just return the result, framework handles timing
```

## Before and After Examples

### Example 1: Simple Store Command

**Before:**
```typescript
export default class StoreCommand extends CommandHandler {
  name = 'store';
  description = 'Store a value';

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const value = args[0];
    if (!value) {
      throw new Error('Store command requires a value argument');
    }

    const token = args.find((arg, i) => args[i - 1] === '--token');
    
    const decorators = token ? [new TokenDecorator(token)] : [];
    const memoryRef = await context.workflowContext.store(value, decorators);

    const outputFile = memoryRef.fileName
      ? `${context.outputDir}/${memoryRef.fileName}`
      : undefined;

    console.log(`Stored value (${value.length} bytes)`);
    if (token) {
      console.log(`Token: @${token}`);
    }

    return context.referenceManager.createReference(
      memoryRef.id,
      value,
      token,
      outputFile
    );
  }
}
```

**After:**
```typescript
import { addProcessingDetails } from '../output-utils.js';

export default class StoreCommand extends CommandHandler {
  name = 'store';
  description = 'Store a value';

  async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    builder: IOutputBuilder
  ): Promise<ReferenceHandle> {
    const value = args[0];
    if (!value) {
      throw new Error('Store command requires a value argument');
    }

    const token = args.find((arg, i) => args[i - 1] === '--token');
    
    builder.addProgress?.('Storing value...');

    const decorators = token ? [new TokenDecorator(token)] : [];
    const memoryRef = await context.workflowContext.store(value, decorators);

    const outputFile = memoryRef.fileName
      ? `${context.outputDir}/${memoryRef.fileName}`
      : undefined;

    // Verbose details
    if (context.verbosity === 'verbose') {
      addProcessingDetails(builder, {
        'Value Size': `${value.length} bytes`,
        'Token': token || 'None',
        'Reference ID': memoryRef.id,
      });
    }

    return context.referenceManager.createReference(
      memoryRef.id,
      value,
      token,
      outputFile
    );
  }
}
```

### Example 2: File Processing Command

**Before:**
```typescript
export default class LoadCommand extends CommandHandler {
  name = 'load';
  description = 'Load file content';

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const filePath = args[0];
    if (!filePath) {
      throw new Error('Load command requires a file path');
    }

    console.log(`Loading file: ${filePath}`);
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    console.log(`Loaded ${content.length} bytes`);

    const memoryRef = await context.workflowContext.store(content, []);
    return context.referenceManager.createReference(
      memoryRef.id,
      content
    );
  }
}
```

**After:**
```typescript
import { addFileInfoSection, addProcessingDetails } from '../output-utils.js';

export default class LoadCommand extends CommandHandler {
  name = 'load';
  description = 'Load file content';

  async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    builder: IOutputBuilder
  ): Promise<ReferenceHandle> {
    const filePath = args[0];
    if (!filePath) {
      throw new Error('Load command requires a file path');
    }

    builder.addProgress?.('Checking file...');

    // File info in verbose mode
    if (context.verbosity === 'verbose') {
      await addFileInfoSection(builder, filePath);
    }

    builder.addProgress?.('Reading file content...');
    const content = await fs.readFile(filePath, 'utf-8');

    // Processing details in verbose mode
    if (context.verbosity === 'verbose') {
      addProcessingDetails(builder, {
        'Content Length': `${content.length} bytes`,
        'Lines': String(content.split('\n').length),
      });
    }

    builder.addProgress?.('Storing in memory...');
    const memoryRef = await context.workflowContext.store(content, []);
    
    return context.referenceManager.createReference(
      memoryRef.id,
      content
    );
  }
}
```

### Example 3: Multi-Step Command

**Before:**
```typescript
export default class InitCommand extends CommandHandler {
  name = 'init';
  description = 'Initialize project';

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const openTasksDir = path.join(context.cwd, '.open-tasks');

    console.log('Creating .open-tasks directory...');
    await fs.mkdir(openTasksDir, { recursive: true });

    console.log('Creating subdirectories...');
    await fs.mkdir(path.join(openTasksDir, 'commands'), { recursive: true });
    await fs.mkdir(path.join(openTasksDir, 'outputs'), { recursive: true });

    console.log('Writing config...');
    await fs.writeFile(
      path.join(openTasksDir, 'config.json'),
      JSON.stringify({ version: '1.0' }, null, 2)
    );

    console.log('Initialization complete!');

    return context.referenceManager.createReference(
      'init',
      'initialized'
    );
  }
}
```

**After:**
```typescript
export default class InitCommand extends CommandHandler {
  name = 'init';
  description = 'Initialize project';

  async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    builder: IOutputBuilder
  ): Promise<ReferenceHandle> {
    const openTasksDir = path.join(context.cwd, '.open-tasks');

    builder.addProgress?.('Checking if .open-tasks directory exists...');
    const exists = await fs.access(openTasksDir).then(() => true, () => false);
    
    if (!exists) {
      builder.addProgress?.('Creating .open-tasks directory...');
      await fs.mkdir(openTasksDir, { recursive: true });
    }

    builder.addProgress?.('Creating commands subdirectory...');
    await fs.mkdir(path.join(openTasksDir, 'commands'), { recursive: true });

    builder.addProgress?.('Creating outputs subdirectory...');
    await fs.mkdir(path.join(openTasksDir, 'outputs'), { recursive: true });

    builder.addProgress?.('Writing config...');
    await fs.writeFile(
      path.join(openTasksDir, 'config.json'),
      JSON.stringify({ version: '1.0' }, null, 2)
    );

    // Verbose details
    if (context.verbosity === 'verbose') {
      builder.addSection('Created Files', `
        - .open-tasks/
        - .open-tasks/commands/
        - .open-tasks/outputs/
        - .open-tasks/config.json
      `);
    }

    return context.referenceManager.createReference(
      'init',
      'initialized'
    );
  }
}
```

## Common Patterns

### Pattern 1: Progress Messages

**Before:**
```typescript
console.log('Step 1...');
await step1();
console.log('Step 2...');
await step2();
```

**After:**
```typescript
builder.addProgress?.('Step 1...');
await step1();
builder.addProgress?.('Step 2...');
await step2();
```

### Pattern 2: Conditional Verbose Output

**Before:**
```typescript
const verbose = args.includes('--verbose');
if (verbose) {
  console.log('Detailed info...');
}
```

**After:**
```typescript
if (context.verbosity === 'verbose') {
  builder.addSection('Details', 'Detailed info...');
}
```

### Pattern 3: Error Handling

**Before:**
```typescript
try {
  await operation();
} catch (error) {
  console.error('Error:', error.message);
  throw error;
}
```

**After:**
```typescript
try {
  await operation();
} catch (error) {
  builder.addError?.(error as Error, { operation: 'operation-name' });
  throw error;
}
```

### Pattern 4: Execution Timing

**Before:**
```typescript
const start = Date.now();
await operation();
console.log(`Took ${Date.now() - start}ms`);
```

**After:**
```typescript
// Just do the work, framework handles timing!
await operation();
```

### Pattern 5: File Information

**Before:**
```typescript
const stats = await fs.stat(filePath);
console.log(`File size: ${stats.size} bytes`);
console.log(`Modified: ${stats.mtime}`);
```

**After:**
```typescript
import { addFileInfoSection } from '../output-utils.js';

if (context.verbosity === 'verbose') {
  await addFileInfoSection(builder, filePath);
}
```

## Testing Your Migration

### Test Checklist

- [ ] Command works with default verbosity (summary)
- [ ] `--quiet` shows minimal output
- [ ] `--verbose` shows detailed sections
- [ ] `--stream` shows progress messages
- [ ] `--screen-only` doesn't create files
- [ ] `--log-only` creates logs but shows nothing
- [ ] Errors display properly
- [ ] Timing is shown in output
- [ ] Existing tests still pass

### Test Commands

```bash
# Test all verbosity levels
$ open-tasks yourcommand args --quiet
$ open-tasks yourcommand args --summary
$ open-tasks yourcommand args --verbose
$ open-tasks yourcommand args --stream

# Test output targets
$ open-tasks yourcommand args --screen-only
$ open-tasks yourcommand args --log-only
$ open-tasks yourcommand args --both

# Test combinations
$ open-tasks yourcommand args --verbose --log-only
$ open-tasks yourcommand args --stream --file output.log
```

### Verification

**Summary mode (default):**
```bash
$ open-tasks yourcommand test
✓ yourcommand completed in 45ms
📁 Saved to: .open-tasks/outputs/20241018-130145-yourcommand/output.txt
```

**Quiet mode:**
```bash
$ open-tasks yourcommand test --quiet
✓ yourcommand completed in 45ms
```

**Verbose mode:**
```bash
$ open-tasks yourcommand test --verbose

Processing Details
──────────────────
Input: test
Output: 123 bytes

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: yourcommand
⏱️  Duration: 45ms
```

**Stream mode:**
```bash
$ open-tasks yourcommand test --stream
[0ms] ⏳ Starting...
[15ms] ⏳ Processing...
[40ms] ⏳ Finishing...

[45ms] 📊 Summary
────────────────────────────────────────────────────────────────────────────────
✓ yourcommand completed in 45ms
```

## Rollback Strategy

If you need to rollback a migration:

1. **Rename method back:**
   ```typescript
   // Change this
   async executeCommand(...)
   
   // To this
   async execute(...)
   ```

2. **Remove builder parameter:**
   ```typescript
   async execute(
     args: string[],
     refs: Map<string, ReferenceHandle>,
     context: ExecutionContext
     // Remove: builder: IOutputBuilder
   ): Promise<ReferenceHandle>
   ```

3. **Restore console.log statements:**
   ```typescript
   // Change
   builder.addProgress?.('Processing...');
   
   // Back to
   console.log('Processing...');
   ```

The old method signature is fully supported.

## Getting Help

- Check [Output Control API Reference](./Output-Control-API.md)
- Review [example-command.ts template](../templates/example-command.ts)
- Look at migrated built-in commands (store, load, init)
- Ask in discussions or open an issue

## See Also

- [Output Control API Reference](./Output-Control-API.md)
- [Verbosity Levels Guide](./Verbosity-Levels.md)
- [Output Targets Guide](./Output-Targets.md)
- [Building Custom Commands](./Building-Custom-Commands.md)
