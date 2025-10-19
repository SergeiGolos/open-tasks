# IOutputBuilder: Visual Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          User Runs Command                               │
│                 open-tasks store "data" --verbose                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLI Router (index.ts)                            │
│  • Parses arguments                                                      │
│  • Sets context.verbosity = 'verbose'                                    │
│  • Sets context.outputTarget = 'both'                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   CommandHandler.execute() [Base Class]                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ 1. Start timer                                                  │     │
│  │ 2. builder = createOutputBuilder(context)                       │     │
│  │    → VerboseOutputBuilder created                               │     │
│  │ 3. result = await executeCommand(args, refs, context)           │     │
│  │ 4. handleOutput(result, context, startTime, builder)            │     │
│  │    → Adds summary, routes output                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              StoreCommand.executeCommand() [Implementation]              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ builder.addProgress('Preparing to store value...')             │     │
│  │ // VerboseOutputBuilder stores this in buffer                  │     │
│  │                                                                  │     │
│  │ const memoryRef = await context.workflowContext.store(...)      │     │
│  │                                                                  │     │
│  │ builder.addProgress('Value stored successfully')               │     │
│  │                                                                  │     │
│  │ if (context.verbosity === 'verbose') {                          │     │
│  │   addProcessingDetails(builder, {...})                          │     │
│  │   // Adds section with details                                  │     │
│  │ }                                                                │     │
│  │                                                                  │     │
│  │ return ref;                                                      │     │
│  └────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   CommandHandler.handleOutput()                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ summaryData = {                                                 │     │
│  │   commandName: 'store',                                         │     │
│  │   executionTime: 150,                                           │     │
│  │   outputFile: '...',                                            │     │
│  │   referenceToken: 'mydata',                                     │     │
│  │   success: true                                                 │     │
│  │ }                                                                │     │
│  │                                                                  │     │
│  │ builder.addSummary(summaryData)                                 │     │
│  │ output = builder.build()                                        │     │
│  │                                                                  │     │
│  │ if (shouldOutputToScreen(context.outputTarget)) {               │     │
│  │   console.log(output)                                           │     │
│  │ }                                                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   VerboseOutputBuilder.build()                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ Formats output:                                                 │     │
│  │                                                                  │     │
│  │ ⚙️  Processing Details                                         │     │
│  │ ────────────────────────────                                    │     │
│  │ {                                                                │     │
│  │   "Value Length": 4,                                            │     │
│  │   "Token": "mydata",                                            │     │
│  │   ...                                                            │     │
│  │ }                                                                │     │
│  │                                                                  │     │
│  │ 📊 Execution Summary                                            │     │
│  │ ────────────────────────────────────────────────────            │     │
│  │ ✓ Command: store                                                │     │
│  │ ⏱️  Duration: 150ms                                             │     │
│  │ 📁 Output File: .open-tasks/outputs/output.txt                  │     │
│  │ 🔗 Reference Token: @mydata                                     │     │
│  └────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ Console/File │
                          └──────────────┘
```

## Builder Selection Flow

```
context.verbosity
      │
      ├─ 'quiet' ──────────────────────► QuietOutputBuilder
      │                                   • Single line
      │                                   • Ignores sections/progress
      │
      ├─ 'summary' (default) ───────────► SummaryOutputBuilder
      │                                   • Multi-line formatted
      │                                   • Shows file & token
      │                                   • Ignores sections/progress
      │
      └─ 'verbose' ─────────────────────► VerboseOutputBuilder
                                          • Shows all sections
                                          • Shows all progress (buffered)
                                          • Detailed metadata
```

## Builder Method Behavior Matrix

```
┌──────────────────┬──────────────┬──────────────┬──────────────────┐
│ Method           │ Quiet        │ Summary      │ Verbose          │
├──────────────────┼──────────────┼──────────────┼──────────────────┤
│ addProgress()    │ IGNORE       │ IGNORE       │ BUFFER (or log)  │
├──────────────────┼──────────────┼──────────────┼──────────────────┤
│ addSection()     │ IGNORE       │ IGNORE       │ SHOW ALL         │
├──────────────────┼──────────────┼──────────────┼──────────────────┤
│ addSummary()     │ Minimal      │ Formatted    │ Detailed         │
│                  │ (1 line)     │ (multi-line) │ (with metadata)  │
├──────────────────┼──────────────┼──────────────┼──────────────────┤
│ addError()       │ IGNORE       │ IGNORE       │ Full details     │
│                  │ (throws)     │ (throws)     │ (stack + context)│
├──────────────────┼──────────────┼──────────────┼──────────────────┤
│ build()          │ Returns text │ Returns text │ Returns text     │
│                  │ (1 line)     │ (3-4 lines)  │ (all sections)   │
└──────────────────┴──────────────┴──────────────┴──────────────────┘
```

## Command Interaction Patterns

### Pattern 1: Builder API (Recommended)

```
┌────────────────────────────────────────────────────────────┐
│                      Command Code                           │
│                                                              │
│  builder.addProgress("Step 1...")                           │
│  builder.addProgress("Step 2...")                           │
│  builder.addSection("Details", "...")                       │
│                                                              │
└────────────────────────┬───────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
   QuietBuilder    SummaryBuilder  VerboseBuilder
   (ignores)       (ignores)       (shows all)
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
                  Formatted Output
