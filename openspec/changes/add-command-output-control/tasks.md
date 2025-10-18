# Implementation Tasks: Add Command Output Control

**Change ID:** `add-command-output-control`  
**Last Updated:** 2025-10-18

## Task Checklist

### Phase 1: Core Interfaces and Types

- [x] **Task 1.1: Define VerbosityLevel and OutputTarget types**
  - Create TypeScript union types for verbosity levels
  - Create TypeScript union types for output targets
  - Export types from types.ts module
  - **Validation:** Types compile and can be imported ✓

- [x] **Task 1.2: Define IOutputBuilder interface**
  - Create interface with addSection, addSummary, addProgress, addError methods
  - Define SummaryData interface with required fields
  - Add build() method that returns formatted string
  - **Validation:** Interface compiles and can be implemented ✓
  - **Dependency:** Task 1.1

- [x] **Task 1.3: Extend ExecutionContext interface**
  - Add verbosity property (VerbosityLevel)
  - Add outputTarget property (OutputTarget)
  - Add optional customOutputPath property
  - Ensure backward compatibility (all new properties optional or with defaults)
  - **Validation:** Existing code compiles without errors ✓
  - **Dependency:** Task 1.1

### Phase 2: Output Builder Implementations

- [x] **Task 2.1: Implement QuietOutputBuilder**
  - Create class implementing IOutputBuilder
  - Only include essential summary information
  - Format as single line: "✓ command completed in Xms"
  - **Validation:** Builder produces correct quiet output ✓
  - **Dependency:** Task 1.2

- [x] **Task 2.2: Implement SummaryOutputBuilder**
  - Create class implementing IOutputBuilder
  - Format with command name, time, file path, reference token
  - Use emojis (✓, 📁, 🔗) for visual clarity
  - Match current default behavior
  - **Validation:** Builder produces current-style output ✓
  - **Dependency:** Task 1.2

- [x] **Task 2.3: Implement VerboseOutputBuilder**
  - Create class implementing IOutputBuilder
  - Include all sections added via addSection
  - Show detailed metadata and progress messages
  - Format with headers and structured content
  - **Validation:** Builder includes all added sections ✓
  - **Dependency:** Task 1.2

- [x] **Task 2.4: Implement StreamingOutputBuilder**
  - Create class implementing IOutputBuilder
  - Output sections immediately (no buffering)
  - Show timestamps or elapsed time for each update
  - Support progress indicators
  - **Validation:** Output appears in real-time ✓
  - **Dependency:** Task 1.2

- [x] **Task 2.5: Create OutputBuilder factory**
  - Implement factory function that returns appropriate builder
  - Accept verbosity level and return correct implementation
  - Handle unknown verbosity levels gracefully
  - **Validation:** Factory returns correct builder for each level ✓
  - **Dependency:** Tasks 2.1-2.4

### Phase 3: ExecutionContext and OutputHandler Enhancements

- [x] **Task 3.1: Update ExecutionContext creation**
  - Modify context creation in index.ts to include new properties
  - Add default values (verbosity='summary', outputTarget='both')
  - Parse CLI flags and set properties accordingly
  - **Validation:** Context created with correct defaults ✓
  - **Dependency:** Task 1.3

- [x] **Task 3.2: Extend OutputHandler with routing logic**
  - Add shouldOutputToScreen() method
  - Add shouldOutputToFile() method
  - Implement logic based on outputTarget property
  - **Validation:** Methods return correct boolean based on target ✓
  - **Dependency:** Task 1.3

- [x] **Task 3.3: Add execution time tracking utilities**
  - Create formatExecutionTime() function (ms → "Xms" or "X.Xs")
  - Create calculateDuration() helper
  - Add to utils.ts module
  - **Validation:** Time formatting is accurate and readable ✓
  - **Dependency:** Task 1.2

- [x] **Task 3.4: Implement custom path validation**
  - Create validateOutputPath() function
  - Check for directory traversal patterns (../)
  - Ensure path is within allowed directory
  - Return sanitized path or throw error
  - **Validation:** Malicious paths are rejected ✓
  - **Dependency:** Task 1.3

- [x] **Task 3.5: Add output routing to OutputHandler**
  - Update writeOutput() to check outputTarget
  - Route to screen, file, or both based on target
  - Support custom file paths
  - Handle file creation errors gracefully
  - **Validation:** Output goes to correct destination(s) ✓
  - **Dependency:** Tasks 3.2, 3.4

### Phase 4: CommandHandler Base Class Enhancement

- [x] **Task 4.1: Add timing wrapper to CommandHandler**
  - Modify execute() method to record start time
  - Calculate execution duration after command completes
  - Pass timing info to output building
  - **Validation:** Execution time is accurately tracked ✓
  - **Dependency:** Task 3.3

