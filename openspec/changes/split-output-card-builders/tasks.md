# Implementation Tasks: Split IOutputBuilder into IOutputBuilder and ICardBuilder

**Change ID:** `split-output-card-builders`

## Task Checklist

### Phase 1: Core Interfaces and Card Builders

- [ ] **Task 1.1: Define ICardBuilder interface**
  - Create `ICardBuilder` interface with `addCard()`, `addProgress()`, `build()` methods
  - Define `CardContent` union type
  - Define `TableCard`, `ListCard`, `TreeCard` interfaces
  - Export from `types.ts` module
  - **Validation:** Interface compiles and can be implemented
  - **Dependency:** None

- [ ] **Task 1.2: Implement QuietCardBuilder**
  - Create class implementing `ICardBuilder`
  - Ignore all `addCard()` calls
  - Ignore all `addProgress()` calls
  - `build()` returns empty string
  - **Validation:** Builder produces no output
  - **Dependency:** Task 1.1

- [ ] **Task 1.3: Implement SummaryCardBuilder**
  - Create class implementing `ICardBuilder`
  - Decide policy: ignore all cards or show first card
  - Ignore `addProgress()` calls
  - `build()` returns empty string (or first card if policy changes)
  - **Validation:** Builder produces minimal/no output
  - **Dependency:** Task 1.1

- [ ] **Task 1.4: Implement VerboseCardBuilder**
  - Create class implementing `ICardBuilder`
  - Buffer all cards in array
  - Buffer progress messages (optional)
  - Implement `renderCard()` for each card type
  - Implement `renderTable()` helper
  - Implement `renderList()` helper
  - Implement `renderTree()` helper
  - `build()` returns formatted string with all cards
  - **Validation:** Builder shows all cards with proper formatting
  - **Dependency:** Task 1.1

- [ ] **Task 1.5: Create card builder factory**
  - Implement `createCardBuilder(verbosity: VerbosityLevel): ICardBuilder`
  - Return appropriate implementation based on verbosity
  - Handle unknown verbosity levels gracefully
  - **Validation:** Factory returns correct builder for each level
  - **Dependency:** Tasks 1.2-1.4

- [ ] **Task 1.6: Refactor IOutputBuilder**
  - Remove `addSection()` method (or deprecate)
  - Remove `addProgress()` method (or deprecate)
  - Keep `addSummary()`, `addError()`, `build()`
  - Update documentation
  - **Validation:** Interface reflects framework-only concerns
  - **Dependency:** Task 1.1 (new interface exists)

---

### Phase 2: CommandHandler Integration

- [ ] **Task 2.1: Add cardBuilder parameter to executeCommand()**
  - Update `CommandHandler.executeCommand()` signature
  - Add `cardBuilder: ICardBuilder` as last parameter
  - Make parameter optional initially (backward compatibility)
  - Update TypeScript types
  - **Validation:** Signature compiles with optional parameter
  - **Dependency:** Task 1.1

- [ ] **Task 2.2: Update executeWithOutputControl()**
  - Create both `outputBuilder` and `cardBuilder` in method
  - Pass `cardBuilder` to `executeCommand()`
  - Combine card output and summary output
  - Format: `cards + '\n\n' + summary`
  - Handle empty card output gracefully
  - **Validation:** Both builders used, output combined correctly
  - **Dependency:** Tasks 1.5, 2.1

- [ ] **Task 2.3: Add createCardBuilder() helper method**
  - Implement `protected createCardBuilder(context: ExecutionContext): ICardBuilder`
  - Use same verbosity resolution as `createOutputBuilder()`
  - Respect command's `defaultVerbosity`
  - **Validation:** Returns correct builder based on context
  - **Dependency:** Task 1.5

- [ ] **Task 2.4: Update handleOutput() method**
  - Ensure only `outputBuilder` is used for summary
  - Remove any `addSection()` calls if present
  - Keep timing and summary logic
  - **Validation:** Summary still displays correctly
  - **Dependency:** Task 2.2

- [ ] **Task 2.5: Update handleError() method**
  - Ensure only `outputBuilder` is used for errors
  - Remove any section-related error handling
  - Keep error file writing logic
  - **Validation:** Errors still display correctly
  - **Dependency:** Task 2.2

---

### Phase 3: ICommand (Workflow) Integration

- [ ] **Task 3.1: Update ICommand interface**
  - Add `cardBuilder?: ICardBuilder` parameter to `execute()` method
  - Make parameter optional (backward compatibility)
  - Update documentation
  - **Validation:** Interface compiles, optional parameter
  - **Dependency:** Task 1.1

- [ ] **Task 3.2: Update IWorkflowContext.run()**
  - Add `cardBuilder?: ICardBuilder` parameter to `run()` method
  - Pass cardBuilder to command's `execute()` method
  - Make parameter optional
  - **Validation:** Can pass card builder through to commands
  - **Dependency:** Task 3.1

