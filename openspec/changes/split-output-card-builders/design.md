# Design Document: Split IOutputBuilder into IOutputBuilder and ICardBuilder

**Change ID:** `split-output-card-builders`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Command Execution                            │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  CommandHandler / ICommand                                  │     │
│  │                                                              │     │
│  │  Uses ICardBuilder                  Managed by Framework    │     │
│  │  ├─ addProgress()                   ├─ IOutputBuilder       │     │
│  │  ├─ addCard(table)                  │  ├─ addSummary()      │     │
│  │  ├─ addCard(list)                   │  ├─ addError()        │     │
│  │  └─ addCard(tree)                   │  └─ build()           │     │
│  │                                      │                       │     │
│  │  Command controls                   Framework controls      │     │
│  │  WHAT is displayed                  WHEN & WHERE displayed  │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  Final Output = [Cards] + [Framework Summary]                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. IOutputBuilder (Framework Layer)

**Purpose**: System-level execution reporting

**Responsibilities**:
- Execution metadata (timing, success/failure)
- File I/O results (where output was saved)
- Reference tokens (for command chaining)
- Error reporting (stack traces, context)
- Output routing (screen, file, both)

**Interface**:
```typescript
interface IOutputBuilder {
  addSummary(data: SummaryData): void;
  addError(error: Error, context?: Record<string, any>): void;
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

**Implementation Variants**:
- `QuietOutputBuilder` - Single line: "✓ cmd completed in 150ms"
- `SummaryOutputBuilder` - Multi-line with file/token
- `VerboseOutputBuilder` - Detailed with metadata

**Key Decision**: Keep minimal - only what the framework knows about execution

---

### 2. ICardBuilder (Command Layer)

**Purpose**: Command-specific content creation

**Responsibilities**:
- Custom formatted content ("cards")
- Progress reporting during execution
- Structured data presentation
- Command-specific UI elements

**Interface**:
```typescript
interface ICardBuilder {
  addProgress(message: string): void;
  addCard(title: string, content: CardContent): void;
  build(): string;
}

type CardContent = 
  | string                    // Plain text card
  | Record<string, any>       // Key-value card
  | TableCard                 // Structured table
  | ListCard                  // Bulleted/numbered list
  | TreeCard;                 // Hierarchical tree

interface TableCard {
  type: 'table';
  headers: string[];
  rows: string[][];
  footer?: string;
}

interface ListCard {
  type: 'list';
  items: string[];
  ordered?: boolean;
  nested?: ListCard[];
}

interface TreeCard {
  type: 'tree';
  root: TreeNode;
}

interface TreeNode {
  label: string;
  icon?: string;
  children?: TreeNode[];
}
```

**Implementation Variants**:
- `QuietCardBuilder` - Ignores all cards
- `SummaryCardBuilder` - Limited cards (TBD policy)
- `VerboseCardBuilder` - All cards, fully formatted

**Key Decision**: Rich card types for better command UX

---

### 3. Card Rendering

**Text Rendering**:
```typescript
class VerboseCardBuilder implements ICardBuilder {
  private cards: Array<{ title: string; content: CardContent }> = [];
  
  addCard(title: string, content: CardContent): void {
    this.cards.push({ title, content });
  }
  
  build(): string {
    return this.cards.map(card => {
      const rendered = this.renderCard(card.content);
      return `\n${card.title}\n${'─'.repeat(80)}\n${rendered}`;
    }).join('\n');
  }
  
  private renderCard(content: CardContent): string {
    if (typeof content === 'string') {
      return content;
    }
    
    if ('type' in content) {
      switch (content.type) {
        case 'table':
          return this.renderTable(content);
        case 'list':
          return this.renderList(content);
        case 'tree':
          return this.renderTree(content);
      }
    }
    
    // Default: JSON format for objects
    return JSON.stringify(content, null, 2);
  }
  
  private renderTable(table: TableCard): string {
    const lines: string[] = [];
    
    // Headers
    lines.push(table.headers.join(' | '));
    lines.push(table.headers.map(h => '─'.repeat(h.length)).join('─┼─'));
    
    // Rows
    for (const row of table.rows) {
      lines.push(row.join(' | '));
    }
    
    // Footer
    if (table.footer) {
      lines.push('');
      lines.push(table.footer);
    }
    
    return lines.join('\n');
  }
  
  private renderList(list: ListCard): string {
    return list.items.map((item, idx) => {
      const prefix = list.ordered ? `${idx + 1}.` : '•';
      return `${prefix} ${item}`;
    }).join('\n');
  }
  
