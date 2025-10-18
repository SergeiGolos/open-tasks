# Output Control API Reference

This document provides comprehensive API documentation for the output control system in open-tasks-cli.

## Table of Contents

- [Overview](#overview)
- [IOutputBuilder Interface](#ioutputbuilder-interface)
- [Output Builder Implementations](#output-builder-implementations)
- [Factory Function](#factory-function)
- [Helper Utilities](#helper-utilities)
- [Examples](#examples)

## Overview

The output control system provides a flexible way to control command output verbosity and routing. Commands can produce different levels of output detail, and users can control where that output goes (screen, log files, or both).

### Key Components

- **IOutputBuilder**: Core interface for building formatted output
- **Output Builders**: Four implementations for different verbosity levels
- **Helper Utilities**: Functions to simplify common output patterns
- **CommandHandler**: Base class with built-in output control support

## IOutputBuilder Interface

The `IOutputBuilder` interface defines the contract for building formatted command output.

```typescript
interface IOutputBuilder {
  /**
   * Add a section to the output (for verbose/stream modes)
   * Sections group related information under a title
   */
  addSection?(title: string, content: string): void;

  /**
   * Add summary data for command execution
   * Displayed at the end of command execution
   */
  addSummary(data: SummaryData): void;

  /**
   * Add a progress message (for stream mode)
   * Shown in real-time during command execution
   */
  addProgress?(message: string): void;

  /**
   * Add error information to output
   * Includes error message, stack trace, and context
   */
  addError?(error: Error, context?: Record<string, any>): void;

  /**
   * Build final output string
   * Returns formatted output based on verbosity level
   */
  build(): string;
}
```

### SummaryData Type

```typescript
interface SummaryData {
  commandName: string;      // Name of the command executed
  executionTime: number;    // Time taken in milliseconds
  outputFile?: string;      // Path to output file (if any)
  referenceToken?: string;  // Reference token for command chaining
  success: boolean;         // Whether command succeeded
  metadata?: Record<string, any>; // Additional command-specific data
}
```

### Method Details

#### addSection(title, content)

Adds a titled section to the output. Sections are only displayed in **verbose** mode.

**Parameters:**
- `title: string` - Section heading
- `content: string` - Section body content

**When to use:**
- Displaying detailed configuration
- Showing step-by-step processing details
- Presenting metadata or debugging information

**Example:**
```typescript
builder.addSection('Configuration', `
  Input: ${inputFile}
  Output: ${outputFile}
  Format: ${format}
`);
```

#### addSummary(data)

Adds execution summary data. This is **required** and displayed in all verbosity modes (except when it fails to be added).

**Parameters:**
- `data: SummaryData` - Summary information object

**When to use:**
- At the end of command execution
- To report final status and results

**Example:**
```typescript
builder.addSummary({
  commandName: 'store',
  executionTime: 150,
  success: true,
  outputFile: '/path/to/output.txt',
  referenceToken: 'mydata',
  metadata: {
    size: 1024,
    format: 'json'
  }
});
```

#### addProgress(message)

Adds a real-time progress message. Only displayed in **stream** mode.

**Parameters:**
- `message: string` - Progress update text

**When to use:**
- Long-running operations with multiple steps
- File processing with progress tracking
- Network operations with status updates

**Example:**
```typescript
builder.addProgress('Reading input file...');
builder.addProgress('Processing data...');
builder.addProgress('Writing output...');
```

#### addError(error, context)

Adds error information to the output. Displayed in all modes, with varying detail levels.

**Parameters:**
- `error: Error` - The error object
- `context?: Record<string, any>` - Additional context information

**When to use:**
- Command execution fails
- Validation errors occur
- Need to report warnings

**Example:**
```typescript
try {
  await riskyOperation();
} catch (error) {
  builder.addError(error as Error, {
    input: inputValue,
    attemptedOperation: 'parse'
  });
  throw error; // Re-throw to fail command
}
```

#### build()

Builds and returns the final formatted output string.

**Returns:** `string` - Formatted output based on verbosity level

**When to use:**
- Called automatically by CommandHandler framework
- Manually when implementing custom output logic

**Note:** For StreamingOutputBuilder, this returns an empty string because all output was already written to console.

## Output Builder Implementations

### QuietOutputBuilder

**Verbosity Level:** `quiet`

**CLI Flag:** `--quiet` or `-q`

**Output:** Single-line status message

**Use Case:** Scripts, automation, minimal output needed

**Example Output:**
```
✓ store completed in 150ms
```

**Characteristics:**
- Ignores sections
- Ignores progress messages
- Shows only final status
- No detailed metadata

### SummaryOutputBuilder

**Verbosity Level:** `summary` (default)

**CLI Flag:** `--summary` or `-s` (or no flag)

**Output:** Brief formatted summary

**Use Case:** Normal interactive command-line usage

**Example Output:**
```
✓ store completed in 150ms
📁 Saved to: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference: @mydata
```

**Characteristics:**
- Ignores sections
- Ignores progress messages
- Shows output file and reference token
- Clean, readable format

### VerboseOutputBuilder

**Verbosity Level:** `verbose`

**CLI Flag:** `--verbose` or `-v`

**Output:** Detailed sections + summary

**Use Case:** Debugging, detailed diagnostics, understanding command behavior

**Example Output:**
```

Configuration
─────────────
Input: data.json
Output: .open-tasks/outputs/20241018-130145-store
Format: json

Processing Details
──────────────────
Value Size: 1024 bytes
Token: mydata
Reference ID: 550e8400-e29b-41d4-a716-446655440000

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: store
⏱️  Duration: 150ms
📁 Output File: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference Token: @mydata
```

**Characteristics:**
- Shows all sections
- Ignores progress messages
- Detailed execution summary
- Metadata display

### StreamingOutputBuilder

**Verbosity Level:** `stream`

**CLI Flag:** `--stream`

**Output:** Real-time progress + final summary

**Use Case:** Long-running operations, monitoring progress, interactive feedback

**Example Output:**
```
[0ms] ⏳ Reading input file...
[25ms] ⏳ Processing data...
[100ms] ⏳ Writing output...
[120ms] ⏳ Creating reference...

[150ms] 📊 Summary
────────────────────────────────────────────────────────────────────────────────
✓ store completed in 150ms
📁 Saved to: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference: @mydata
```

**Characteristics:**
- Shows real-time progress with timestamps
- Immediately outputs to console (not buffered)
- Final summary at the end
- `build()` returns empty string (already output)

## Factory Function

### createOutputBuilder(level)

Creates the appropriate output builder instance based on verbosity level.

**Signature:**
```typescript
function createOutputBuilder(level?: VerbosityLevel): IOutputBuilder
```

**Parameters:**
- `level?: VerbosityLevel` - One of: `'quiet'`, `'summary'`, `'verbose'`, `'stream'`
- Defaults to `'summary'` if not specified

**Returns:** `IOutputBuilder` - Instance of the appropriate builder class

**Example:**
```typescript
import { createOutputBuilder } from './output-builders.js';

const builder = createOutputBuilder('verbose');
builder.addSection('Details', 'Some information');
builder.addSummary({ commandName: 'test', executionTime: 100, success: true });
console.log(builder.build());
```

## Helper Utilities

Helper utilities in `output-utils.ts` simplify common output patterns.

### addFormattedSection

Adds a formatted section to the builder with consistent styling.

```typescript
function addFormattedSection(
  builder: IOutputBuilder,
  title: string,
  content: string
): void
```

**Example:**
```typescript
import { addFormattedSection } from './output-utils.js';

addFormattedSection(builder, 'File Information', `
  Path: ${filePath}
  Size: ${fileSize}
  Modified: ${modifiedDate}
`);
```

### addFileInfoSection

Adds file information section with size and timestamps.

```typescript
function addFileInfoSection(
  builder: IOutputBuilder,
  filePath: string
): Promise<void>
```

**Example:**
```typescript
import { addFileInfoSection } from './output-utils.js';

await addFileInfoSection(builder, '/path/to/file.txt');
// Outputs:
// File Information
// ────────────────
// Path: /path/to/file.txt
// Size: 1.5 KB
// Modified: 2024-10-18 13:01:45
```

### addProcessingDetails

Adds a processing details section with key-value pairs.

```typescript
function addProcessingDetails(
  builder: IOutputBuilder,
  details: Record<string, string>
): void
```

**Example:**
```typescript
import { addProcessingDetails } from './output-utils.js';

addProcessingDetails(builder, {
  'Input Length': '1024 bytes',
  'Output Length': '2048 bytes',
  'Compression Ratio': '50%',
  'Processing Time': '150ms'
});
```

### formatFileSize

Formats byte size into human-readable string.

```typescript
function formatFileSize(bytes: number): string
```

**Example:**
```typescript
import { formatFileSize } from './output-utils.js';

console.log(formatFileSize(1024));        // "1.0 KB"
console.log(formatFileSize(1536));        // "1.5 KB"
console.log(formatFileSize(1048576));     // "1.0 MB"
console.log(formatFileSize(1073741824));  // "1.0 GB"
```

### createSuccessSummary / createErrorSummary

Helper functions to create consistent summary data objects.

```typescript
function createSuccessSummary(
  commandName: string,
  executionTime: number,
  outputFile?: string,
  referenceToken?: string,
  metadata?: Record<string, any>
): SummaryData

function createErrorSummary(
  commandName: string,
  executionTime: number,
  metadata?: Record<string, any>
): SummaryData
```

**Example:**
```typescript
import { createSuccessSummary } from './output-utils.js';

const summary = createSuccessSummary(
  'store',
  150,
  '/path/to/output.txt',
  'mytoken',
  { size: 1024 }
);
builder.addSummary(summary);
```

## Examples

### Basic Command with Output Control

```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle, IOutputBuilder } from '../types.js';

export default class MyCommand extends CommandHandler {
  name = 'mycommand';
  description = 'Example command with output control';

  async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    builder: IOutputBuilder
  ): Promise<ReferenceHandle> {
    // Progress message (visible in stream mode)
    builder.addProgress?.('Starting processing...');

    // Do work
    const result = await processData(args[0]);

    // Verbose details (visible in verbose mode)
    if (context.verbosity === 'verbose') {
      builder.addSection('Processing Details', `
        Input: ${args[0]}
        Output: ${result.length} bytes
        Format: text
      `);
    }

    // Progress update
    builder.addProgress?.('Storing result...');

    // Store result
    const memoryRef = await context.workflowContext.store(result, []);
    const referenceHandle = context.referenceManager.createReference(
      memoryRef.id,
      result
    );

    // Summary (shown in all modes)
    builder.addSummary?.({
      commandName: this.name,
      executionTime: Date.now() - startTime,
      success: true,
      metadata: { resultSize: result.length }
    });

    return referenceHandle;
  }
}
```

### Using Helper Utilities

```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle, IOutputBuilder } from '../types.js';
import { addFileInfoSection, addProcessingDetails, formatFileSize } from '../output-utils.js';

export default class ProcessFileCommand extends CommandHandler {
  name = 'process-file';
  description = 'Process a file with detailed output';

  async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    builder: IOutputBuilder
  ): Promise<ReferenceHandle> {
    const filePath = args[0];

    builder.addProgress?.('Reading file...');

    // Show file info in verbose mode
    if (context.verbosity === 'verbose') {
      await addFileInfoSection(builder, filePath);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    
    builder.addProgress?.('Processing content...');
    
    const processed = processContent(content);

    // Show processing details in verbose mode
    if (context.verbosity === 'verbose') {
      addProcessingDetails(builder, {
        'Original Size': formatFileSize(content.length),
        'Processed Size': formatFileSize(processed.length),
        'Lines Processed': String(processed.split('\n').length)
      });
    }

    builder.addProgress?.('Storing result...');

    const memoryRef = await context.workflowContext.store(processed, []);
    const referenceHandle = context.referenceManager.createReference(
      memoryRef.id,
      processed
    );

    return referenceHandle;
  }
}
```

### Error Handling with Output Control

```typescript
async executeCommand(
  args: string[],
  refs: Map<string, ReferenceHandle>,
  context: ExecutionContext,
  builder: IOutputBuilder
): Promise<ReferenceHandle> {
  try {
    builder.addProgress?.('Validating input...');

    if (!args[0]) {
      throw new Error('Input file path is required');
    }

    builder.addProgress?.('Processing file...');

    const result = await processFile(args[0]);

    // Success case...
    return result;

  } catch (error) {
    // Error details are automatically added by framework
    // But you can add custom context if needed
    builder.addError?.(error as Error, {
      command: this.name,
      input: args[0],
      attemptedOperation: 'file processing'
    });

    throw error; // Re-throw to fail command
  }
}
```

## Best Practices

1. **Always add progress messages** for operations that take more than a second
2. **Use verbose mode** for debugging information that's not needed in normal usage
3. **Keep summary concise** - it's shown to everyone by default
4. **Add sections liberally** in verbose mode - they're free and help debugging
5. **Include metadata** in summaries for programmatic consumption
6. **Use helper utilities** for consistent formatting across commands
7. **Test all verbosity levels** to ensure good experience at each level

## See Also

- [Verbosity Levels Guide](./Verbosity-Levels.md)
- [Output Targets Guide](./Output-Targets.md)
- [Migration Guide](./Migration-Guide.md)
- [Getting Started](./Getting-Started.md)
