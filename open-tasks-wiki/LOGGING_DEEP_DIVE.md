# Deep Dive: Logging Architecture in Open Tasks

## Executive Summary

Open Tasks implements a **multi-layered logging architecture** where logging and output presentation vary significantly across different command types. This document explores three distinct command versions (workflow-level commands, task-level commands, and the task handler base class), analyzes how each implements logging, and proposes a unified logging strategy.

**Key Finding:** The current architecture uses verbosity-driven output through cards rather than traditional file-based logging, creating inconsistent patterns across command types.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Command Types & Logging Versions](#command-types--logging-versions)
3. [Card System Deep Dive](#card-system-deep-dive)
4. [Logging in Core Commands](#logging-in-core-commands)
5. [Logging in Task-Level Commands](#logging-in-task-level-commands)
6. [Logging Flow: End-to-End](#logging-flow-end-to-end)
7. [Current Inconsistencies](#current-inconsistencies)
8. [Path to Unified Logging](#path-to-unified-logging)
9. [Recommendations](#recommendations)

---

## Architecture Overview

### Three-Tier Logging Architecture

```
┌─────────────────────────────────────────────────┐
│  CLI Entry Point (index.ts)                     │
│  - Processes verbosity flags                    │
│  - Creates ExecutionContext                     │
│  - Routes to CommandRouter                      │
└──────────────┬──────────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
  ICommand         ITaskHandler
  (Workflow)       (CLI Tasks)
    │                 │
    └────┬────────┬───┘
         │        │
         ▼        ▼
    ICardBuilder  TaskHandler
                  (Base Class)
                      │
                      ▼
                  IOutputSynk
                  (Console Output)
```

### VerbosityLevel: The Command Control Interface

```typescript
export type VerbosityLevel = 'quiet' | 'summary' | 'verbose';
```

**Specification (Target State):**

| Level | What Gets Displayed |
|-------|---------------------|
| **quiet** | • Command name<br>• Execution time<br>• List of files created by the command |
| **summary** | Everything from **quiet** +<br>• Cards rendered by commands (MessageCard, TableCard, etc.) |
| **verbose** | Everything from **summary** +<br>• Between-card log messages (progress updates)<br>• Variations: error / warning / info messages |

**Current State:** Implementations vary widely and don't follow this specification consistently.

---

## Command Types & Logging Versions

### Version 1: Workflow-Level Commands (ICommand)

**Location:** `src/commands/`

**Signature:**
```typescript
interface ICommand {
  execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]>;
}
```

**Characteristics:**
- ✅ Minimal logging responsibility
- ✅ Focus on transformation/workflow composition
- ❌ No visibility into execution steps
- ❌ No structured error tracking
- ❌ No progress indication

**Examples:** `SetCommand`, `ReadCommand`, `WriteCommand`, `JsonTransformCommand`

**Logging Pattern:**
```typescript
// SetCommand - No logging at all
export class SetCommand implements ICommand {
  async execute(context: IFlow, args: any[], cardBuilder?: ICardBuilder): Promise<[any, IRefDecorator[]][]> {
    const decorators: IRefDecorator[] = this.token 
      ? [new TokenDecorator(this.token)] 
      : [];
    return [[this.value, decorators]];
  }
}
```

**Analysis:**
- These commands are "silent operators" - they return results without any output
- Logging is entirely implicit in the reference system
- The `cardBuilder` parameter is passed but never used
- Error handling is exception-based only

---

### Version 2: Task-Level Commands (ITaskHandler)

**Location:** `src/tasks/`

**Signature:**
```typescript
interface ITaskHandler {
  name: string;
  description: string;
  examples: string[];
  
  execute(
    args: string[],
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

**Characteristics:**
- ✅ Explicit output through `ExecutionContext.outputSynk`
- ✅ Verbosity-aware operations
- ✅ Card-based visual logging
- ❌ Inconsistent logging patterns between commands
- ❌ No central audit trail

**Examples:** `InitCommand`, `CleanCommand`, `CreateCommand`, `PromoteCommand`

**Logging Pattern - Init Command:**
```typescript
export default class InitCommand implements ITaskHandler {
  async execute(args: string[], context: ExecutionContext): Promise<ReferenceHandle> {
    const verbosity = context.verbosity || 'summary';
    
    // Three-level output pattern:
    // 1. Console.log directly (immediate feedback)
    if (verbosity !== 'quiet') {
      console.log(new MessageCard('🎉 Project Initialized', details, 'success').build());
    }
    
    // 2. Return ReferenceHandle (structured result)
    const message = [...];
    const ref: ReferenceHandle = {
      id: 'init-result',
      content: message,
      token: 'init',
      timestamp: new Date(),
    };
    return ref;
  }
}
```

**Analysis:**
- Each task independently decides HOW to log
- Some use `outputSynk.write()`, others use `console.log()`
- Results are both displayed AND returned as `ReferenceHandle`
- Verbosity is checked locally, not delegated to a centralized system

---

### Version 3: TaskHandler Base Class

**Location:** `src/task-handler.ts`

**Signature:**
```typescript
abstract class TaskHandler implements ITaskHandler {
  abstract executeCommand(
    config: Record<string, any>,
    args: string[],    
    flow: IFlow,
    synk: IOutputSynk    
  ): Promise<ReferenceHandle>;
}
```

**Characteristics:**
- ✅ Provides a template for consistent logging
- ✅ Separates concerns: `execute()` handles wrapping, `executeCommand()` implements logic
- ⚠️ Only used by `CreateCommand` currently
- ❌ Not adopted by other task implementations

**Logging Pattern - Create Command:**
```typescript
export default class CreateCommand extends TaskHandler {
  protected override async executeCommand(
    config: Record<string, any>,
    args: string[],
    workflowContext: IFlow,
    outputBuilder: IOutputSynk
  ): Promise<ReferenceHandle> {
    // Uses outputBuilder for structured output
    outputBuilder.write('Validating command name...');
    outputBuilder.write('Checking project initialization...');
    outputBuilder.write(new MessageCard('🎨 Command Created', details, 'success'));
    
    return ref;
  }
}
```

**Analysis:**
- This is the **most consistent pattern** but underutilized
- Delegates output handling to `IOutputSynk`
- Progress is shown through sequential `.write()` calls
- Still mixes direct console logging with card output

---

## Card System Deep Dive

### Card Architecture

Cards are the visual layer abstraction in Open Tasks. They transform structured data into formatted terminal output.

```
Data Structure → ICardBuilder → console.log()
```

### Card Types and Logging Use Cases

#### 1. MessageCard
**File:** `src/cards/MessageCard.ts`

**Use Case:** Simple status messages

```typescript
// From InitCommand
new MessageCard('🎉 Project Initialized', details, 'success').build()

// From CreateCommand  
new MessageCard('🎨 Command Created', details, 'success')
```

**Output Verbosity Control:** ❌ None - verbosity is checked before card creation

**Styling Options:**
- `info` (blue border)
- `success` (green border)
- `warning` (yellow border)
- `error` (red border)
- `dim` (gray border)
- `default`

**Logging Issue:** Cards don't carry verbosity metadata - the command must decide before creating them.

#### 2. TableCard
**File:** `src/cards/TableCard.ts`

**Use Case:** Structured data display (likely for logs, audit trails)

```typescript
new TableCard(
  'Clean Operation Summary',
  ['Directory', 'Size Freed', 'Status'],
  [
    ['logs/20250101-120000', '2.5 MB', 'Deleted'],
    ['logs/20250102-150000', '1.8 MB', 'Deleted'],
  ]
)
```

**Logging Issue:** Not currently used in any task command for detailed logging

#### 3. ListCard
**File:** `src/cards/ListCard.ts`

**Use Case:** Step-by-step operations, file lists

```typescript
// Hypothetical
new ListCard('Initialization Steps', [
  '✓ .open-tasks/',
  '✓ .open-tasks/logs/',
  '✓ .open-tasks/schemas/',
  '✓ .open-tasks/.config.json',
])
```

**Logging Issue:** Used for final results, not for step-by-step logging

#### 4. TreeCard
**File:** `src/cards/TreeCard.ts`

**Use Case:** Hierarchical data (project structure, dependencies)

```typescript
new TreeCard('Project Structure', {
  label: '.open-tasks',
  children: [
    { label: 'logs', icon: '📁' },
    { label: 'schemas', icon: '📁' },
    { label: '.config.json', icon: '⚙️' },
  ]
})
```

**Logging Issue:** Not currently used for logging operations

#### 5. KeyValueCard
**File:** `src/cards/KeyValueCard.ts`

**Use Case:** Configuration, metadata display

```typescript
new KeyValueCard('Operation Summary', {
  'Directories Deleted': deletedCount,
  'Space Freed': this.formatSize(deletedSize),
  'Cutoff Date': cutoffDate.toISOString(),
})
```

**Logging Issue:** Could be better utilized for structured logs

### ICardBuilder Interface

```typescript
export interface ICardBuilder {
  name: string;
  verbosity?: VerbosityLevel;
  type: string;
  
  build(): string;
}
```

**Critical Issue:** The `verbosity` property is optional and rarely set. This means cards don't self-declare their appropriate verbosity level.

---

## Logging in Core Commands

### Current Pattern: Silent Execution

Core workflow commands deliberately don't log. Let's trace how this works:

```typescript
// SetCommand
export class SetCommand implements ICommand {
  async execute(context: IFlow, args: any[], cardBuilder?: ICardBuilder): Promise<[any, IRefDecorator[]][]> {
    const decorators: IRefDecorator[] = this.token 
      ? [new TokenDecorator(this.token)] 
      : [];
    return [[this.value, decorators]];  // ← No logging, just return value
  }
}

// ReadCommand
export class ReadCommand implements ICommand {
  async execute(context: IFlow, args: any[], cardBuilder?: ICardBuilder): Promise<[any, IRefDecorator[]][]> {
    const absolutePath = path.isAbsolute(this.fileName)
      ? this.fileName
      : path.join(context.cwd, this.fileName);

    try {
      await fs.access(absolutePath);
    } catch (error) {
      throw new Error(`File not found: ${this.fileName}`);  // ← Only error logging
    }

    const content = await fs.readFile(absolutePath, 'utf-8');
    return [[content, []]];  // ← Silent success
  }
}

// WriteCommand
export class WriteCommand implements ICommand {
  async execute(context: IFlow, args: any[], cardBuilder?: ICardBuilder): Promise<[any, IRefDecorator[]][]> {
    const content = await context.get(this.contentRef);
    
    if (content === undefined) {
      throw new Error(`Content reference not found: ${this.contentRef.token || this.contentRef.id}`);
    }

    const absolutePath = path.isAbsolute(this.fileName)
      ? this.fileName
      : path.join(context.cwd, this.fileName);

    await fse.ensureDir(path.dirname(absolutePath));
    await fs.writeFile(absolutePath, content, 'utf-8');

    return [[absolutePath, []]];  // ← Silent success, returns file path
  }
}
```

### Why This Works (Sort Of)

1. **Composition Pattern:** Commands are meant to be chained
2. **Referencing System:** The `IFlow` context tracks all operations via references
3. **Result Tracing:** Tasks can extract what happened from the returned references
4. **Error Visibility:** Exceptions propagate up for explicit handling

### The Logging Gap

```typescript
// This workflow has no intermediate logging:
const data = await flow.run(new ReadCommand('data.txt'));           // Silent
const parsed = await flow.run(new JsonTransformCommand(data[0]));   // Silent
await flow.run(new WriteCommand('output.txt', parsed[0]));          // Silent

// The only visibility is the final ReferenceHandle
```

---

## Logging in Task-Level Commands

### Current Pattern: Inconsistent Output

Task-level commands have direct access to `outputSynk` but use it inconsistently:

#### CleanCommand - Mixed Approach

```typescript
export default class CleanCommand implements ITaskHandler {
  async execute(args: string[], context: ExecutionContext): Promise<ReferenceHandle> {
    const verbosity = context.verbosity || 'summary';
    
    // 1. Direct console output (not verbosity-checked!)
    context.outputSynk.write('Checking logs directory...');
    
    // 2. Conditional direct logging
    if (verbosity === 'verbose') {
      context.outputSynk.write(`Warning: Could not process ${dir.name}: ${error}`);
    }
    
    // 3. Conditional card output (checked before creation!)
    if (verbosity !== 'quiet') {
      // Build details for card...
      // But the card itself doesn't know its verbosity level
    }
    
    // 4. Return structured result
    const ref: ReferenceHandle = { id, content, token, timestamp };
    return ref;
  }
}
```

**Issues:**
- ❌ `context.outputSynk.write('Checking logs directory...')` always executes
- ❌ Verbosity checks happen before card creation instead of inside `ConsoleOutputBuilder`
- ❌ No structured logging format (strings + cards mixed)
- ❌ No log file generation

#### InitCommand - Console.log Approach

```typescript
export default class InitCommand implements ITaskHandler {
  async execute(args: string[], context: ExecutionContext): Promise<ReferenceHandle> {
    const verbosity = context.verbosity || 'summary';
    
    // Verbosity check before card creation
    if (verbosity !== 'quiet') {
      console.log(new MessageCard('🎉 Project Initialized', details, 'success').build());
    }
    
    // Return structured result
    const message = [...];
    const ref: ReferenceHandle = { id, content, message, token, timestamp };
    return ref;
  }
}
```

**Issues:**
- ❌ Bypasses `outputSynk` entirely
- ❌ Uses `console.log` directly
- ❌ Verbosity decisions scattered throughout code

#### CreateCommand - Best Practice (TaskHandler-based)

```typescript
export default class CreateCommand extends TaskHandler {
  protected override async executeCommand(
    config: Record<string, any>,
    args: string[],
    workflowContext: IFlow,
    outputBuilder: IOutputSynk
  ): Promise<ReferenceHandle> {
    // Uses outputBuilder for all output
    outputBuilder.write('Validating command name...');
    outputBuilder.write('Checking project initialization...');
    outputBuilder.write('Generating command template...');
    outputBuilder.write(new MessageCard('🎨 Command Created', details, 'success'));
    
    return ref;
  }
}
```

**Advantages:**
- ✅ Consistent use of `outputBuilder`
- ✅ Progress visibility through sequential writes
- ✅ Structured output through cards
- ⚠️ Still doesn't generate log files

---

## Logging Flow: End-to-End

### From CLI Invocation to Output

```
User runs: ot clean --verbose
│
├─→ index.ts
│   ├─ Parse CLI options (--verbose)
│   ├─ Create ExecutionContext with verbosity: 'verbose'
│   └─ Execute CleanCommand
│
├─→ CleanCommand.execute()
│   ├─ context.outputSynk.write('Checking logs directory...')
│   │  └─→ ConsoleOutputBuilder.write()
│   │      └─→ shouldWrite('verbose') → true
│   │          └─→ console.log(card) or console.log(string)
│   │
│   ├─ if (verbosity === 'verbose') { ... }
│   │  └─→ Additional verbose output
│   │
│   └─ return ReferenceHandle
│
└─→ ResultPresenter.display()
    └─ if (verbosity === 'quiet') { console.log(ref) }
```

### ConsoleOutputBuilder Logic

```typescript
export class ConsoleOutputBuilder implements IOutputSynk {
  write(card: ICardBuilder | string, verbosity: VerbosityLevel): void {
    if (typeof card === 'string') {
      // If it's a string, only write if verbosity is 'verbose'
      if (this.shouldWrite(verbosity || 'verbose')) { 
        console.log(card);
      }
      return;      
    }

    // For cards, check whether to display
    if (this.shouldWrite(verbosity)) {
      this.cards.push(card);
      if (typeof card.build === 'function') {
        console.log(card.build());
      } else {
        console.log(JSON.stringify(card, null, 2));
      }
    }
  }

  private shouldWrite(verbosity: VerbosityLevel): boolean {
    // quiet: Only show cards marked as 'quiet'
    // summary: Show cards marked as 'summary' or 'quiet'
    // verbose: Show all cards
    
    if (this.verbosity === 'verbose') {
      return true;
    }
    if (this.verbosity === 'summary') {
      return verbosity === 'summary' || verbosity === 'quiet';
    }
    if (this.verbosity === 'quiet') {
      return verbosity === 'quiet';
    }
    return false;
  }
}
```

**Problem:** The `verbosity` parameter passed to `.write()` is the **card's verbosity**, not the **CLI verbosity**. This is confusing.

---

## Current Inconsistencies

### Inconsistency #1: Output Path Varies

| Command Type | Output Method | Destination |
|---|---|---|
| `SetCommand` | None | (nothing) |
| `ReadCommand` | Exceptions only | stdout (errors) |
| `InitCommand` | `console.log` + Return | stdout + `ReferenceHandle` |
| `CleanCommand` | `outputSynk.write` + Return | stdout + `ReferenceHandle` |
| `CreateCommand` | `outputBuilder.write` + Return | stdout + `ReferenceHandle` |
| All Commands | Exceptions | stderr/stdout |

### Inconsistency #2: Verbosity Handling

```typescript
// Pattern A: Check before card creation (InitCommand)
if (verbosity !== 'quiet') {
  console.log(new MessageCard(...).build());
}

// Pattern B: Delegate to outputSynk (CreateCommand)
outputBuilder.write(new MessageCard(...));

// Pattern C: Direct console.log (mixed in CleanCommand)
context.outputSynk.write('Direct string output');

// Pattern D: No output at all (SetCommand)
// ... silent execution
```

### Inconsistency #3: Log File Generation

**Current Status:** ❌ No task generates structured log files

- ✅ Logs directory is created by `init`
- ❌ No command writes to logs
- ❌ No structured audit trail
- ❌ No error tracking file

### Inconsistency #4: Card Usage

| Card Type | Used By | Pattern |
|---|---|---|
| `MessageCard` | `InitCommand`, `CleanCommand`, `CreateCommand` | Final status |
| `TableCard` | (None) | Unused potential |
| `ListCard` | (None) | Unused potential |
| `TreeCard` | (None) | Unused potential |
| `KeyValueCard` | (None) | Unused potential |

### Inconsistency #5: Verbosity Metadata on Cards

```typescript
// Cards have verbosity property but it's never set:
export class MessageCard implements ICardBuilder {
  name: string;
  verbosity?: VerbosityLevel;  // ← Always undefined
  
  // ... no one sets this
}

// Result: ConsoleOutputBuilder can't make verbosity decisions
// based on card metadata
```

---

## Path to Unified Logging

### Step 1: Establish Logging Principles

**Principle 1: Verbosity Hierarchy (Strict Enforcement)**
- **quiet:** Command name + execution time + files created only
- **summary:** quiet output + all cards rendered by commands
- **verbose:** summary output + between-card log messages (progress, warnings, errors, info)
- ALL commands must follow this specification

**Principle 2: Single Responsibility Logging**
- Each command type has one clear logging responsibility
- Workflow commands: silent (composition focus)
- Task commands: progress + result (user-facing)
- Base class: log aggregation (consistency)

**Principle 3: Message Categorization**
- Every log message classified as: **error** / **warning** / **info** / **progress**
- Cards are always "summary" level
- Between-card messages are always "verbose" level
- File creation tracking is always "quiet" level

**Principle 4: Structured Output Format**
- All output goes through a unified presentation layer
- Consistent styling and formatting
- Optional file-based audit trail

**Principle 5: Error Transparency**
- All errors go to a central error handler
- Error tracking across command chains
- Contextual error messages with suggestions

### Step 2: Unify Card Creation

**Current (Scattered):**
```typescript
if (verbosity !== 'quiet') {
  console.log(new MessageCard('Title', content, 'success').build());
}
```

**Proposed (Centralized):**
```typescript
// Card knows its own verbosity requirement
const card = new MessageCard('Title', content, 'success', 'summary');
outputBuilder.writeCard(card);  // outputBuilder decides to show/hide
```

### Step 3: Enhance OutputSynk

**Current:**
```typescript
interface IOutputSynk {
  write(card: ICardBuilder | string, verbosity?: VerbosityLevel): void;
  build(): string;
}
```

**Proposed:**
```typescript
interface IOutputSynk {
  // Current methods
  write(card: ICardBuilder | string, verbosity?: VerbosityLevel): void;
  build(): string;
  
  // New methods - Aligned with verbosity specification
  
  // QUIET level - always visible
  writeCommandStart(name: string): void;           // Command name
  writeCommandEnd(duration: number): void;         // Execution time
  writeFileCreated(path: string): void;            // File tracking
  
  // SUMMARY level - cards only
  writeCard(card: ICardBuilder): void;             // Any command card
  
  // VERBOSE level - between-card messages
  writeProgress(message: string): void;            // Progress updates (info)
  writeInfo(message: string): void;                // Informational messages
  writeWarning(message: string): void;             // Warning messages
  writeError(message: string): void;               // Error messages (non-fatal)
  
  // Logging
  toFile(path: string): Promise<void>;             // Write accumulated output to file
  getLogs(): string[];                             // Get all logged lines
}
```

### Step 4: Create Logging Utilities for Commands

**For Workflow Commands:**
```typescript
export class CommandLogger {
  constructor(private context: IFlow, private cardBuilder?: ICardBuilder) {}
  
  // Workflow commands stay silent by default
  // But can opt-in to logging if needed:
  logProgress(message: string) {
    // Optional: log to context or external sink
  }
}
```

**For Task Commands:**
```typescript
export class TaskLogger {
  constructor(
    private outputSynk: IOutputSynk,
    private commandName: string,
    private startTime: number = Date.now()
  ) {
    // Automatically log command start (QUIET level)
    this.outputSynk.writeCommandStart(commandName);
  }
  
  // QUIET level - file tracking
  fileCreated(path: string) {
    this.outputSynk.writeFileCreated(path);
  }
  
  // SUMMARY level - cards
  card(card: ICardBuilder) {
    this.outputSynk.writeCard(card);
  }
  
  // VERBOSE level - between-card messages
  progress(message: string) {
    this.outputSynk.writeProgress(message);
  }
  
  info(message: string) {
    this.outputSynk.writeInfo(message);
  }
  
  warning(message: string) {
    this.outputSynk.writeWarning(message);
  }
  
  error(message: string) {
    this.outputSynk.writeError(message);
  }
  
  // Call this at end of command
  complete() {
    const duration = Date.now() - this.startTime;
    this.outputSynk.writeCommandEnd(duration);
  }
}
```

### Step 5: Implement Card Verbosity

**Important:** All cards are SUMMARY level by specification. The card system doesn't need verbosity metadata.

```typescript
export class MessageCard implements ICardBuilder {
  name: string;
  
  constructor(
    private title: string,
    private content: string,
    private style: CardStyle = 'default'
  ) {
    this.name = `MessageCard:${title}`;
  }
  
  build(): string {
    // ... rendering logic unchanged
  }
}

// Cards are always shown in summary mode
// No need for verbosity property on cards themselves
```

### Step 6: Unified Task Handler Pattern

**Make all task commands extend TaskHandler:**

```typescript
export default class CleanCommand extends TaskHandler {
  name = 'clean';
  description = 'Clean up old log files';
  examples = ['ot clean', 'ot clean --days 7'];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: IFlow,
    synk: IOutputSynk
  ): Promise<ReferenceHandle> {
    // Create logger - automatically logs command start (QUIET level)
    const logger = new TaskLogger(synk, this.name);
    
    // VERBOSE level - progress messages
    logger.progress('Checking logs directory...');
    logger.progress('Scanning for old files...');
    logger.progress(`Found ${deletedCount} files to delete`);
    
    // QUIET level - track files affected
    for (const deletedDir of deletedDirs) {
      logger.fileCreated(deletedDir);  // Actually "deleted" but tracked as filesystem change
    }
    
    // SUMMARY level - result card
    logger.card(new MessageCard(
      'Clean Operation Complete',
      `Deleted: ${deletedCount} directories\nSpace Freed: ${this.formatSize(deletedSize)}`,
      'success'
    ));
    
    // Automatically logs execution time (QUIET level)
    logger.complete();
    
    return ref;
  }
}
```

---

## Recommendations

### Priority 1: Immediate (1-2 weeks)

1. **Implement verbosity specification in IOutputSynk**
   - Add: `writeCommandStart()`, `writeCommandEnd()`, `writeFileCreated()`
   - Add: `writeCard()` (summary level)
   - Add: `writeProgress()`, `writeInfo()`, `writeWarning()`, `writeError()` (verbose level)
   - Update ConsoleOutputBuilder to enforce hierarchy

2. **Create TaskLogger utility**
   - Auto-tracks: command name, execution time, file creation (quiet level)
   - Provides: `card()` for summary level
   - Provides: `progress()`, `info()`, `warning()`, `error()` for verbose level
   - Used by all task commands

3. **Standardize all task commands on TaskHandler base class**
   - Convert `InitCommand`, `CleanCommand`, `PromoteCommand`
   - All commands use TaskLogger
   - Ensures consistent verbosity behavior

### Priority 2: Medium (2-4 weeks)

4. **Implement file-based logging**
   - Tasks optionally write output to `.open-tasks/logs/<timestamp>.log`
   - Structured JSON format for machine parsing
   - Include command name, arguments, results, errors

6. **Add styling to verbose-level messages**
   - Color-code: info (blue), warning (yellow), error (red)
   - Prefix with icon: ℹ️ / ⚠️ / ❌
   - Consistent formatting

### Priority 3: Long-term (1-2 months)

7. **Create audit trail system**
   - Track all command executions
   - Store results in `.open-tasks/logs/audit.json`
   - Enable retrospective analysis

8. **Add progress callbacks to workflow commands**
   - Optional logging for complex operations
   - Useful for long-running reads/writes
   - Maintains "silent by default" principle

9. **Create logging best practices guide**
   - Document card usage patterns
   - Provide templates for new commands
   - Share examples of good logging

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)

```typescript
// src/logging/TaskLogger.ts
export class TaskLogger {
  constructor(
    private outputSynk: IOutputSynk,
    private commandName: string,
    private startTime: number = Date.now()
  ) {
    // QUIET level - command start
    this.outputSynk.writeCommandStart(commandName);
  }
  
  // QUIET level
  fileCreated(path: string) {
    this.outputSynk.writeFileCreated(path);
  }
  
  // SUMMARY level
  card(card: ICardBuilder) {
    this.outputSynk.writeCard(card);
  }
  
  // VERBOSE level
  progress(message: string) {
    this.outputSynk.writeProgress(message);
  }
  
  info(message: string) {
    this.outputSynk.writeInfo(message);
  }
  
  warning(message: string) {
    this.outputSynk.writeWarning(message);
  }
  
  error(message: string) {
    this.outputSynk.writeError(message);
  }
  
  complete() {
    const duration = Date.now() - this.startTime;
    this.outputSynk.writeCommandEnd(duration);
  }
}

// src/cards/MessageCard.ts - NO CHANGES NEEDED
// Cards are always SUMMARY level by specification
export class MessageCard implements ICardBuilder {
  constructor(
    title: string,
    content: string,
    style: CardStyle = 'default'
  ) { /* ... */ }
}
```

### Phase 2: Task Standardization (Week 2)

Convert task commands:

```typescript
// src/tasks/init.ts
export default class InitCommand extends TaskHandler {  // ← CHANGE: implements → extends
  protected async executeCommand(
    config, args, flow, synk
  ): Promise<ReferenceHandle> {
    const logger = new TaskLogger(synk, this.name);  // ← Auto-logs command start
    
    // VERBOSE level - progress
    logger.progress('Creating directories...');
    logger.progress('Writing configuration...');
    
    // QUIET level - file tracking
    logger.fileCreated('.open-tasks/');
    logger.fileCreated('.open-tasks/logs/');
    logger.fileCreated('.open-tasks/.config.json');
    
    // SUMMARY level - result card
    logger.card(new MessageCard(
      '🎉 Project Initialized',
      `Created: ${results.length} files\nNext: npm install`,
      'success'
    ));
    
    logger.complete();  // ← Auto-logs execution time
    return ref;
  }
}
```

### Phase 3: Enhanced OutputSynk (Week 3)

```typescript
// src/output-builders.ts - UPDATED
export class ConsoleOutputBuilder implements IOutputSynk {
  private logs: string[] = [];
  private filesCreated: string[] = [];
  
  constructor(private verbosity: VerbosityLevel) {}
  
  // QUIET level methods - always shown
  writeCommandStart(name: string): void {
    if (this.shouldShow('quiet')) {
      console.log(`\n▶️  ${name}`);
      this.logs.push(`Command: ${name}`);
    }
  }
  
  writeCommandEnd(duration: number): void {
    if (this.shouldShow('quiet')) {
      console.log(`⏱️  Completed in ${duration}ms`);
      if (this.filesCreated.length > 0) {
        console.log(`📁 Files: ${this.filesCreated.join(', ')}`);
      }
      this.logs.push(`Duration: ${duration}ms`);
    }
  }
  
  writeFileCreated(path: string): void {
    this.filesCreated.push(path);
    this.logs.push(`File: ${path}`);
  }
  
  // SUMMARY level - cards
  writeCard(card: ICardBuilder): void {
    if (this.shouldShow('summary')) {
      console.log(card.build());
      this.logs.push(card.build());
    }
  }
  
  // VERBOSE level - between-card messages
  writeProgress(message: string): void {
    if (this.shouldShow('verbose')) {
      console.log(`ℹ️  ${message}`);
      this.logs.push(`[INFO] ${message}`);
    }
  }
  
  writeInfo(message: string): void {
    if (this.shouldShow('verbose')) {
      console.log(`ℹ️  ${message}`);
      this.logs.push(`[INFO] ${message}`);
    }
  }
  
  writeWarning(message: string): void {
    if (this.shouldShow('verbose')) {
      console.log(`⚠️  ${message}`);
      this.logs.push(`[WARN] ${message}`);
    }
  }
  
  writeError(message: string): void {
    if (this.shouldShow('verbose')) {
      console.log(`❌ ${message}`);
      this.logs.push(`[ERROR] ${message}`);
    }
  }
  
  private shouldShow(level: VerbosityLevel): boolean {
    const levels = { quiet: 0, summary: 1, verbose: 2 };
    return levels[this.verbosity] >= levels[level];
  }
  
  async toFile(path: string): Promise<void> {
    await fs.writeFile(path, this.logs.join('\n'), 'utf-8');
  }
  
  getLogs(): string[] {
    return this.logs;
  }
}
```

---

## Testing Strategy

### Test Coverage for Unified Logging

```typescript
describe('TaskLogger', () => {
  it('should log command start on creation', () => {
    const synkMock = { 
      writeCommandStart: vi.fn(),
      writeCommandEnd: vi.fn(),
    };
    const logger = new TaskLogger(synkMock, 'test-command');
    
    expect(synkMock.writeCommandStart).toHaveBeenCalledWith('test-command');
  });
  
  it('should delegate progress to verbose output', () => {
    const synkMock = { 
      writeCommandStart: vi.fn(),
      writeProgress: vi.fn(),
    };
    const logger = new TaskLogger(synkMock, 'test');
    
    logger.progress('Processing...');
    
    expect(synkMock.writeProgress).toHaveBeenCalledWith('Processing...');
  });
  
  it('should track file creation at quiet level', () => {
    const synkMock = { 
      writeCommandStart: vi.fn(),
      writeFileCreated: vi.fn(),
    };
    const logger = new TaskLogger(synkMock, 'test');
    
    logger.fileCreated('/path/to/file.txt');
    
    expect(synkMock.writeFileCreated).toHaveBeenCalledWith('/path/to/file.txt');
  });
});

describe('ConsoleOutputBuilder Verbosity Levels', () => {
  it('should show only quiet-level output in quiet mode', () => {
    const synk = new ConsoleOutputBuilder('quiet');
    const consoleSpy = vi.spyOn(console, 'log');
    
    synk.writeCommandStart('test');        // ✓ Should show
    synk.writeFileCreated('file.txt');     // ✓ Should track
    synk.writeCommandEnd(100);             // ✓ Should show
    synk.writeCard(new MessageCard('', ''));  // ✗ Should NOT show
    synk.writeProgress('Loading...');      // ✗ Should NOT show
    
    expect(consoleSpy).toHaveBeenCalledTimes(2); // start + end
  });
  
  it('should show quiet + summary output in summary mode', () => {
    const synk = new ConsoleOutputBuilder('summary');
    const consoleSpy = vi.spyOn(console, 'log');
    
    synk.writeCommandStart('test');        // ✓ Should show
    synk.writeCard(new MessageCard('', ''));  // ✓ Should show
    synk.writeProgress('Loading...');      // ✗ Should NOT show
    
    expect(consoleSpy).toHaveBeenCalledTimes(2);
  });
  
  it('should show all output in verbose mode', () => {
    const synk = new ConsoleOutputBuilder('verbose');
    const consoleSpy = vi.spyOn(console, 'log');
    
    synk.writeCommandStart('test');        // ✓ Should show
    synk.writeCard(new MessageCard('', ''));  // ✓ Should show
    synk.writeProgress('Loading...');      // ✓ Should show
    synk.writeWarning('Careful!');         // ✓ Should show
    
    expect(consoleSpy).toHaveBeenCalledTimes(4);
  });
});
```

---

## Conclusion

The Open Tasks logging architecture currently exhibits three distinct command types with inconsistent output patterns. While the TaskHandler base class provides a template for consistency, it's underutilized. The card system offers excellent visual presentation but lacks enforcement of the verbosity specification.

**Verbosity Specification (Target):**
- **quiet:** Command name + execution time + files created only
- **summary:** quiet output + all command cards
- **verbose:** summary output + between-card messages (progress/warning/error/info)

**Key Opportunities:**
1. ✅ Implement strict verbosity hierarchy in IOutputSynk
2. ✅ Create TaskLogger with auto-tracking (command start/end, files)
3. ✅ Standardize all task commands on TaskHandler base class
4. ✅ Enforce verbosity levels through method naming (not metadata)
5. ✅ Implement structured file-based logging
6. ✅ Create unified error handling with categorization

**Expected Outcomes:**
- 🎯 **Predictable output:** Every command follows same verbosity rules
- 🎯 **Automatic tracking:** Command name, time, files tracked by framework
- 🎯 **Clear separation:** quiet/summary/verbose strictly enforced
- 🎯 **Consistent styling:** error/warning/info messages formatted uniformly
- 🎯 **Audit trail:** All commands logged to file for retrospective analysis
- 🎯 **Maintainable codebase:** New commands inherit correct behavior automatically

By following this roadmap, Open Tasks will achieve a professional-grade logging system with strict, predictable verbosity levels that make the CLI experience consistent and reliable.