- [x] **Task 4.2: Add output builder creation to CommandHandler**
  - Implement createOutputBuilder() protected method
  - Use factory to get correct builder based on verbosity
  - Pass ExecutionContext to determine verbosity
  - **Validation:** Correct builder is created for each verbosity ✓
  - **Dependency:** Task 2.5

- [x] **Task 4.3: Implement handleOutput() method**
  - Create protected method for successful command output
  - Build summary using SummaryData
  - Use output builder to format
  - Route output via OutputHandler
  - **Validation:** Summary is displayed/written correctly ✓
  - **Dependency:** Tasks 4.1, 4.2, 3.5

- [x] **Task 4.4: Implement handleError() method**
  - Create protected method for error handling
  - Format error with execution time
  - Use output builder for formatting
  - Write error log file
  - **Validation:** Errors are formatted and logged correctly ✓
  - **Dependency:** Task 4.3

- [x] **Task 4.5: Refactor execute() to use new methods**
  - Wrap command logic with try/catch
  - Call handleOutput() on success
  - Call handleError() on failure
  - Return ReferenceHandle as before
  - Maintain backward compatibility with opt-in pattern
  - **Validation:** Command execution flow works end-to-end ✓
  - **Dependency:** Tasks 4.3, 4.4

### Phase 5: CLI Argument Parsing

- [ ] **Task 5.1: Add verbosity flags to CLI parser**
  - Add --quiet, -q flag
  - Add --summary, -s flag (explicit)
  - Add --verbose, -v flag
  - Add --stream flag
  - Parse and validate flags
  - **Validation:** Flags are recognized and parsed correctly
  - **Dependency:** Task 3.1

- [ ] **Task 5.2: Add output target flags to CLI parser**
  - Add --log-only flag
  - Add --screen-only flag
  - Add --both flag (explicit)
  - Add --file <path> option with argument
  - Parse and validate flags
  - **Validation:** Flags are recognized and parsed correctly
  - **Dependency:** Task 3.1

- [ ] **Task 5.3: Implement flag validation**
  - Ensure only one verbosity flag specified
  - Ensure only one output target flag specified
  - Validate --file path is provided
  - Show helpful error messages for conflicts
  - **Validation:** Invalid flag combinations are rejected
  - **Dependency:** Tasks 5.1, 5.2

- [ ] **Task 5.4: Integrate flags into ExecutionContext**
  - Pass parsed flags to context creation
  - Set verbosity property from flags
  - Set outputTarget property from flags
  - Set customOutputPath if --file specified
  - **Validation:** Context properties reflect CLI flags
  - **Dependency:** Tasks 3.1, 5.3

### Phase 6: Command Migration and Examples

- [ ] **Task 6.1: Create output builder utilities**
  - Create helper functions for common summary formatting
  - Add utilities for progress messages
  - Add utilities for error formatting
  - Export from shared module
  - **Validation:** Utilities produce consistent output
  - **Dependency:** Phase 2 complete

- [ ] **Task 6.2: Migrate init command**
  - Update to use executeCommand() pattern if needed
  - Add progress messages for verbose mode
  - Use output builder for summary
  - Test with all verbosity levels
  - **Validation:** init works with all output modes
  - **Dependency:** Phase 4 complete

- [ ] **Task 6.3: Migrate store command**
  - Update to use new output pattern
  - Add metadata for verbose mode (size, format)
  - Support streaming for large data
  - Test with all output targets
  - **Validation:** store works with all output modes
  - **Dependency:** Task 6.2

- [ ] **Task 6.4: Migrate load command**
  - Update to use new output pattern
  - Show file size in verbose mode
  - Add progress for large files
  - Test error handling with new format
  - **Validation:** load works with all output modes
  - **Dependency:** Task 6.2

- [ ] **Task 6.5: Update command template in create command**
  - Modify template to show new output pattern
  - Include example of using output builder
  - Show how to add progress messages
  - Add comments explaining verbosity handling
  - **Validation:** Generated commands use new pattern
  - **Dependency:** Phase 4 complete

### Phase 7: Testing

- [ ] **Task 7.1: Write unit tests for OutputBuilders**
  - Test each builder implementation individually
  - Test addSection, addSummary, addProgress, addError methods
  - Test build() output format
  - Test edge cases (empty output, very long content)
  - **Validation:** All builder tests pass
  - **Dependency:** Phase 2 complete

- [ ] **Task 7.2: Write unit tests for verbosity resolution**
  - Test command-level override
  - Test global default fallback
  - Test hardcoded default fallback
  - Test with undefined/null values
  - **Validation:** Verbosity resolution tests pass
  - **Dependency:** Task 5.4