```

### Pattern 2: Conditional Output

```
┌────────────────────────────────────────────────────────────┐
│                      Command Code                           │
│                                                              │
│  if (context.verbosity === 'verbose') {                     │
│    builder.addSection("Debug Info", debugData)              │
│  }                                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ verbosity = 'quiet' ───► Skip (no section added)
         │
         ├─ verbosity = 'summary' ─► Skip (no section added)
         │
         └─ verbosity = 'verbose' ─► Add section ─► Display
```

### Pattern 3: Progressive Output (Verbose)

```
┌────────────────────────────────────────────────────────────┐
│                      Command Code                           │
│                                                              │
│  for (item of items) {                                      │
│    builder.addProgress(`Processing ${item}...`)             │
│                                                              │
│    if (context.verbosity === 'verbose') {                   │
│      console.log(`Processing ${item}...`) // Immediate!     │
│    }                                                         │
│                                                              │
│    await processItem(item)                                  │
│  }                                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ verbosity = 'quiet' ───► Silent (no output)
         │
         ├─ verbosity = 'summary' ─► Silent (no output)
         │
         └─ verbosity = 'verbose' ─► Real-time console output
                                      Processing item1...
                                      Processing item2...
                                      Processing item3...
```

## Verbosity Resolution Hierarchy

```
User runs: open-tasks mycommand --verbose
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Verbosity Resolution                       │
│                                                               │
│  1. Check CLI flag (--quiet, --summary, --verbose)           │
│     ├─ Found? ──► context.verbosity = flag value             │
│     └─ Not found? ──► Continue to #2                         │
│                                                               │
│  2. Check Command.defaultVerbosity                           │
│     ├─ Set? ──► context.verbosity = command default          │
│     └─ Not set? ──► Continue to #3                           │
│                                                               │
│  3. Use Global Default                                       │
│     └─► context.verbosity = 'summary'                        │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
              createOutputBuilder(context.verbosity)
                            │
                            ▼
                   Appropriate Builder Created
```

## Output Routing Flow

```
                    builder.build()
                           │
                           ▼
                    Formatted String
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   'screen-only'        'both'           'log-only'
        │              (default)              │
        │                  │                  │
        ▼                  ▼                  ▼
  ┌─────────┐      ┌──────────────┐    ┌──────────┐
  │ Console │      │ Console      │    │ File     │
  │ Only    │      │   +          │    │ Only     │
  │         │      │ File         │    │          │
  └─────────┘      └──────────────┘    └──────────┘
                           
                     'file' (custom path)
                           │
                           ▼
                    ┌──────────────┐
                    │ Console      │
                    │   +          │
                    │ Custom Path  │
                    └──────────────┘
```

## Data Flow: Complete Example

```
1. User Input
   └─► open-tasks store "Hello" --token greeting --verbose

2. CLI Parsing
   └─► ExecutionContext {
         verbosity: 'verbose',
         outputTarget: 'both',
         ...
       }

3. CommandHandler.execute()
   └─► builder = VerboseOutputBuilder()
   
4. StoreCommand.executeCommand()
   │
   ├─► builder.addProgress('Preparing...')
   │   └─► VerboseOutputBuilder stores in buffer
   │
   ├─► Do actual work (store the value)
   │
   ├─► builder.addProgress('Value stored')
   │   └─► VerboseOutputBuilder stores in buffer
   │
   └─► if (verbose) {
         builder.addSection('Processing Details', {...})
       }
       └─► VerboseOutputBuilder stores section

5. CommandHandler.handleOutput()
   │
   ├─► builder.addSummary({
   │     commandName: 'store',
   │     executionTime: 150,
   │     outputFile: '...',
   │     referenceToken: 'greeting',
   │     success: true
   │   })
   │
   └─► output = builder.build()
       │
       └─► VerboseOutputBuilder.build() returns:
           
           ⚙️  Processing Details
           ────────────────────────────
           {
             "Value Length": 5,
             "Token": "greeting",
             ...
           }
           
           📊 Execution Summary
           ────────────────────────────
           ✓ Command: store
           ⏱️  Duration: 150ms
           📁 Output File: ...
           🔗 Reference Token: @greeting

6. Output Routing
   │
   ├─► console.log(output)  [screen]
   │
   └─► (optionally write to file based on outputTarget)

7. User sees formatted output!
```

## Key Takeaways

1. **Commands don't know about verbosity levels** - they just call builder methods
2. **Builders decide what to show** - same command code, different output
3. **Framework handles timing and routing** - commands focus on logic
4. **Two-way control**: Framework controls when/where, commands control what
5. **Extensible**: Add new builders without changing existing commands
