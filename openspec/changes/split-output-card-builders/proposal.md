# Change Proposal: Split IOutputBuilder into IOutputBuilder and ICardBuilder

**Change ID:** `split-output-card-builders`  
**Status:** Draft  
**Created:** 2025-10-19  
**Author:** AI Assistant

## Summary

Split the current `IOutputBuilder` interface into two distinct responsibilities:

1. **IOutputBuilder** - Managed by the core application framework, handles system-level output (timing, status, file paths, errors)
2. **ICardBuilder** - Passed to individual `ICommand` implementations, allows commands to create custom formatted content ("cards") in the output feed

This separation provides clearer responsibilities: the framework controls the execution envelope while commands control their content presentation.

## Motivation

### Current Issues

1. **Mixed Responsibilities**: `IOutputBuilder` currently handles both:
   - Framework concerns (timing, file paths, success/failure status)
   - Command-specific content (sections, progress, custom formatting)

2. **Unclear Ownership**: Commands call `builder.addSection()` but the builder decides whether to show it, creating confusion about who owns what output

3. **Limited Command Control**: Commands can't create rich, structured content beyond simple sections and progress messages

### Benefits of Split

1. **Clear Separation of Concerns**:
   - Framework: "This task took 150ms and saved to file.txt"
   - Command: "Here's what I found: [custom formatted data]"

2. **Better Mental Model**:
   - `IOutputBuilder` = Execution envelope (always present)
   - `ICardBuilder` = Content canvas (command-controlled)

3. **Richer Command Output**:
   - Commands can create structured "cards" (tables, lists, trees, etc.)
   - Commands own their presentation without fighting framework assumptions

4. **Workflow System Integration**:
   - `ICommand` in workflow system can use `ICardBuilder` for consistent output
   - Both CLI commands (`CommandHandler`) and workflow commands (`ICommand`) use same card API

## Goals

1. **Refactor IOutputBuilder**: Keep only framework-level concerns (summary, errors, routing)
2. **Create ICardBuilder**: New interface for command content creation
3. **Update CommandHandler**: Provide both builders to commands
4. **Update ICommand**: Accept `ICardBuilder` in execute signature
5. **Maintain Backward Compatibility**: Existing commands continue to work
6. **Consistent API**: Both CLI and workflow commands use same card system

## Non-Goals

- Changing verbosity levels (quiet, summary, verbose remain the same)
- Changing output routing (screen/file destinations unchanged)
- Removing existing helper utilities
- Changing command execution lifecycle

## Proposed Changes

### 1. IOutputBuilder (Framework-Managed)

**Responsibilities:**
- Execution summary (command name, duration, success/failure)
- Output file path display
- Reference token display
- Error reporting with stack traces
- Final output routing (screen/file)

**API:**
```typescript
interface IOutputBuilder {
  // Summary data (called by framework)
  addSummary(data: SummaryData): void;
  
  // Error reporting (called by framework)
  addError(error: Error, context?: Record<string, any>): void;
  
  // Build final framework output
  build(): string;
}
```

**Removed Methods:**
- `addSection()` - moved to ICardBuilder
- `addProgress()` - moved to ICardBuilder

### 2. ICardBuilder (Command-Controlled)

**Responsibilities:**
- Command-specific formatted content
- Progress indicators
- Structured data display (tables, lists, trees)
- Custom sections and cards

**API:**
```typescript
interface ICardBuilder {
  // Add a custom card to the output
  addCard(title: string, content: CardContent): void;
  
  // Add progress message
  addProgress(message: string): void;
  
  // Build cards into formatted string
  build(): string;
}

type CardContent = 
  | string                           // Plain text
  | Record<string, any>              // Key-value pairs
  | CardContent[]                    // Nested content
  | TableCard                        // Structured table
  | ListCard                         // Bulleted/numbered list
  | TreeCard;                        // Hierarchical tree

interface TableCard {
  type: 'table';
  headers: string[];
  rows: string[][];
}

interface ListCard {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

interface TreeCard {
  type: 'tree';
  root: TreeNode;
}

interface TreeNode {
  label: string;
  children?: TreeNode[];
}
```