- [ ] **Task 7.3: Write integration tests for output routing**
  - Test screen-only output (no files created)
  - Test log-only output (nothing on terminal)
  - Test both output (screen + file)
  - Test custom file path
  - **Validation:** Output goes to correct destinations
  - **Dependency:** Phase 3 complete

- [ ] **Task 7.4: Write end-to-end tests for each verbosity level**
  - Test command execution with --quiet
  - Test command execution with --summary (default)
  - Test command execution with --verbose
  - Test command execution with --stream
  - Verify output format for each
  - **Validation:** All verbosity modes work correctly
  - **Dependency:** Phase 6 complete

- [ ] **Task 7.5: Write backward compatibility tests**
  - Test existing commands without new flags
  - Test existing code accessing ExecutionContext
  - Test default behavior matches current
  - Test all 49 existing tests still pass
  - **Validation:** No breaking changes detected
  - **Dependency:** Phase 6 complete

- [ ] **Task 7.6: Write security tests for path validation**
  - Test directory traversal prevention (../)
  - Test absolute path handling
  - Test special characters in paths
  - Test permission errors
  - **Validation:** Malicious paths are rejected
  - **Dependency:** Task 3.4

### Phase 8: Documentation

- [ ] **Task 8.1: Document IOutputBuilder interface**
  - Write API documentation with examples
  - Show how to use each method
  - Explain when to use each builder type
  - Include TypeScript examples
  - **Validation:** Documentation is clear and complete

- [ ] **Task 8.2: Document verbosity levels**
  - Explain each verbosity level
  - Show CLI flag usage
  - Provide examples of output for each level
  - Explain when to use each level
  - **Validation:** Users understand verbosity options

- [ ] **Task 8.3: Document output targets**
  - Explain each output target option
  - Show CLI flag usage
  - Provide use cases for each target
  - Document custom file path usage
  - **Validation:** Users understand output routing

- [ ] **Task 8.4: Create migration guide**
  - Document how to update existing commands
  - Show before/after examples
  - Explain executeCommand() pattern
  - Provide code snippets
  - **Validation:** Developers can migrate commands

- [ ] **Task 8.5: Update README and getting started docs**
  - Add output control section to README
  - Update examples with new flags
  - Add troubleshooting section
  - Update CLI help text
  - **Validation:** Documentation reflects new features

## Dependency Graph

```
Phase 1 (Types)
├── 1.1 → 1.2, 1.3

Phase 2 (Builders)
├── 1.2 → 2.1, 2.2, 2.3, 2.4
├── 2.1, 2.2, 2.3, 2.4 → 2.5

Phase 3 (Context/Handler)
├── 1.3 → 3.1, 3.2, 3.4
├── 1.2 → 3.3
├── 3.2, 3.4 → 3.5

Phase 4 (CommandHandler)
├── 3.3 → 4.1
├── 2.5 → 4.2
├── 4.1, 4.2, 3.5 → 4.3
├── 4.3 → 4.4, 4.5

Phase 5 (CLI)
├── 3.1 → 5.1, 5.2
├── 5.1, 5.2 → 5.3
├── 3.1, 5.3 → 5.4

Phase 6 (Migration)
├── Phase 2 → 6.1
├── Phase 4 → 6.2, 6.5
├── 6.2 → 6.3, 6.4

Phase 7 (Testing)
├── Phase 2 → 7.1
├── 5.4 → 7.2
├── Phase 3 → 7.3
├── Phase 6 → 7.4, 7.5
├── 3.4 → 7.6

Phase 8 (Documentation)
├── All phases → 8.1-8.5
```

## Parallel Work Opportunities

- **Phase 1** tasks can be done sequentially (dependencies)
- **Phase 2** tasks 2.1-2.4 can be done in parallel
- **Phase 3** tasks 3.1, 3.2, 3.3, 3.4 can be done in parallel
- **Phase 6** tasks 6.2-6.4 can be done in parallel after 6.2
- **Phase 7** tests can be written alongside implementation
- **Phase 8** documentation can start early

## Estimated Effort

- **Phase 1:** 2-3 hours
- **Phase 2:** 6-8 hours
- **Phase 3:** 6-8 hours
- **Phase 4:** 8-10 hours
- **Phase 5:** 4-6 hours
- **Phase 6:** 8-10 hours
- **Phase 7:** 10-12 hours
- **Phase 8:** 6-8 hours

**Total:** 50-65 hours (approximately 1.5-2 weeks full-time)

## Success Metrics

- [ ] All OutputBuilder implementations work correctly
- [ ] Verbosity resolution follows hierarchy correctly
- [ ] Output routing works for all targets
- [ ] All existing tests pass (backward compatible)
- [ ] 3+ commands successfully migrated
- [ ] New tests achieve >90% coverage
- [ ] Documentation complete with examples
- [ ] No breaking changes to existing API
- [ ] Security tests pass for path validation
