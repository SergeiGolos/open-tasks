# IOutputBuilder Architecture Guide

## Overview

The `IOutputBuilder` system provides a flexible, extensible architecture for controlling how commands display their output. It enables both the **core application framework** and **individual command implementations** to control output formatting, verbosity, and routing.

---

## Core Architecture

### 1. The IOutputBuilder Interface

The interface defines a contract for building formatted command output:

```typescript
interface IOutputBuilder {
  addSection(title: string, content: string): void;
  addSummary(data: SummaryData): void;
  addProgress(message: string): void;
  addError(error: Error, context?: Record<string, any>): void;
  build(): string;
}
```

**Key Design Principles:**
- **Builder Pattern**: Incrementally construct output
- **Verbosity Agnostic**: Commands use the same API regardless of verbosity level
- **Implementation-Specific Behavior**: Each builder decides what to show/hide

---

## Four Output Builder Implementations

### 1. QuietOutputBuilder
**Verbosity Level:** `quiet` (`--quiet` or `-q`)

**Purpose:** Minimal output for CI/CD, scripting, automation

**Behavior:**
- Ignores `addSection()` calls
- Ignores `addProgress()` calls  
- Only shows final status via `addSummary()`
- Single-line output

**Example Output:**
```
✓ store completed in 150ms
```

**Implementation Strategy:**
```typescript
addSection(_title: string, _content: string): void {
  // Quiet mode ignores sections
}

build(): string {
  const { commandName, executionTime, success } = this.summaryData;
  const icon = success ? '✓' : '✗';
  return `${icon} ${commandName} completed in ${executionTime}ms`;
}
```

---

### 2. SummaryOutputBuilder (Default)
**Verbosity Level:** `summary` (`--summary` or `-s`, or no flag)

**Purpose:** Normal interactive command-line usage

**Behavior:**
- Ignores `addSection()` calls
- Ignores `addProgress()` calls
- Shows formatted summary with icons
- Displays output file and reference token

**Example Output:**
```
✓ store completed in 150ms
📁 Saved to: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference: @mydata
```

**Implementation Strategy:**
```typescript
build(): string {
  const lines: string[] = [];
  const icon = success ? '✓' : '✗';
  lines.push(`${icon} ${commandName} completed in ${executionTime}ms`);
  
  if (outputFile) {
    lines.push(`📁 Saved to: ${outputFile}`);
  }
  
  if (referenceToken) {
    lines.push(`🔗 Reference: @${referenceToken}`);
  }
  
  return lines.join('\n');
}
```

---

### 3. VerboseOutputBuilder
**Verbosity Level:** `verbose` (`--verbose` or `-v`)

**Purpose:** Detailed output for debugging, development, troubleshooting

**Behavior:**
- Shows ALL `addSection()` calls
- Collects `addProgress()` (commands can output immediately if desired)
- Displays detailed summary with metadata
- Formats with headers and structured content

**Example Output:**
```

⚙️  Processing Details
────────────────────────────────────────
{
  "Value Length": 11,
  "Size": "11 B",
  "Token": "mydata",
  "Reference ID": "abc123",
  "Output File": ".open-tasks/outputs/output.txt"
}

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: store
⏱️  Duration: 150ms
📁 Output File: .open-tasks/outputs/output.txt
🔗 Reference Token: @mydata

📋 Metadata:
{
  "processed": true
}
```

**Implementation Strategy:**
```typescript
private sections: Array<{ title: string; content: string }> = [];

addSection(title: string, content: string): void {
  this.sections.push({ title, content });
}

build(): string {
  const lines: string[] = [];
  
  // Add all sections first
  for (const { title, content } of this.sections) {
    lines.push(`\n${title}`);
    lines.push('─'.repeat(Math.min(title.length, 80)));
    lines.push(content);
  }
  
  // Add detailed summary at the end
  // ... (with metadata, file info, etc.)
  
  return lines.join('\n');
}
```

---

### 4. StreamingOutputBuilder
**Verbosity Level:** `stream` (future implementation)

**Purpose:** Real-time output for long-running operations

**Behavior:**
- Outputs sections **immediately** (no buffering)
- Shows timestamps or elapsed time for each update
- Displays progress indicators in real-time
- `build()` returns empty string (already printed)

**Example Output:**
```
[0ms] ⏳ Starting download...
[150ms] Downloading chunk 1
────────────────────────────────────────
Downloaded 1024 bytes

[300ms] ⏳ Downloading chunk 2...
[450ms] Downloading chunk 2
────────────────────────────────────────
Downloaded 2048 bytes

[600ms] 📊 Summary
────────────────────────────────────────
✓ download completed in 600ms
📁 Saved to: output.bin
```