- [ ] **Task 3.3: Update BaseTransformCommand**
  - Update `execute()` signature to accept optional cardBuilder
  - Update all transform command implementations
  - Commands don't need to use cardBuilder initially
  - **Validation:** All transforms compile with new signature
  - **Dependency:** Task 3.1

- [ ] **Task 3.4: Test workflow commands with cards**
  - Create test command that uses cardBuilder
  - Verify cards display correctly
  - Test with different verbosity levels
  - **Validation:** Workflow commands can use cards
  - **Dependency:** Tasks 3.1-3.3

---

### Phase 4: Migrate Built-in Commands

- [ ] **Task 4.1: Migrate StoreCommand**
  - Update signature to accept `cardBuilder`
  - Replace `builder.addProgress()` with `cardBuilder.addProgress()`
  - Convert verbose section to card
  - Use `cardBuilder.addCard()` for processing details
  - **Validation:** Command works with new API
  - **Dependency:** Task 2.1

- [ ] **Task 4.2: Migrate LoadCommand**
  - Update signature to accept `cardBuilder`
  - Convert progress messages to cardBuilder
  - Convert verbose sections to cards
  - **Validation:** Command works with new API
  - **Dependency:** Task 2.1

- [ ] **Task 4.3: Migrate InitCommand**
  - Update signature to accept `cardBuilder`
  - Convert progress messages to cardBuilder
  - Convert file creation list to ListCard
  - **Validation:** Command works with new API
  - **Dependency:** Task 2.1

- [ ] **Task 4.4: Migrate AnalyzeCommand (if exists)**
  - Update signature to accept `cardBuilder`
  - Convert statistics to TableCard
  - Convert file list to TreeCard
  - **Validation:** Command works with new API, shows rich formatting
  - **Dependency:** Task 2.1

- [ ] **Task 4.5: Update custom command template**
  - Update `templates/example-command.ts`
  - Show example using cardBuilder
  - Include examples of different card types
  - **Validation:** Template demonstrates new API
  - **Dependency:** Task 2.1

---

### Phase 5: Update Helper Utilities

- [ ] **Task 5.1: Create card helper utilities**
  - Create `card-utils.ts` with helper functions
  - Implement `createTableCard()` helper
  - Implement `createListCard()` helper
  - Implement `createTreeCard()` helper
  - Implement `createKeyValueCard()` helper
  - **Validation:** Helpers simplify card creation
  - **Dependency:** Task 1.1

- [ ] **Task 5.2: Update or deprecate output-utils**
  - Deprecate `addProcessingDetails()` (replaced by cards)
  - Deprecate `addFileInfoSection()` (replaced by cards)
  - Keep `formatFileSize()` (still useful)
  - Keep `createSuccessSummary()` (still relevant)
  - Add deprecation warnings
  - **Validation:** Old helpers still work but warn
  - **Dependency:** Task 5.1

- [ ] **Task 5.3: Create migration helper**
  - Create `migrateToCardBuilder()` utility
  - Converts old `addSection()` calls to card suggestions
  - Provide guidance for command authors
  - **Validation:** Helper suggests appropriate card types
  - **Dependency:** Task 5.1

---

### Phase 6: Testing

- [ ] **Task 6.1: Unit test card rendering**
  - Test `renderTable()` with various table sizes
  - Test `renderList()` with ordered and unordered
  - Test `renderTree()` with nested structures
  - Test plain text cards
  - Test key-value object cards
  - **Validation:** All card types render correctly
  - **Dependency:** Task 1.4

- [ ] **Task 6.2: Unit test card builders**
  - Test QuietCardBuilder ignores everything
  - Test SummaryCardBuilder (based on policy)
  - Test VerboseCardBuilder shows all cards
  - Test builder factory
  - **Validation:** Each builder behaves correctly
  - **Dependency:** Tasks 1.2-1.5

- [ ] **Task 6.3: Integration test CommandHandler**
  - Test command receives cardBuilder
  - Test output combines cards and summary
  - Test different verbosity levels
  - Test with no cards added
  - Test with multiple cards
  - **Validation:** Integration works end-to-end
  - **Dependency:** Task 2.2

- [ ] **Task 6.4: Integration test workflow commands**
  - Test ICommand with optional cardBuilder
  - Test backward compatibility (commands without cardBuilder)
  - Test workflow context passing cardBuilder
  - **Validation:** Workflow integration works
  - **Dependency:** Tasks 3.1-3.4

- [ ] **Task 6.5: E2E test migrated commands**
  - Test StoreCommand with cards
  - Test LoadCommand with cards
  - Test InitCommand with cards
  - Test output in quiet, summary, and verbose modes
  - **Validation:** Real commands work with new system
  - **Dependency:** Tasks 4.1-4.3

---

### Phase 7: Documentation

- [ ] **Task 7.1: Document ICardBuilder interface**
  - Write API documentation with examples
  - Show how to use each card type
  - Explain when to use cards vs summary
  - Include TypeScript examples
  - **Validation:** Documentation is clear and complete

