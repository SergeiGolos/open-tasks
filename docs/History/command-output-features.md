# Command Output Features Implementation Plan

## Overview

This document outlines the implementation plan for adding enhanced output control features to the Open-Tasks CLI command system. The goal is to allow commands to provide summary views, control output verbosity, and stream output to both the main log and terminal.

## Current Architecture Analysis

Based on the existing codebase, the current command architecture includes:

- **ExecutionContext**: Provides context for command execution with output handling
- **CommandHandler**: Abstract base class for all commands
- **OutputHandler**: Manages file writing and error reporting
- **ReferenceManager**: Tracks command outputs as reference handles
- **Formatters**: Provide colored terminal output formatting
- **WorkflowContexts**: Handle data persistence (in-memory and file-based)

## Proposed Features

### 1. Summary View Mode

**Default Summary Format:**
- Command name
- Execution time
- Output filename/location
- Reference token for later access

**Example:**
```
✓ extract completed in 245ms
📁 Saved to: .open-tasks/outputs/extract-2024-01-15-14-30-25.json
🔗 Reference: @extracted-content
```

### 2. Output Verbosity Control

**Verbosity Levels:**
- `--quiet`: Only show essential summary
- `--summary`: Show default summary (current behavior)
- `--verbose`: Show detailed output with progress
- `--stream`: Stream output in real-time + save to file

**Verbosity Control Hierarchy:**

1. **Application-Level Default**: Set globally via config or CLI flags
2. **Command-Level Override**: Per-command verbosity via `run(iCommand, --verbosity)` parameter
3. **Fallback**: Default to `summary` mode if no verbosity is specified

**Implementation Pattern:**

```typescript
// Application-level setting (from config or CLI)
const globalVerbosity: VerbosityLevel = 'summary';

// ExecutionContext includes default verbosity
interface ExecutionContext {
  // ... existing properties
  defaultVerbosity: VerbosityLevel;
}

// Command execution with override support
interface ICommand {
  execute(context: ExecutionContext, args: string[], verbosity?: VerbosityLevel): Promise<ReferenceHandle[]>;
}

// Usage examples:
await context.run(command, args);                    // Uses global default
await context.run(command, args, '--verbose');      // Override for this command
await context.run(command, args, '--quiet');        // Override for this command
```

**Verbosity Resolution Logic:**

```typescript
function resolveVerbosity(
  globalVerbosity: VerbosityLevel,
  commandOverride?: VerbosityLevel
): VerbosityLevel {
  return commandOverride || globalVerbosity || 'summary';
}
```

### 3. Output Redirection Options

**Output Targets:**
- `--log-only`: Send output only to log files
- `--screen-only`: Display output only on screen
- `--both`: Output to both screen and log (default)
- `--file <path>`: Custom output file location

## Implementation Requirements

### 1. Extend ExecutionContext Interface

```typescript
interface ExecutionContext {
  // ... existing properties

  // New output control properties
  outputMode: 'quiet' | 'summary' | 'verbose' | 'stream';
  outputTarget: 'log-only' | 'screen-only' | 'both' | 'file';
  customOutputPath?: string;

  // New output control methods
  shouldOutputToScreen(): boolean;
  shouldOutputToFile(): boolean;
  getOutputVerbosity(): string;
}
```

### 2. Create OutputBuilder Interface

```typescript
interface IOutputBuilder {
  addSection(title: string, content: any): IOutputBuilder;
  addSummary(data: SummaryData): IOutputBuilder;
  addProgress(message: string): IOutputBuilder;
  addError(error: Error): IOutputBuilder;
  build(): string;
}

interface SummaryData {
  commandName: string;
  executionTime: number;
  outputFile?: string;
  referenceToken?: string;
  success: boolean;
  metadata?: Record<string, any>;
}
```

### 3. Extend CommandHandler Base Class

```typescript
abstract class CommandHandler {
  // ... existing properties

  // New methods for output control
  protected createOutputBuilder(context: ExecutionContext): IOutputBuilder;
  protected formatSummary(result: ReferenceHandle, context: ExecutionContext, startTime: number): string;
  protected canStreamOutput(context: ExecutionContext): boolean;

  // Modified execute method with timing and output control
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const startTime = Date.now();

    try {
      // Execute command logic
      const result = await this.executeCommand(args, refs, context);

      // Handle output based on context settings
      await this.handleOutput(result, context, startTime);

      return result;
    } catch (error) {
      await this.handleError(error, context, startTime);
      throw error;
    }
  }

  // Abstract method for actual command logic
  protected abstract executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;

  // Output handling methods
  protected async handleOutput(
    result: ReferenceHandle,
    context: ExecutionContext,
    startTime: number
  ): Promise<void>;

  protected async handleError(
    error: Error,
    context: ExecutionContext,
    startTime: number
  ): Promise<void>;
}
```

### 4. Implement OutputBuilder Classes

