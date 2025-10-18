---
title: "Managing Context"
---

# Managing Context

Understanding MemoryRef objects, decorators, and context management in Open Tasks CLI.

## Overview

Open Tasks CLI uses a context-based system to pass data between commands. This page explains how to work with `MemoryRef` objects, apply decorators, and manage the workflow context.

## MemoryRef Objects

**MemoryRef** is a reference to stored data with metadata.

### Structure

```typescript
interface MemoryRef {
  id: string;           // Unique identifier (UUID)
  token?: string;       // Optional user-friendly name
  fileName?: string;    // File path (set by decorators)
  content: any;         // The actual data
  timestamp: Date;      // When it was created
  metadata?: TransformMetadata[];  // Applied transforms
}
```

### Creation

MemoryRefs are created when you:

1. **Store a value**
```typescript
const ref = await context.store("data", [new TokenDecorator('mydata')]);
```

2. **Run a command**
```typescript
const cmd = new PowershellCommand("echo 'hello'");
const [ref] = await context.run(cmd);
```

## IMemoryDecorator

**IMemoryDecorators** transform MemoryRef objects during storage, before files are written to disk.

### Interface

```typescript
interface IMemoryDecorator {
  decorate(ref: MemoryRef): MemoryRef;
}
```

### Execution Order

Decorators are applied **before** the file is written:

```typescript
1. Create base MemoryRef
2. Apply decorators (in order)
3. If no fileName set, add timestamped default
4. Write file to disk
5. Return decorated MemoryRef
```

### Built-in Decorators

#### TokenDecorator

Add a user-friendly token name:

```typescript
import { TokenDecorator } from 'open-tasks-cli/decorators';

const ref = await context.store(
  "my data",
  [new TokenDecorator('mytoken')]
);

console.log(ref.token);  // "mytoken"
```

#### FileNameDecorator

Set a custom file name:

```typescript
import { FileNameDecorator } from 'open-tasks-cli/decorators';

const ref = await context.store(
  "content",
  [new FileNameDecorator('custom-name.txt')]
);

console.log(ref.fileName);  // "custom-name.txt"
```

**Important**: This sets only the filename, not the full path. The file will still be created in the task's output directory.

#### TimestampedFileNameDecorator

Generate timestamped filename:

```typescript
import { TimestampedFileNameDecorator } from 'open-tasks-cli/decorators';

const ref = await context.store(
  "data",
  [new TimestampedFileNameDecorator('mydata', 'txt')]
);

// Result: "20251018T143022456Z-mydata.txt"
```

**Format**: `{timestamp}-{tokenOrId}.{extension}`

#### MetadataDecorator

Add transform metadata:

```typescript
import { MetadataDecorator } from 'open-tasks-cli/decorators';

const metadata: TransformMetadata = {
  type: 'RegexExtract',
  inputs: ['source-token'],
  params: { pattern: '/\\d+/g' },
  timestamp: new Date()
};

const ref = await context.store(
  "extracted data",
  [new MetadataDecorator(metadata)]
);
```

### Combining Decorators

Decorators are applied in order:

```typescript
const ref = await context.store(
  "important data",
  [
    new TokenDecorator('analysis'),           // 1. Add token
    new FileNameDecorator('analysis.md'),     // 2. Set filename
    new MetadataDecorator(metadata)           // 3. Add metadata
  ]
);
```

### Default Behavior

If no `FileNameDecorator` is provided, a `TimestampedFileNameDecorator` is automatically applied:

```typescript
// No fileName decorator
const ref = await context.store("data", [new TokenDecorator('mydata')]);

// Automatically gets: "20251018T143022456Z-mydata.txt"
```

## Output Directory Structure

Each task execution creates its own timestamped output directory:

### Directory Pattern

```
.open-tasks/outputs/
└── {timestamp}-{task-name}/
    ├── file-1.txt
    ├── file-2.md
    └── ...
```

### Example