  private renderTree(tree: TreeCard): string {
    const lines: string[] = [];
    
    function traverse(node: TreeNode, prefix: string = '', isLast: boolean = true) {
      const connector = isLast ? '└── ' : '├── ';
      const icon = node.icon ? `${node.icon} ` : '';
      lines.push(`${prefix}${connector}${icon}${node.label}`);
      
      if (node.children) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        node.children.forEach((child, idx) => {
          traverse(child, childPrefix, idx === node.children!.length - 1);
        });
      }
    }
    
    traverse(tree.root);
    return lines.join('\n');
  }
}
```

---

### 4. Integration with CommandHandler

**Before**:
```typescript
abstract class CommandHandler {
  private async executeWithOutputControl(args, refs, context) {
    const builder = this.createOutputBuilder(context);
    const result = await this.executeCommand(args, refs, context);
    
    builder.addSummary({...});
    const output = builder.build();
    console.log(output);
  }
  
  protected abstract executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

**After**:
```typescript
abstract class CommandHandler {
  private async executeWithOutputControl(args, refs, context) {
    const outputBuilder = this.createOutputBuilder(context);
    const cardBuilder = this.createCardBuilder(context);
    
    const result = await this.executeCommand(args, refs, context, cardBuilder);
    
    // Add framework summary
    outputBuilder.addSummary({...});
    
    // Combine: cards first, then summary
    const cards = cardBuilder.build();
    const summary = outputBuilder.build();
    
    const finalOutput = cards ? `${cards}\n\n${summary}` : summary;
    console.log(finalOutput);
  }
  
  protected abstract executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    cardBuilder: ICardBuilder  // NEW
  ): Promise<ReferenceHandle>;
  
  protected createCardBuilder(context: ExecutionContext): ICardBuilder {
    const verbosity = context.verbosity || this.defaultVerbosity || 'summary';
    return createCardBuilder(verbosity);
  }
}
```

---

### 5. Integration with ICommand (Workflow)

**Before**:
```typescript
interface ICommand {
  execute(context: IWorkflowContext, args: any[]): Promise<MemoryRef[]>;
}

class TokenReplaceCommand implements ICommand {
  async execute(context: IWorkflowContext, args: any[]): Promise<MemoryRef[]> {
    // Command logic
    const ref = await context.store(result);
    return [ref];
  }
}
```

**After**:
```typescript
interface ICommand {
  execute(
    context: IWorkflowContext, 
    args: any[],
    cardBuilder?: ICardBuilder  // Optional for backward compatibility
  ): Promise<MemoryRef[]>;
}

class TokenReplaceCommand implements ICommand {
  async execute(
    context: IWorkflowContext, 
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<MemoryRef[]> {
    // Command can optionally use card builder
    if (cardBuilder) {
      cardBuilder.addProgress('Replacing tokens...');
    }
    
    // Command logic
    const ref = await context.store(result);
    
    if (cardBuilder) {
      cardBuilder.addCard('Replaced Tokens', {
        type: 'list',
        items: usedTokens.map(t => `{{${t}}}`),
      });
    }
    
    return [ref];
  }
}
```

**Workflow Context Enhancement**:
```typescript
interface IWorkflowContext {
  store(value: any, decorators?: IMemoryDecorator[]): Promise<MemoryRef>;
  token(name: string): any;
  run(command: ICommand, cardBuilder?: ICardBuilder): Promise<MemoryRef[]>;
}
```

---

### 6. Output Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Framework starts execution                            │
│    ├─ Create outputBuilder (for summary)                │
│    └─ Create cardBuilder (for command content)          │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Command executes                                      │
│    ├─ cardBuilder.addProgress('Step 1...')              │
│    ├─ cardBuilder.addCard('Results', tableData)         │
│    └─ cardBuilder.addCard('Summary', keyValuePairs)     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Framework adds execution summary                      │
│    └─ outputBuilder.addSummary({                        │
│         commandName, executionTime, file, token          │
│       })                                                 │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Build final output                                    │
│    ├─ cards = cardBuilder.build()                       │
│    ├─ summary = outputBuilder.build()                   │
│    └─ output = cards + '\n\n' + summary                 │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Route to destination                                  │
│    ├─ console.log(output) if screen                     │
│    └─ writeFile(output) if file                         │
└─────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### Decision 1: Cards Before Summary
**Choice**: Display command cards first, framework summary last

**Rationale**: 
- Summary acts as footer/conclusion
- Cards are the "main content"
- User scans cards, then sees execution status at bottom

**Alternative Considered**: Summary first, cards after
- Rejected: Buries command content below metadata

---

### Decision 2: Optional Card Builder for ICommand
**Choice**: Make `cardBuilder` optional parameter in `ICommand.execute()`

**Rationale**:
- Backward compatibility with existing workflow commands
- Commands can gradually adopt cards
- Simple commands don't need cards

**Alternative Considered**: Required parameter
- Rejected: Breaking change for all workflow commands

---

### Decision 3: Rich Card Types
**Choice**: Support table, list, tree card types (not just plain text)

**Rationale**:
- Better UX for structured data
- Commands can present data appropriately
- Consistent formatting across commands

**Alternative Considered**: Plain text only
- Rejected: Too limited, commands resort to manual formatting

---

### Decision 4: Verbosity Applies to Both Builders
**Choice**: Same verbosity level controls both output and card builders

**Rationale**:
- Simple mental model: one verbosity flag
- Consistent behavior across framework and commands
- Easy to understand what `--verbose` does

**Alternative Considered**: Separate verbosity for cards vs summary
- Rejected: Too complex, confusing UX

---

## Migration Strategy

### Phase 1: Add ICardBuilder (Non-Breaking)

1. Create `ICardBuilder` interface in `types.ts`
2. Create card builder implementations in `card-builders.ts`
3. Add `cardBuilder` parameter to `CommandHandler.executeCommand()` (optional)
4. Add `cardBuilder` parameter to `ICommand.execute()` (optional)
5. Update `CommandHandler.executeWithOutputControl()` to create both builders

**Result**: New API available, old API still works

---

### Phase 2: Migrate Commands (Gradual)

1. Update documentation with new pattern
2. Migrate built-in commands one by one
3. Add deprecation warnings to `builder.addSection()` and `builder.addProgress()`
4. Provide migration guide for custom commands

**Result**: Most commands use new API, old API deprecated

---

### Phase 3: Remove Old API (Breaking)

1. Remove `addSection()` from `IOutputBuilder`
2. Remove `addProgress()` from `IOutputBuilder`
3. Make `cardBuilder` required in both interfaces
4. Remove deprecated helper utilities (or update them)

**Result**: Clean separation, no legacy baggage

---

## Testing Strategy

### Unit Tests

1. **Card Rendering**:
   - Test each card type renders correctly
   - Test nested structures
   - Test edge cases (empty tables, single item lists)

2. **Builder Implementations**:
   - Test quiet builder ignores cards
   - Test summary builder shows limited cards
   - Test verbose builder shows all cards

3. **Integration**:
   - Test card + summary combination
   - Test verbosity affects both builders
   - Test output routing with cards

### Integration Tests

1. **CommandHandler**:
   - Test command receives card builder
   - Test final output includes both cards and summary
   - Test different verbosity levels

2. **ICommand (Workflow)**:
   - Test workflow commands with optional card builder
   - Test backward compatibility (commands without cardBuilder)

---

## Performance Considerations

**Card Rendering**: 
- Lazy rendering (only build() when needed)
- No performance impact for quiet mode (builder ignores cards)
- Table rendering: O(rows × cols)

**Memory**:
- Cards buffered in memory until build()
- Large datasets should use pagination or streaming
- Consider card count limits for very verbose commands

---

## Future Enhancements

1. **Card Themes**: Color schemes, borders, styles
2. **Interactive Cards**: CLI interactions (select from list, etc.)
3. **Card Persistence**: Save cards separately from summary
4. **Card Streaming**: Real-time card updates (for long operations)
5. **Markdown Cards**: Rich formatting with markdown support

---

## Open Questions

1. **Q: Should summary builder show total card count?**
   - A: Yes, in verbose mode: "3 result cards generated"

2. **Q: Can cards be added after command returns?**
   - A: No, command must add all cards during execute()

3. **Q: Should card builder support ANSI colors?**
   - A: Phase 2 enhancement, start with plain text

4. **Q: What's the policy for SummaryCardBuilder?**
   - A: Show no cards (same as current behavior), or show first card only
   - Decision: Start with no cards, can enhance later

---

## Success Metrics

- [ ] All card types render correctly in verbose mode
- [ ] Quiet mode shows no cards (maintains current behavior)
- [ ] At least 3 commands migrated to use cards
- [ ] Workflow commands can use cards
- [ ] Documentation shows clear examples
- [ ] Tests cover all card types and verbosity combinations