```typescript
class QuietOutputBuilder implements IOutputBuilder {
  private sections: Array<{title: string, content: any}> = [];

  addSection(title: string, content: any): IOutputBuilder {
    // Only add essential sections for quiet mode
    if (title === 'summary') {
      this.sections.push({title, content});
    }
    return this;
  }

  addSummary(data: SummaryData): IOutputBuilder {
    this.sections.push({
      title: 'summary',
      content: `${data.success ? '✓' : '✗'} ${data.commandName} ${data.success ? 'completed' : 'failed'} in ${data.executionTime}ms`
    });
    return this;
  }

  // ... other methods
  build(): string {
    return this.sections.map(s => s.content).join('\n');
  }
}

class VerboseOutputBuilder implements IOutputBuilder {
  // Implementation with detailed sections, timestamps, etc.
}

class StreamingOutputBuilder implements IOutputBuilder {
  // Implementation that can output sections as they're added
}
```

### 5. Extend OutputHandler Class

```typescript
class OutputHandler {
  // ... existing methods

  // New methods for output control
  async handleCommandOutput(
    builder: IOutputBuilder,
    context: ExecutionContext
  ): Promise<void>;

  async streamOutput(
    content: string,
    context: ExecutionContext
  ): Promise<void>;

  formatExecutionTime(startTime: number): string;
  createDefaultSummary(
    commandName: string,
    result: ReferenceHandle,
    startTime: number
  ): SummaryData;
}
```

### 6. Command Line Argument Parsing

**New global options to add to CLI:**
```bash
# Verbosity control
--quiet, -q          # Minimal output
--summary, -s        # Default summary (current behavior)
--verbose, -v        # Detailed output
--stream             # Real-time output streaming

# Output targets
--log-only           # Output only to log files
--screen-only        # Output only to terminal
--file <path>        # Custom output file
--no-file            # Don't create output files
```

### 7. Integration Points

**Modify `src/index.ts`:**
- Add new CLI argument parsing
- Update ExecutionContext creation with new options
- Integrate output mode handling

**Modify `src/router.ts`:**
- Pass output configuration to command execution
- Handle global output options before command routing

**Update existing commands:**
- Migrate from direct console.log to OutputBuilder pattern
- Add progress reporting for long-running commands
- Implement streaming where applicable

## Implementation Steps

### Phase 1: Core Infrastructure
1. **Extend ExecutionContext interface** with output control properties
2. **Create IOutputBuilder interface** and basic implementations
3. **Update OutputHandler class** with new output methods
4. **Modify CommandHandler base class** to support output builders

### Phase 2: CLI Integration
1. **Update argument parsing** in main entry point
2. **Integrate output options** into ExecutionContext creation
3. **Update router** to handle global output options
4. **Add output mode validation**

### Phase 3: Command Migration
1. **Update built-in commands** to use new output system
2. **Add streaming support** to appropriate commands
3. **Implement progress reporting** for long operations
4. **Update formatters** for new output modes

### Phase 4: Advanced Features
1. **Custom output templates** for different use cases
2. **Output filtering** and searching capabilities
3. **Integration with logging system**
4. **Performance monitoring** and optimization

## Backward Compatibility

The implementation will maintain full backward compatibility:
- Existing commands continue to work without modification
- Default behavior remains the same (summary mode)
- All existing APIs and interfaces remain functional
- Gradual migration path for existing commands

## Examples

### Basic Usage (Current Behavior Preserved)
```bash
open-tasks extract --ref input.txt
# ✓ extract completed in 245ms
# 📁 Saved to: .open-tasks/outputs/extract-2024-01-15-14-30-25.json
# 🔗 Reference: @extracted-content
```

### Quiet Mode
```bash
open-tasks extract --ref input.txt --quiet
# ✓ extract completed in 245ms
```

### Verbose Mode
```bash
open-tasks extract --ref input.txt --verbose
# Starting extraction from input.txt...
# Processing content...
# Found 15 matches
# Extracting patterns...
# ✓ extract completed in 245ms
# 📁 Saved to: .open-tasks/outputs/extract-2024-01-15-14-30-25.json
# 🔗 Reference: @extracted-content
# 📊 Processed: 1,247 characters
# 🎯 Matches: 15
# ⏱️  Average time per match: 16.3ms
```

### Streaming Mode
```bash
open-tasks process-large-file --ref data.json --stream
# Processing chunk 1/100...
# Processing chunk 2/100...
# ...
# Processing chunk 100/100...
# ✓ process-large-file completed in 1,234ms
# 📁 Saved to: .open-tasks/outputs/process-large-file-2024-01-15-14-35-42.json
# 🔗 Reference: @processed-data
```

## Benefits

1. **Improved User Experience**: Users can control output verbosity based on their needs
2. **Better Integration**: Easier to integrate with other tools and CI/CD pipelines
3. **Enhanced Debugging**: Verbose mode provides detailed information for troubleshooting
4. **Real-time Feedback**: Streaming mode provides immediate feedback for long operations
5. **Flexible Output**: Support for custom output formats and destinations
6. **Backward Compatible**: Existing workflows continue to work unchanged

## Conclusion

This implementation provides a comprehensive solution for output control while maintaining the simplicity and elegance of the existing command system. The phased approach ensures gradual rollout and minimal disruption to existing users.