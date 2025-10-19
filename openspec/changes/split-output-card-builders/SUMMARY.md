# Split IOutputBuilder: Change Proposal Summary

## Overview

I've created a comprehensive OpenSpec change proposal to split `IOutputBuilder` into two distinct interfaces:

1. **IOutputBuilder** - Framework-managed, handles system-level execution reporting
2. **ICardBuilder** - Command-controlled, allows commands to create rich formatted content

## Documents Created

### 📋 [proposal.md](x:\open-tasks\openspec\changes\split-output-card-builders\proposal.md)
- High-level motivation and goals
- API changes overview
- Migration path (3 phases)
- Success criteria and open questions

### 🏗️ [design.md](x:\open-tasks\openspec\changes\split-output-card-builders\design.md)
- Detailed architecture with ASCII diagrams
- Complete interface definitions
- Card rendering implementation
- Integration with CommandHandler and ICommand
- Key design decisions with rationale
- Testing strategy and performance considerations

### ✅ [tasks.md](x:\open-tasks\openspec\changes\split-output-card-builders\tasks.md)
- 48 detailed implementation tasks across 8 phases
- Dependencies and validation criteria
- Milestone summary
- Estimated 7-10 day timeline

## Key Concepts

### Clear Separation of Concerns

**IOutputBuilder (Framework)**:
```typescript
interface IOutputBuilder {
  addSummary(data: SummaryData): void;   // Execution metadata
  addError(error: Error, context?: Record<string, any>): void;
  build(): string;
}
```

**ICardBuilder (Commands)**:
```typescript
interface ICardBuilder {
  addProgress(message: string): void;
  addCard(title: string, content: CardContent): void;
  build(): string;
}

type CardContent = 
  | string                    // Plain text
  | Record<string, any>       // Key-value pairs
  | TableCard                 // Structured table
  | ListCard                  // Bulleted/numbered list
  | TreeCard;                 // Hierarchical tree
```

### Rich Card Types

Commands can create structured output:

**Tables**:
```typescript
cardBuilder.addCard('Results', {
  type: 'table',
  headers: ['ID', 'Name', 'Status'],
  rows: [
    ['1', 'Task A', 'Done'],
    ['2', 'Task B', 'Pending']
  ]
});
```

**Lists**:
```typescript
cardBuilder.addCard('Files Created', {
  type: 'list',
  items: [
    'config.json',
    'package.json',
    '.open-tasks/'
  ]
});
```

**Trees**:
```typescript
cardBuilder.addCard('Project Structure', {
  type: 'tree',
  root: {
    label: 'src/',
    children: [
      { label: 'commands/' },
      { label: 'workflow/', children: [...] }
    ]
  }
});
```

## Integration Pattern

### Before (Current)
```typescript
protected async executeCommand(args, refs, context) {
  const builder = this.createOutputBuilder(context);
  builder.addProgress('Processing...');
  builder.addSection('Results', data);
  return ref;
}
```

### After (Proposed)
```typescript
protected async executeCommand(args, refs, context, cardBuilder) {
  cardBuilder.addProgress('Processing...');
  cardBuilder.addCard('Results', {
    type: 'table',
    headers: ['Column 1', 'Column 2'],
    rows: data
  });
  return ref;
  // Framework adds summary separately via outputBuilder
}
```

## Output Flow

```
Command Execution
       │
       ├─> cardBuilder.addProgress('Step 1...')
       ├─> cardBuilder.addCard('Results', tableData)
       ├─> cardBuilder.addCard('Summary', keyValues)
       │
       ▼
Framework adds execution summary
       │
       └─> outputBuilder.addSummary({
             commandName, executionTime, file, token
           })

Final Output = [Cards] + [Framework Summary]

Example:
─────────────────────────────────────────
Results
────────────────────────────────────────
ID | Name   | Status
───┼────────┼────────
1  | Task A | Done
2  | Task B | Pending

Summary
────────────────────────────────────────
{
  "totalTasks": 2,
  "completed": 1
}

📊 Execution Summary
────────────────────────────────────────
✓ Command: analyze
⏱️  Duration: 150ms
📁 Output File: results.json
🔗 Reference Token: @results
```

## Migration Strategy

### Phase 1: Add ICardBuilder (Non-Breaking)
- Create new interface and implementations
- Add optional `cardBuilder` parameter
- Both APIs work simultaneously

### Phase 2: Migrate Commands (Gradual)
- Update built-in commands to use cards
- Add deprecation warnings on old methods
- Provide migration guide

### Phase 3: Clean Up (Breaking)
- Remove `addSection()` and `addProgress()` from IOutputBuilder
- Make `cardBuilder` required parameter
- Remove deprecated utilities

## Benefits

1. **Clearer Responsibilities**: Framework owns execution, commands own content
2. **Better Mental Model**: "Cards" as command output, "Summary" as framework output
3. **Richer UX**: Tables, lists, trees instead of plain text sections
4. **Workflow Integration**: Both CLI and workflow commands use same card API
5. **Backward Compatible**: Gradual migration, no immediate breaking changes

## Next Steps

1. **Review Proposal**: Get feedback on design decisions
2. **Validate with OpenSpec**: Run `openspec validate split-output-card-builders --strict`
3. **Start Implementation**: Begin with Phase 1 tasks
4. **Iterate**: Adjust based on real-world usage

## Questions for Discussion

1. **Card Rendering**: Should we support ANSI colors and styles immediately or Phase 2?
2. **Summary Card Policy**: Should `SummaryCardBuilder` show first card or no cards?
3. **Streaming Cards**: How should progressive/streaming card updates work?
4. **Card Persistence**: Should cards be saved separately from execution summary?

---

This proposal provides a clean separation between framework concerns (timing, status, files) and command concerns (content presentation), while adding rich formatting capabilities for better command UX.
