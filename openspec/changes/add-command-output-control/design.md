# Design Document: Add Command Output Control

**Change ID:** `add-command-output-control`  
**Created:** 2025-10-18

## Architecture Overview

This change enhances the command execution system with structured output control through three main components:

1. **Output Builders**: Abstraction for constructing formatted output
2. **Extended ExecutionContext**: Configuration for output control
3. **Enhanced CommandHandler**: Timing and output management

## Design Principles

1. **Backward Compatibility**: Existing commands continue to work without modification
2. **Gradual Adoption**: Commands can opt-in to new features incrementally
3. **Separation of Concerns**: Output formatting separate from command logic
4. **Consistent Interface**: All output modes follow same builder pattern

## Component Design

### 1. Output Builder System

**Interface Hierarchy:**
```
IOutputBuilder (interface)
├── QuietOutputBuilder (minimal output)
├── SummaryOutputBuilder (default, current behavior)
├── VerboseOutputBuilder (detailed output)
└── StreamingOutputBuilder (real-time output)
```

**Key Decisions:**
- Builder pattern allows incremental construction of output
- Each verbosity level has dedicated implementation
- Streaming builder outputs sections immediately vs buffering
- Builders are stateful but single-use (one per command execution)

**Trade-offs:**
- **Pro**: Clean separation, easy to test, extensible
- **Con**: Slight overhead vs direct console.log (negligible)

### 2. Verbosity Resolution

**Hierarchy:**
```
Command-Level Override
    ↓ (if not specified)
Global Application Default
    ↓ (if not specified)
Hardcoded Default ('summary')
```

**Implementation:**
```typescript
function resolveVerbosity(
  globalDefault: VerbosityLevel,
  commandOverride?: VerbosityLevel
): VerbosityLevel {
  return commandOverride || globalDefault || 'summary';
}
```

**Key Decisions:**
- Command-level takes precedence for per-command control
- Global default set via CLI flags or config file
- Falls back to 'summary' to maintain current behavior

### 3. Output Destination Routing

**Destination Options:**
- `screen-only`: Terminal output only (console)
- `log-only`: File output only (no terminal)
- `both`: Terminal + file (default)
- `file <path>`: Custom file location + terminal

**Implementation Strategy:**
- ExecutionContext tracks `outputTarget` property
- OutputHandler checks target before writing
- Commands call builder methods regardless (builder handles routing)

**Key Decisions:**
- Separate concerns: builder constructs, handler routes
- File writing always uses same mechanism (OutputHandler)
- Screen output uses console.log (simple, works everywhere)

### 4. ExecutionContext Extension

**New Properties:**
```typescript
interface ExecutionContext {
  // Existing properties preserved...
  
  // New output control
  verbosity: VerbosityLevel;      // 'quiet' | 'summary' | 'verbose' | 'stream'
  outputTarget: OutputTarget;      // 'screen-only' | 'log-only' | 'both' | 'file'
  customOutputPath?: string;       // For 'file' target
}
```

**Key Decisions:**
- Add properties, don't replace existing ones
- Use enums/unions for type safety
- Optional customOutputPath (only used with 'file' target)

**Migration Path:**
- Old commands work without accessing new properties
- New commands can read verbosity/outputTarget
- No runtime errors for accessing undefined (TypeScript catches)

### 5. CommandHandler Enhancement

**Execution Flow:**
```
1. execute() called
2. Record start time
3. Create OutputBuilder (based on verbosity)
4. Call executeCommand() (abstract, implemented by subclass)
5. Build summary
6. Route output (screen/file based on target)
7. Return ReferenceHandle
```