**Implementation Strategy:**
```typescript
addSection(title: string, content: string): void {
  const elapsed = Date.now() - this.startTime;
  console.log(`\n[${elapsed}ms] ${title}`);
  console.log('─'.repeat(80));
  console.log(content);
  // Immediately outputs to console - no buffering!
}

build(): string {
  return ''; // Everything already printed
}
```

---

## How Core Application Controls Output

### 1. CommandHandler Base Class

The `CommandHandler` base class provides automatic output control:

```typescript
abstract class CommandHandler {
  protected defaultVerbosity?: VerbosityLevel;

  async execute(args, refs, context): Promise<ReferenceHandle> {
    return this.executeWithOutputControl(args, refs, context);
  }

  private async executeWithOutputControl(args, refs, context) {
    const startTime = Date.now();
    const builder = this.createOutputBuilder(context);

    try {
      const result = await this.executeCommand(args, refs, context);
      await this.handleOutput(result, context, startTime, builder);
      return result;
    } catch (error) {
      await this.handleError(error, context, startTime, builder);
      throw error;
    }
  }
}
```

**Key Features:**
- **Automatic Timing**: Tracks execution time
- **Builder Creation**: Creates appropriate builder based on verbosity
- **Output Handling**: Formats and routes output automatically
- **Error Handling**: Standardizes error reporting

---

### 2. Verbosity Resolution Hierarchy

The framework resolves verbosity level in this order:

1. **CLI Flag** (highest priority): `context.verbosity` from `--verbose`, `--quiet`, etc.
2. **Command Default**: `command.defaultVerbosity` (if set)
3. **Global Default**: `'summary'` (fallback)

```typescript
protected createOutputBuilder(context: ExecutionContext): IOutputBuilder {
  const verbosity = context.verbosity || this.defaultVerbosity || 'summary';
  return createOutputBuilderFactory(verbosity);
}
```

**Example:**
```typescript
export default class MyCommand extends CommandHandler {
  protected defaultVerbosity = 'verbose'; // This command defaults to verbose
  
  // If user runs: open-tasks mycommand
  //   → Uses 'verbose' (command default)
  
  // If user runs: open-tasks mycommand --quiet
  //   → Uses 'quiet' (CLI flag overrides)
}
```

---

### 3. Output Routing

The `OutputHandler` class controls where output goes:

```typescript
class OutputHandler {
  shouldOutputToScreen(target: OutputTarget): boolean {
    return target === 'screen-only' || target === 'both' || target === 'file';
  }

  shouldOutputToFile(target: OutputTarget): boolean {
    return target === 'log-only' || target === 'both' || target === 'file';
  }

  async writeOutputWithRouting(
    content: string,
    fileName: string,
    outputTarget: OutputTarget = 'both',
    customPath?: string
  ): Promise<string | undefined>
}
```

**Output Target Options:**
- `screen-only`: Console only
- `log-only`: File only (silent)
- `both`: Console + file (default)
- `file`: Console + custom file path

---

## How Individual Commands Control Output

### Pattern 1: Using the Builder During Execution

Commands can add content to the builder throughout execution:

```typescript
export default class StoreCommand extends CommandHandler {
  protected async executeCommand(args, refs, context) {
    const builder = this.createOutputBuilder(context);
    
    // Add progress (ignored in quiet/summary, shown in verbose)
    builder.addProgress('Preparing to store value...');
    
    // Do work
    const memoryRef = await context.workflowContext.store(value, decorators);
    
    builder.addProgress('Value stored successfully');
    
    // Add verbose details (only shown in verbose mode)
    if (context.verbosity === 'verbose') {
      addProcessingDetails(builder, {
        'Value Length': value.length,
        'Token': token || 'none',
        'Reference ID': ref.id,
      });
    }
    
    return ref;
    // Summary added automatically by CommandHandler.handleOutput()
  }
}
```

**Key Insight:** Commands call `builder.addSection()` and `builder.addProgress()` but the **builder implementation** decides what to do with them!

---

### Pattern 2: Conditional Verbose Output

Commands can check verbosity and add extra details:

```typescript
protected async executeCommand(args, refs, context) {
  // Core logic always runs
  const result = await doWork();
  
  // Verbose-specific output
  if (context.verbosity === 'verbose') {
    const builder = this.createOutputBuilder(context);
    
    builder.addSection('📋 Configuration', JSON.stringify(config, null, 2));
    builder.addSection('📊 Statistics', 
      `Processed: ${stats.processed}\nFailed: ${stats.failed}`
    );
  }
  
  return result;
}
```

---

### Pattern 3: Progressive Output (Verbose Mode)

Some commands can output progressively even in verbose mode:

```typescript
protected async executeCommand(args, refs, context) {
  const builder = this.createOutputBuilder(context);
  
  for (const item of items) {
    // Add progress
    builder.addProgress(`Processing ${item.name}...`);
    
    // In verbose mode, manually output to console if desired
    if (context.verbosity === 'verbose') {
      console.log(`Processing ${item.name}...`);
    }
    
    await processItem(item);
  }
  
  return result;
}
```

**Note:** This gives commands control over **when** to output, not just **what** to output.

---

## Helper Utilities

The framework provides utilities to simplify common patterns:

```typescript
// Add formatted section
addFormattedSection(builder, 'Title', { key: 'value' });

// Add file information
addFileInfoSection(builder, filePath, size, mimeType);

// Add processing details
addProcessingDetails(builder, {
  'Input File': inputFile,
  'Output File': outputFile,
  'Records Processed': count,
});

// Add progress with elapsed time
addProgressWithTime(builder, 'Processing batch 1', startTime);

// Format file sizes
formatFileSize(1024); // "1.00 KB"
```

---

## Real-World Example: Init Command

Let's trace how the `init` command uses the output system:

```typescript
export default class InitCommand extends CommandHandler {
  protected async executeCommand(args, refs, context) {
    const builder = this.createOutputBuilder(context);
    
    // Progress messages (ignored in quiet/summary)
    builder.addProgress('Checking for existing project...');
    const exists = await fse.pathExists(openTasksDir);
    
    builder.addProgress('Creating .open-tasks/commands/ directory...');
    await fse.ensureDir(commandsDir);
    
    builder.addProgress('Creating configuration file...');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    builder.addProgress('Initialization complete!');
    
    // Verbose-only details
    if (context.verbosity === 'verbose') {
      addProcessingDetails(builder, {
        'Project Directory': context.cwd,
        'Files Created': results.length,
      });
      
      builder.addSection('📋 Created Files', results.join('\n'));
    }
    
    return ref;
    // Summary added automatically by CommandHandler
  }
}
```

**Output by Verbosity Level:**

**Quiet Mode:**
```
✓ init completed in 250ms
```

**Summary Mode (default):**
```
✓ init completed in 250ms
📁 Saved to: .open-tasks/config.json
🔗 Reference: @init
```

**Verbose Mode:**
```

⚙️  Processing Details
────────────────────────────────────────
{
  "Project Directory": "/home/user/myproject",
  "Open Tasks Directory": "/home/user/myproject/.open-tasks",
  "Files Created": 3,
  "Force Mode": false
}

📋 Created Files
────────────────────────────────────────
Created .open-tasks/commands/
Created .open-tasks/outputs/
Created .open-tasks/config.json

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: init
⏱️  Duration: 250ms
📁 Output File: .open-tasks/config.json
🔗 Reference Token: @init
```

---

## Summary: Two Levels of Control

### Core Application Control

1. **CommandHandler framework**: Automatic timing, builder creation, output routing
2. **Verbosity resolution**: CLI flags → command defaults → global defaults
3. **Output routing**: Screen, file, both, custom paths
4. **Error handling**: Standardized error formatting and logging

### Command Implementation Control

1. **Progress reporting**: Calls to `builder.addProgress()`
2. **Verbose sections**: Calls to `builder.addSection()`
3. **Conditional output**: Check `context.verbosity` for custom behavior
4. **Progressive output**: Manual `console.log()` for real-time updates

---

## Design Benefits

### Separation of Concerns
- **Commands**: Focus on business logic, use builder API
- **Builders**: Handle formatting, decide what to show
- **Framework**: Handle timing, routing, error handling

### Extensibility
- Add new verbosity levels by creating new builders
- Add new output targets without changing commands
- Commands opt-in to verbose/progress features

### Backward Compatibility
- Old commands (direct `console.log()`) still work
- New commands gain output control automatically
- Gradual migration path

### Testability
- Mock builders to test command logic
- Test builders independently with sample data
- Verify output formatting without running commands

---

## Best Practices

### For Command Authors

1. **Always use the builder API** instead of direct `console.log()`
2. **Add progress messages** for long operations (verbose users appreciate it)
3. **Add verbose sections** for debugging information
4. **Use helper utilities** for common formatting patterns
5. **Check `context.verbosity`** only when you need custom behavior

### For Framework Maintainers

1. **Keep builders simple**: Each one should have a clear purpose
2. **Document behavior**: Explain what each verbosity level shows
3. **Test all levels**: Ensure commands work in quiet, summary, and verbose
4. **Provide utilities**: Helper functions make command code cleaner
5. **Maintain consistency**: All builders should handle the same methods

---

## See Also

- [Output Control API Reference](./Output-Control-API.md)
- [Verbosity Levels Guide](./Verbosity-Levels.md)
- [Output Targets Guide](./Output-Targets.md)
- [Migration Guide](./Migration-Guide.md)