```bash
# Run: open-tasks analyze-repo

.open-tasks/outputs/
└── 20251018T143022456Z-analyze-repo/
    ├── 20251018T143022500Z-git-log.txt
    ├── 20251018T143025123Z-analysis.md
    └── 20251018T143030789Z-summary.txt
```

### Task Isolation

Each task execution is isolated:

```bash
# First run
open-tasks process-data
# Creates: .open-tasks/outputs/20251018T140000000Z-process-data/

# Second run (different timestamp)
open-tasks process-data
# Creates: .open-tasks/outputs/20251018T150000000Z-process-data/
```

This ensures:
- No file conflicts between runs
- Complete execution history
- Easy cleanup of old runs

## Working with Context

### Storing Values

#### Basic Store

```typescript
const ref = await context.store("simple value");
// Default: .open-tasks/outputs/{timestamp}-{task}/uuid.txt
```

#### With Token

```typescript
const ref = await context.store(
  "data",
  [new TokenDecorator('mydata')]
);
// File: .open-tasks/outputs/{timestamp}-{task}/20251018T143022456Z-mydata.txt
```

#### With Custom Filename

```typescript
const ref = await context.store(
  "content",
  [
    new TokenDecorator('result'),
    new FileNameDecorator('output.md')
  ]
);
// File: .open-tasks/outputs/{timestamp}-{task}/output.md
```

#### With Metadata

```typescript
const ref = await context.store(
  "processed data",
  [
    new TokenDecorator('processed'),
    new MetadataDecorator({
      type: 'Processing',
      inputs: ['source'],
      params: { method: 'transform' },
      timestamp: new Date()
    })
  ]
);
```

File content includes metadata frontmatter:

```markdown
---
transforms:
  - type: Processing
    inputs: [source]
    params:
      method: "transform"
    timestamp: 2025-10-18T14:30:22.456Z
---

processed data
```

### Retrieving Values

#### By Token

```typescript
// Store with token
await context.store("value", [new TokenDecorator('mytoken')]);

// Retrieve latest
const value = context.token('mytoken');
console.log(value);  // "value"
```

**Note**: `token()` returns the **latest** value for that token name.

#### Multiple Tokens

```typescript
// First store
await context.store("v1", [new TokenDecorator('data')]);

// Second store (overwrites in token index)
await context.store("v2", [new TokenDecorator('data')]);

// Retrieves latest
const value = context.token('data');
console.log(value);  // "v2"
```

## Custom Decorators

Create your own decorators by implementing `IMemoryDecorator`:

### Example: PrefixDecorator

```typescript
import { IMemoryDecorator, MemoryRef } from 'open-tasks-cli/workflow';

class PrefixDecorator implements IMemoryDecorator {
  constructor(private prefix: string) {}

  decorate(ref: MemoryRef): MemoryRef {
    return {
      ...ref,
      fileName: `${this.prefix}-${ref.fileName || 'output.txt'}`
    };
  }
}

// Usage
const ref = await context.store(
  "data",
  [
    new TokenDecorator('mydata'),
    new PrefixDecorator('processed')
  ]
);
// File: processed-20251018T143022456Z-mydata.txt
```

### Example: ExtensionDecorator

```typescript
class ExtensionDecorator implements IMemoryDecorator {
  constructor(private extension: string) {}

  decorate(ref: MemoryRef): MemoryRef {
    const baseName = ref.fileName?.replace(/\.[^.]+$/, '') || 'output';
    return {
      ...ref,
      fileName: `${baseName}.${this.extension}`
    };
  }
}

// Usage
const ref = await context.store(
  "# Markdown Content",
  [
    new TokenDecorator('doc'),
    new ExtensionDecorator('md')
  ]
);
// File: 20251018T143022456Z-doc.md
```

### Example: DirectoryDecorator