**Key Changes:**
```typescript
abstract class CommandHandler {
  // New: wrapper that handles timing & output
  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
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
  
  // New: subclasses implement this instead of execute()
  protected abstract executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

**Key Decisions:**
- Rename current `execute()` to `executeCommand()` in subclasses
- Base `execute()` handles cross-cutting concerns (timing, output)
- Subclasses remain focused on command logic
- Backward compat: existing commands continue to work (will need migration)

**Migration Strategy:**
- Phase 1: Add new methods alongside existing
- Phase 2: Deprecate old pattern in docs
- Phase 3: Migrate built-in commands as examples
- Phase 4: Update docs and guides for new pattern

### 6. Summary Format Standard

**Default Summary Structure:**
```
✓ <command-name> completed in <time>ms
📁 Saved to: <output-path>
🔗 Reference: @<token>
```

**Data Structure:**
```typescript
interface SummaryData {
  commandName: string;
  executionTime: number;
  outputFile?: string;
  referenceToken?: string;
  success: boolean;
  metadata?: Record<string, any>;  // Command-specific data
}
```

**Customization:**
- Commands can add metadata for verbose mode
- Quiet mode shows only first line
- Stream mode shows summary at end
- All modes use same SummaryData structure

## Implementation Phases

### Phase 1: Core Infrastructure
- IOutputBuilder interface + implementations
- ExecutionContext extensions
- OutputHandler enhancements

### Phase 2: CommandHandler Integration
- Base class modifications
- Timing and summary generation
- Output routing logic

### Phase 3: CLI Argument Parsing
- Add global flags (--quiet, --verbose, etc.)
- Parse output target flags
- Integrate into ExecutionContext creation

### Phase 4: Command Migration
- Migrate 2-3 built-in commands as examples
- Update command templates
- Document migration guide

## Testing Strategy

### Unit Tests
- Each OutputBuilder implementation
- Verbosity resolution logic
- Summary data formatting
- Output routing decisions

### Integration Tests
- End-to-end command execution with each verbosity level
- Output destination verification (screen vs file)
- Timing accuracy
- Error handling with output control

### Backward Compatibility Tests
- Existing commands work unchanged
- Default behavior matches current
- No breaking changes in ExecutionContext

## Performance Considerations

- **Output Building Overhead**: <1ms per command (negligible)
- **File I/O**: Same as current (OutputHandler unchanged)
- **Memory**: Builders hold content temporarily (released after output)
- **Streaming**: No buffering, immediate output (constant memory)

## Security Considerations

- **File Path Validation**: Custom output paths must be sanitized
- **Directory Traversal**: Prevent ../../../ attacks
- **Permissions**: Respect filesystem permissions on custom paths
- **Content Escaping**: Escape special characters in output

## Alternatives Evaluated

### Alternative: Logging Library Integration
**Pros**: Battle-tested, rich features
**Cons**: Overkill, dependency bloat, steeper learning curve
**Decision**: Rejected - CLI needs simpler solution

### Alternative: Template-based Output
**Pros**: Highly customizable, user-defined formats
**Cons**: Complex, hard to maintain, over-engineered
**Decision**: Deferred - may add later if needed

### Alternative: Event-based Progress
**Pros**: Decoupled, flexible
**Cons**: More complex, harder to reason about
**Decision**: Rejected - builder pattern sufficient

## Open Technical Questions

1. **Buffer Size for Streaming**: Should there be limits?
   - **Recommendation**: No hard limit, but allow commands to chunk output

2. **Output Builder Reuse**: Should builders be pooled/reused?
   - **Recommendation**: No - simple allocation, GC handles cleanup

3. **Custom Formatters**: How to support JSON/XML output?
   - **Recommendation**: Phase 2 - add FormatterAdapter interface

4. **Progress Callbacks**: How do long commands report progress?
   - **Recommendation**: Builder provides `addProgress()` method

## Rollout Plan

1. **Week 1**: Implement core infrastructure (Builders, ExecutionContext)
2. **Week 2**: Enhance CommandHandler and OutputHandler
3. **Week 3**: Add CLI argument parsing and integration
4. **Week 4**: Migrate 2-3 built-in commands, write documentation
5. **Week 5**: Testing, bug fixes, polish

## Success Metrics

- All 49 existing tests continue to pass
- New tests achieve >90% coverage of new code
- 3+ built-in commands successfully migrated
- Documentation complete with examples for each verbosity level
- Zero breaking changes to existing command API