### 3. Updated CommandHandler

```typescript
abstract class CommandHandler {
  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    cardBuilder: ICardBuilder  // NEW: Passed to commands
  ): Promise<ReferenceHandle>;
  
  private async executeWithOutputControl(...) {
    const outputBuilder = this.createOutputBuilder(context);
    const cardBuilder = this.createCardBuilder(context);
    
    const result = await this.executeCommand(args, refs, context, cardBuilder);
    
    // Framework adds summary
    outputBuilder.addSummary({...});
    
    // Combine: cards first, then summary
    const finalOutput = cardBuilder.build() + '\n' + outputBuilder.build();
    console.log(finalOutput);
  }
}
```

### 4. Updated ICommand (Workflow)

```typescript
interface ICommand {
  execute(
    context: IWorkflowContext, 
    args: any[],
    cardBuilder?: ICardBuilder  // NEW: Optional for backward compatibility
  ): Promise<MemoryRef[]>;
}
```

### 5. Card Builder Implementations

Similar to output builders, create implementations per verbosity:

- **QuietCardBuilder** - Ignores all cards (silent)
- **SummaryCardBuilder** - Shows limited cards (maybe just first card or none)
- **VerboseCardBuilder** - Shows all cards with full formatting

## Migration Path

### Phase 1: Create New Interfaces (Non-Breaking)
1. Add `ICardBuilder` interface
2. Implement card builder classes
3. Add `cardBuilder` parameter to `CommandHandler.executeCommand()` (optional)
4. Add `cardBuilder` parameter to `ICommand.execute()` (optional)

### Phase 2: Update Commands (Gradual)
1. Commands can start using `cardBuilder` instead of old `builder.addSection()`
2. Both APIs work during transition
3. Deprecation warnings on old methods

### Phase 3: Clean Up (Breaking)
1. Remove `addSection()` and `addProgress()` from `IOutputBuilder`
2. Make `cardBuilder` required parameter
3. Remove deprecated helper utilities

## Examples

### Before (Current)

```typescript
protected async executeCommand(args, refs, context) {
  const builder = this.createOutputBuilder(context);
  
  builder.addProgress('Processing...');
  builder.addSection('Results', data);
  
  return ref;
  // Framework adds summary via builder.addSummary()
}
```

### After (Proposed)

```typescript
protected async executeCommand(args, refs, context, cardBuilder) {
  cardBuilder.addProgress('Processing...');
  
  cardBuilder.addCard('Results', {
    type: 'table',
    headers: ['ID', 'Name', 'Status'],
    rows: data.map(d => [d.id, d.name, d.status])
  });
  
  return ref;
  // Framework adds summary via separate outputBuilder
}
```

## Open Questions

1. **Card Rendering**: Should cards support markdown, ANSI colors, or plain text only?
2. **Card Ordering**: Should framework control where cards appear relative to summary?
3. **Streaming**: How do streaming/progressive cards work?
4. **Workflow Context**: Should `IWorkflowContext` also provide card builder?

## Success Criteria

- [ ] `ICardBuilder` interface defined with card types
- [ ] Card builder implementations for each verbosity level
- [ ] `CommandHandler` provides both builders to commands
- [ ] `ICommand` accepts optional card builder
- [ ] At least one command migrated to demonstrate new API
- [ ] Existing commands continue to work (backward compatibility)
- [ ] Documentation updated with new architecture
- [ ] Tests cover both builders independently

## Dependencies

- None (pure addition initially)

## Breaking Changes

- Phase 3 only (removal of deprecated methods)
- Mitigated by long deprecation period

## Timeline

- **Phase 1**: 2-3 days (interfaces and implementations)
- **Phase 2**: 1-2 weeks (gradual command migration)
- **Phase 3**: 1 day (cleanup, post-migration)

## References

- Current `IOutputBuilder` documentation: `docs/Output-Control-API.md`
- Current architecture: `docs/IOutputBuilder-Architecture.md`
- Workflow types: `src/workflow/types.ts`