```typescript
class DirectoryDecorator implements IMemoryDecorator {
  constructor(private subDir: string) {}

  decorate(ref: MemoryRef): MemoryRef {
    const fileName = ref.fileName || 'output.txt';
    return {
      ...ref,
      fileName: `${this.subDir}/${fileName}`
    };
  }
}

// Usage
const ref = await context.store(
  "data",
  [
    new TokenDecorator('analysis'),
    new DirectoryDecorator('reports')
  ]
);
// File: .open-tasks/outputs/{timestamp}-{task}/reports/20251018T143022456Z-analysis.txt
```

## Content Types

### String Content

```typescript
const ref = await context.store(
  "text content",
  [new TokenDecorator('text')]
);
// Stored as-is
```

### Object Content

```typescript
const ref = await context.store(
  { key: 'value', count: 42 },
  [new TokenDecorator('data')]
);
// Stored as JSON
```

File content:
```json
{
  "key": "value",
  "count": 42
}
```

### Buffer Content

```typescript
const buffer = Buffer.from('binary data');
const ref = await context.store(
  buffer,
  [new TokenDecorator('binary')]
);
// Stored as binary
```

## Complete Example

```typescript
import { 
  TaskHandler, 
  IWorkflowContext, 
  TaskOutcome, 
  generateId 
} from 'open-tasks-cli';
import { PowershellCommand } from 'open-tasks-cli/commands';
import { 
  TokenDecorator, 
  FileNameDecorator,
  MetadataDecorator 
} from 'open-tasks-cli/decorators';

export default class ProcessTask extends TaskHandler {
  static name = 'process';
  static description = 'Process data with decorators';

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'process',
      logs: [],
      errors: []
    };

    try {
      // 1. Read source file
      const readCmd = new PowershellCommand(`Get-Content ${args[0]}`);
      const [sourceRef] = await context.run(readCmd);
      
      // 2. Store with custom filename and metadata
      const processedRef = await context.store(
        sourceRef.content.toUpperCase(),
        [
          new TokenDecorator('processed'),
          new FileNameDecorator('processed.txt'),
          new MetadataDecorator({
            type: 'Uppercase',
            inputs: [sourceRef.token || sourceRef.id],
            params: { operation: 'toUpperCase' },
            timestamp: new Date()
          })
        ]
      );

      console.log(`✓ Processed: ${processedRef.fileName}`);
      
      // 3. Later retrieval
      const value = context.token('processed');
      console.log(`✓ Retrieved: ${value?.substring(0, 50)}...`);

    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

Output structure:
```
.open-tasks/outputs/20251018T143022456Z-process/
└── processed.txt
```

File content:
```markdown
---
transforms:
  - type: Uppercase
    inputs: [source-id]
    params:
      operation: "toUpperCase"
    timestamp: 2025-10-18T14:30:22.456Z
---

UPPERCASED CONTENT HERE
```

## Best Practices

1. **Always use TokenDecorator** - For retrievable values
2. **Set meaningful filenames** - Use FileNameDecorator for clarity
3. **Add metadata** - Track transforms for debugging
4. **Combine decorators** - Layer functionality
5. **Custom decorators** - For project-specific patterns
6. **Check file paths** - Verify output directory structure
7. **Clean old runs** - Manage `.open-tasks/outputs/` size

## Troubleshooting

### "Cannot read token"

```typescript
const value = context.token('missing');  // undefined
```

**Solution**: Ensure the token was stored first:
```typescript
await context.store("data", [new TokenDecorator('mytoken')]);
```

### "File already exists"

Task runs are isolated by timestamp, so this is rare. If it happens:

**Solution**: Use unique filenames or tokens per operation within a task.

### "Metadata not showing"

Ensure you're using `MetadataDecorator`:
```typescript
const ref = await context.store(
  "data",
  [new MetadataDecorator(metadata)]
);
```

## Next Steps

- **[[Building Tasks]]** - Use context in tasks
- **[[Command Library]]** - Commands that create MemoryRefs
- **[[Workflow API]]** - Deep dive into IWorkflowContext
- **[[Core Concepts]]** - Understand the architecture
