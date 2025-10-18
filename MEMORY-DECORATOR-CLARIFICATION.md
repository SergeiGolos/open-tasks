# IMemoryDecorator and Output Directory Clarification

## Summary

This document clarifies the behavior of `IMemoryDecorator` and the output directory structure based on the actual implementation.

## IMemoryDecorator Behavior

### What IMemoryDecorators Do

**IMemoryDecorators** transform `MemoryRef` objects **before** files are written to disk.

### Execution Flow

```typescript
1. Create base MemoryRef
   { id: "uuid", content: "data", timestamp: Date }

2. Apply decorators in order
   - TokenDecorator → adds token
   - FileNameDecorator → sets fileName
   - MetadataDecorator → adds metadata
   
3. If no fileName set, apply default TimestampedFileNameDecorator
   
4. Write file to disk at: 
   .open-tasks/outputs/{timestamp}-{task-name}/{fileName}
   
5. Return fully decorated MemoryRef to user
```

### Key Point

**Decorators transform the MemoryRef BEFORE file creation**, not after. This means:

- `fileName` is set by decorators
- File is then written to the output directory
- User receives the decorated MemoryRef with `fileName` already set

### Example

```typescript
const ref = await context.store(
  "my data",
  [
    new TokenDecorator('mytoken'),
    new FileNameDecorator('custom.txt')
  ]
);

// At this point:
// - Decorators have already been applied
// - File has been written to disk
// - ref.fileName is set to "custom.txt"
// - Full path: .open-tasks/outputs/{timestamp}-{task}/custom.txt
```

## Output Directory Structure

### Per-Task Execution Directories

Each time `open-tasks <task-name>` is run, a new timestamped directory is created:

```
.open-tasks/outputs/
├── {timestamp}-{task-name}/
│   ├── file1.txt
│   ├── file2.md
│   └── ...
└── {timestamp}-{task-name}/
    └── ...
```

### Pattern

```
.open-tasks/outputs/{timestamp}-{verb}/{files-from-memory}
```

Where:
- `{timestamp}` = ISO 8601 timestamp (e.g., `20251018T143022456Z`)
- `{verb}` = Task name (e.g., `analyze-repo`, `process-data`)
- `{files-from-memory}` = Files created by MemoryRef storage

### Example

```bash
# First run
open-tasks analyze-repo ./src

# Creates:
.open-tasks/outputs/20251018T140000000Z-analyze-repo/
├── 20251018T140001234Z-git-log.txt
├── 20251018T140002456Z-analysis.md
└── 20251018T140003789Z-summary.txt

# Second run (5 minutes later)
open-tasks analyze-repo ./src

# Creates NEW directory:
.open-tasks/outputs/20251018T140500000Z-analyze-repo/
├── 20251018T140501234Z-git-log.txt
├── 20251018T140502456Z-analysis.md
└── 20251018T140503789Z-summary.txt
```

## Benefits of This Structure

### 1. Task Isolation

Each task execution is completely isolated:
- No file conflicts between runs
- Easy to compare different executions
- Clear execution history

### 2. Cleanup

Easy to clean up old task runs:

```bash
# Remove old analyze-repo runs
rm -rf .open-tasks/outputs/*-analyze-repo

# Keep only recent runs (last 24 hours)
find .open-tasks/outputs -type d -mtime +1 -exec rm -rf {} +
```

### 3. Debugging

Each directory represents a complete task execution:
- All outputs in one place
- Timestamped for chronology
- Named by task for clarity

### 4. Parallel Execution

Multiple tasks can run simultaneously without conflicts:

```bash
# Terminal 1
open-tasks analyze-repo

# Terminal 2 (simultaneously)
open-tasks process-data

# Creates:
.open-tasks/outputs/
├── 20251018T140000000Z-analyze-repo/
└── 20251018T140000001Z-process-data/
```

## Implementation Details

### DirectoryOutputContext

The `DirectoryOutputContext` class manages this structure:

```typescript
class DirectoryOutputContext implements IWorkflowContext {
  private outputDir: string;         // Base: .open-tasks/outputs
  private taskOutputDir: string;     // Per-run: {timestamp}-{task}
  
  async store(value: any, decorators?: IMemoryDecorator[]): Promise<MemoryRef> {
    // 1. Create base ref
    let ref: MemoryRef = { id, content: value, timestamp: new Date() };
    
    // 2. Apply decorators
    for (const decorator of decorators) {
      ref = decorator.decorate(ref);
    }
    
    // 3. Default fileName if not set
    if (!ref.fileName) {
      ref = new TimestampedFileNameDecorator(ref.token || ref.id).decorate(ref);
    }
    
    // 4. Write to {outputDir}/{timestamp}-{task}/{fileName}
    const filePath = path.join(this.taskOutputDir, ref.fileName);
    await fs.writeFile(filePath, content);
    
    // 5. Return decorated ref
    return ref;
  }
}
```

### Task Context Initialization

When a task starts:

```typescript
// Task router creates context with timestamped directory
const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
const taskOutputDir = `.open-tasks/outputs/${timestamp}-${taskName}`;
const context = new DirectoryOutputContext(taskOutputDir);

// All stores in this task go to this directory
await task.execute(args, context);
```

## FileNameDecorator Behavior

### Setting Only the Filename

`FileNameDecorator` sets the **filename**, not the full path:

```typescript
new FileNameDecorator('my-file.txt')
// Sets: ref.fileName = 'my-file.txt'
// File created at: .open-tasks/outputs/{timestamp}-{task}/my-file.txt
```

### Subdirectories

You can include subdirectories in the filename:

```typescript
new FileNameDecorator('reports/analysis.md')
// Sets: ref.fileName = 'reports/analysis.md'
// File created at: .open-tasks/outputs/{timestamp}-{task}/reports/analysis.md
```

### Custom Decorator for Path Control

For more control, create a custom decorator:

```typescript
class SubdirectoryDecorator implements IMemoryDecorator {
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
    new SubdirectoryDecorator('reports')
  ]
);
// File: .open-tasks/outputs/{timestamp}-{task}/reports/{timestamp}-analysis.txt
```

## Configuration

### Output Directory Configuration

```json
{
  "outputDirectory": ".open-tasks/outputs"
}
```

This sets the **base** directory. Task-specific directories are created within:

```
{outputDirectory}/
└── {timestamp}-{task}/
    └── files...
```

### Custom Base Directory

```json
{
  "outputDirectory": "./my-outputs"
}
```

Result:
```
./my-outputs/
└── 20251018T140000000Z-analyze-repo/
    └── files...
```

## Documentation Updates

The following wiki pages have been updated to reflect this structure:

1. **Managing-Context.md** (NEW) - Complete guide to MemoryRef and decorators
2. **Configuration.md** - Updated outputDirectory explanation
3. **Core-Concepts.md** - Updated MemoryRef flow and examples
4. **Architecture.md** - Updated directory structure diagram
5. **index.md** - Updated structure examples
6. **Quick-Start.md** - Added directory isolation explanation

## Key Takeaways

1. **IMemoryDecorators run before file creation** - They transform the MemoryRef, then the file is written
2. **Each task execution gets its own directory** - Pattern: `.open-tasks/outputs/{timestamp}-{task-name}/`
3. **FileNameDecorator sets filename only** - The full path includes the task directory
4. **Automatic timestamping** - If no FileNameDecorator provided, TimestampedFileNameDecorator is applied
5. **Complete isolation** - No conflicts between runs, easy cleanup, clear history

---

**Created**: October 18, 2025  
**Purpose**: Clarify IMemoryDecorator behavior and output directory structure  
**Status**: Documentation complete