- [ ] **Task 7.2: Update architecture documentation**
  - Update `IOutputBuilder-Architecture.md`
  - Add section on ICardBuilder
  - Explain separation of concerns
  - Update diagrams
  - **Validation:** Architecture doc reflects new design

- [ ] **Task 7.3: Update flow diagrams**
  - Update `IOutputBuilder-Flow-Diagrams.md`
  - Add card builder to flow
  - Show both builders in execution
  - **Validation:** Diagrams show complete picture

- [ ] **Task 7.4: Update examples documentation**
  - Update `IOutputBuilder-Examples.md`
  - Add examples using cardBuilder
  - Show different card types in action
  - Include migration examples (before/after)
  - **Validation:** Examples demonstrate new API

- [ ] **Task 7.5: Create migration guide**
  - Document how to update existing commands
  - Show before/after examples
  - Explain new mental model
  - Provide migration checklist
  - **Validation:** Guide helps command authors migrate

- [ ] **Task 7.6: Update README**
  - Mention card builder feature
  - Link to card documentation
  - Update examples if needed
  - **Validation:** README reflects new capability

---

### Phase 8: Cleanup (Future/Breaking)

- [ ] **Task 8.1: Make cardBuilder required in CommandHandler**
  - Remove optional flag from parameter
  - Update all commands to use cardBuilder
  - **Validation:** All commands have cardBuilder parameter
  - **Dependency:** All commands migrated

- [ ] **Task 8.2: Make cardBuilder required in ICommand**
  - Remove optional flag from parameter
  - Update all workflow commands
  - **Validation:** All workflow commands have parameter
  - **Dependency:** All workflow commands migrated

- [ ] **Task 8.3: Remove deprecated IOutputBuilder methods**
  - Remove `addSection()` method completely
  - Remove `addProgress()` method completely
  - Update all references
  - **Validation:** Interface has minimal surface area
  - **Dependency:** Tasks 8.1, 8.2

- [ ] **Task 8.4: Remove deprecated utilities**
  - Remove `addProcessingDetails()` from output-utils
  - Remove `addFileInfoSection()` from output-utils
  - Remove migration helpers
  - **Validation:** Only card-utils remain
  - **Dependency:** Task 8.3

---

## Milestone Summary

**Milestone 1: Foundation** (Tasks 1.1 - 1.6)
- Core interfaces and implementations
- All card builders working
- IOutputBuilder refactored

**Milestone 2: Integration** (Tasks 2.1 - 3.4)
- CommandHandler and ICommand updated
- Card builders integrated into execution flow
- Backward compatibility maintained

**Milestone 3: Migration** (Tasks 4.1 - 5.3)
- Built-in commands migrated
- Helper utilities created
- Templates updated

**Milestone 4: Validation** (Tasks 6.1 - 6.5)
- Comprehensive testing
- All scenarios covered
- Quality assurance complete

**Milestone 5: Documentation** (Tasks 7.1 - 7.6)
- API documentation complete
- Architecture updated
- Migration guide available

**Milestone 6: Cleanup** (Tasks 8.1 - 8.4)
- Optional parameters removed
- Deprecated code deleted
- Final state achieved

---

## Dependencies Graph

```
1.1 (ICardBuilder) ─┬─> 1.2 (QuietCardBuilder)
                    ├─> 1.3 (SummaryCardBuilder)
                    ├─> 1.4 (VerboseCardBuilder)
                    ├─> 1.6 (Refactor IOutputBuilder)
                    ├─> 2.1 (Add cardBuilder param)
                    ├─> 3.1 (Update ICommand)
                    └─> 5.1 (Card helpers)

1.2, 1.3, 1.4 ──────> 1.5 (Factory)

1.5 ────────────────> 2.3 (createCardBuilder)

2.1, 2.3 ───────────> 2.2 (executeWithOutputControl)

2.2 ─────────────┬─> 2.4 (handleOutput)
                 └─> 2.5 (handleError)

3.1 ─────────────┬─> 3.2 (IWorkflowContext.run)
                 └─> 3.3 (BaseTransformCommand)

3.2, 3.3 ───────────> 3.4 (Test workflow commands)

2.1 ─────────────┬─> 4.1 (Migrate StoreCommand)
                 ├─> 4.2 (Migrate LoadCommand)
                 ├─> 4.3 (Migrate InitCommand)
                 ├─> 4.4 (Migrate AnalyzeCommand)
                 └─> 4.5 (Update template)

All Phase 4 ────────> 6.5 (E2E tests)
```

---

## Estimated Timeline

- **Phase 1**: 1-2 days
- **Phase 2**: 1 day
- **Phase 3**: 1 day
- **Phase 4**: 1-2 days
- **Phase 5**: 0.5 day
- **Phase 6**: 1-2 days
- **Phase 7**: 1 day
- **Phase 8**: 0.5 day (future)

**Total**: ~7-10 days for Phases 1-7
