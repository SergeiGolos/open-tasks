# Implementation Tasks: Add CLI Framework

**Change ID:** `add-cli-framework`  
**Last Updated:** 2025-10-17

## Task Checklist

### Phase 1: Project Setup and Core Infrastructure

- [ ] **Task 1.1: Initialize npm project**
  - Create package.json with TypeScript configuration
  - Add dependencies: commander, chalk, fs-extra, ora, uuid
  - Add dev dependencies: typescript, tsup, vitest, @types/*
  - Configure build scripts and entry points
  - Set up ESLint and Prettier for code quality
  - **Validation:** `npm install` succeeds, `npm run build` creates dist/

- [ ] **Task 1.2: Configure TypeScript**
  - Create tsconfig.json with strict mode
  - Configure module resolution for ES modules
  - Set up path aliases if needed
  - Configure type checking for tests
  - **Validation:** `tsc --noEmit` passes with no errors

- [ ] **Task 1.3: Create CLI entry point**
  - Implement `src/index.ts` with shebang for CLI execution
  - Set up commander.js program
  - Configure version and description
  - Add basic --help and --version flags
  - **Validation:** `node dist/index.js --version` displays version
  - **Dependency:** Task 1.1, 1.2

- [ ] **Task 1.4: Set up build and packaging**
  - Configure tsup for bundling
  - Create bin entry in package.json
  - Set up prepublish scripts
  - Test local installation with `npm link`
  - **Validation:** `npm link && open-tasks --version` works globally
  - **Dependency:** Task 1.3

### Phase 2: Reference Management and Output Handling

- [ ] **Task 2.1: Implement ReferenceHandle interface**
  - Create `src/types.ts` with ReferenceHandle and ExecutionContext
  - Define interfaces for all data structures
  - Add type exports for external use
  - **Validation:** Types compile without errors

- [ ] **Task 2.2: Implement ReferenceManager class**
  - Create `src/reference-manager.ts`
  - Implement UUID generation
  - Implement in-memory Map storage
  - Add methods: createReference, getReference, listReferences
  - Handle token collision with warnings
  - **Validation:** Unit tests pass for reference CRUD operations
  - **Dependency:** Task 2.1

- [ ] **Task 2.3: Implement OutputHandler class**
  - Create `src/output-handler.ts`
  - Implement file naming with timestamp and token/UUID
  - Implement directory creation (mkdir -p)
  - Add methods: writeOutput, writeError, formatMetadata
  - Support text, JSON, and binary outputs
  - **Validation:** Unit tests write files with correct naming
  - **Dependency:** Task 2.1

- [ ] **Task 2.4: Implement terminal formatting**
  - Create `src/formatters.ts`
  - Implement color scheme using chalk
  - Add functions: formatSuccess, formatError, formatInfo, formatReference
  - Respect NO_COLOR environment variable
  - **Validation:** Visual test shows correct colors in terminal
  - **Dependency:** None

- [ ] **Task 2.5: Implement progress indicators**
  - Add spinner support using ora
  - Create wrapper for long-running operations
  - Implement progress display with percentage
  - Clear indicators on completion
  - **Validation:** Visual test shows spinner during simulated delay
  - **Dependency:** Task 2.4

### Phase 3: Command Infrastructure

- [ ] **Task 3.1: Implement CommandHandler base class**
  - Create `src/command-handler.ts`
  - Define abstract execute method
  - Add static properties for metadata (description, examples)
  - Document interface for custom commands
  - **Validation:** Class exports correctly and compiles
  - **Dependency:** Task 2.1

- [ ] **Task 3.2: Implement CommandRouter**
  - Create `src/router.ts`
  - Implement command registration
  - Add command lookup by name
  - Implement argument parsing and routing
  - Handle unknown commands with suggestions
  - **Validation:** Unit tests route commands correctly
  - **Dependency:** Task 3.1

- [ ] **Task 3.3: Implement CommandLoader for built-ins**
  - Create `src/command-loader.ts`
  - Load commands from `src/commands/` directory
  - Register built-in commands with router
  - **Validation:** All built-in commands are registered
  - **Dependency:** Task 3.2

- [ ] **Task 3.4: Implement custom command discovery**
  - Extend CommandLoader to scan `.open-tasks/commands/`
  - Support .js and .ts files
  - Implement dynamic import for command modules
  - Validate exports and handle errors gracefully
  - **Validation:** Custom command in test directory is discovered
  - **Dependency:** Task 3.3

- [ ] **Task 3.5: Implement execution context**
  - Create ExecutionContext factory
  - Pass context to all command handlers
  - Include: cwd, outputDir, referenceManager, config, outputHandler
  - **Validation:** Commands receive correct context
  - **Dependency:** Task 2.2, 2.3, 3.1

### Phase 4: Built-in Commands

- [ ] **Task 4.1: Implement store command**
  - Create `src/commands/store.ts`
  - Accept value as positional argument
  - Support --token flag
  - Write output file and create reference
  - Add help metadata
  - **Validation:** `open-tasks store "test" --token t1` creates file and reference
  - **Dependency:** Task 3.1, 2.2, 2.3

- [ ] **Task 4.2: Implement load command**
  - Create `src/commands/load.ts`
  - Accept filepath as positional argument
  - Read file content (text and binary)
  - Support --token flag
  - Handle file not found errors
  - **Validation:** `open-tasks load ./file.txt` loads file content
  - **Dependency:** Task 3.1, 2.2, 2.3

- [ ] **Task 4.3: Implement replace command**
  - Create `src/commands/replace.ts`
  - Accept template string as first argument
  - Support multiple --ref flags
  - Implement {{token}} replacement logic
  - Handle missing references
  - Support named token matching
  - **Validation:** `open-tasks replace "{{t1}} World" --ref t1` performs substitution
  - **Dependency:** Task 3.1, 2.2, 2.3, 4.1

- [ ] **Task 4.4: Implement powershell command**
  - Create `src/commands/powershell.ts`
  - Accept PowerShell script as first argument
  - Support --ref flags for script substitution
  - Execute using child_process
  - Capture stdout and stderr
  - Handle exit codes and errors
  - **Validation:** `open-tasks powershell "Get-Date"` executes and captures output
  - **Dependency:** Task 3.1, 2.2, 2.3, 4.3

- [ ] **Task 4.5: Implement ai-cli command**
  - Create `src/commands/ai-cli.ts`
  - Load configuration from `.open-tasks/ai-config.json`
  - Accept prompt as first argument
  - Support multiple --ref flags for context files
  - Build CLI command with context files
  - Execute subprocess with timeout
  - Handle configuration missing error
  - **Validation:** With config file, `open-tasks ai-cli "test"` executes AI CLI
  - **Dependency:** Task 3.1, 2.2, 2.3, 4.4

- [ ] **Task 4.6: Implement extract command**
  - Create `src/commands/extract.ts`
  - Accept regex pattern as first argument
  - Require --ref flag for input
  - Implement regex matching with capture groups
  - Support --all flag for multiple matches
  - Handle invalid regex errors
  - **Validation:** `open-tasks extract "\d+" --ref t1` extracts numbers
  - **Dependency:** Task 3.1, 2.2, 2.3, 4.1

### Phase 5: CLI Integration and Error Handling

- [ ] **Task 5.1: Integrate commands with CLI**
  - Update `src/index.ts` to register all commands
  - Implement command invocation flow
  - Parse common flags: --token, --ref, --help
  - Route to appropriate command handler
  - **Validation:** All commands are accessible via CLI
  - **Dependency:** Task 3.5, Phase 4 complete

- [ ] **Task 5.2: Implement global error handling**
  - Wrap command execution in try-catch
  - Format errors consistently
  - Write error files with full context
  - Display helpful error messages
  - Set proper exit codes
  - **Validation:** Forced error creates .error file and displays message
  - **Dependency:** Task 2.3, 2.4

- [ ] **Task 5.3: Implement help system**
  - Generate help text from command metadata
  - Display command list in --help
  - Display command-specific help for each command
  - Include usage examples
  - **Validation:** `open-tasks --help` and `open-tasks store --help` display correct info
  - **Dependency:** Task 5.1

- [ ] **Task 5.4: Implement configuration loading**
  - Create `src/config-loader.ts`
  - Load from `.open-tasks/config.json` (project)
  - Load from `~/.open-tasks/config.json` (user)
  - Merge with defaults
  - Make available in execution context
  - **Validation:** Config values are loaded and accessible
  - **Dependency:** Task 3.5

### Phase 6: Testing

- [ ] **Task 6.1: Write unit tests for core classes**
  - Test ReferenceManager (create, get, collision)
  - Test OutputHandler (file creation, naming)
  - Test CommandRouter (routing, unknown commands)
  - Test CommandLoader (discovery, registration)
  - **Validation:** `npm test` passes all unit tests
  - **Dependency:** Phase 2, 3 complete

- [ ] **Task 6.2: Write integration tests for built-in commands**
  - Test each command with various arguments
  - Test reference passing between commands
  - Test error conditions
  - Test token and UUID reference creation
  - **Validation:** `npm test` passes all integration tests
  - **Dependency:** Phase 4 complete

- [ ] **Task 6.3: Write end-to-end tests**
  - Test full command chains
  - Test custom command loading
  - Test output file creation
  - Test terminal output formatting (snapshot tests)
  - **Validation:** E2E tests pass
  - **Dependency:** Phase 5 complete

- [ ] **Task 6.4: Test error scenarios**
  - Test missing files
  - Test invalid arguments
  - Test missing references
  - Test command failures
  - Test timeout scenarios
  - **Validation:** All error paths are tested
  - **Dependency:** Task 5.2

### Phase 7: Documentation and Examples

- [ ] **Task 7.1: Write README.md**
  - Installation instructions (npm global and local)
  - Quick start guide
  - Command reference for all built-in commands
  - Configuration documentation
  - Examples of common workflows
  - **Validation:** README is complete and accurate

- [ ] **Task 7.2: Create custom command template**
  - Create `templates/example-command.ts`
  - Include fully documented boilerplate
  - Explain each part with comments
  - Provide working example
  - **Validation:** Template can be copied and used as-is

- [ ] **Task 7.3: Write custom command guide**
  - Document CommandHandler interface
  - Explain discovery mechanism
  - Show complete examples
  - Document best practices
  - Explain access to shared services
  - **Validation:** Developer can create custom command from guide

- [ ] **Task 7.4: Create usage examples**
  - Document 5-10 real-world workflows
  - Show command chaining
  - Demonstrate AI CLI integration
  - Include PowerShell integration examples
  - **Validation:** Examples are tested and work correctly

- [ ] **Task 7.5: Write AI CLI configuration guide**
  - Document ai-config.json schema
  - Provide examples for common AI CLIs (Copilot, etc.)
  - Explain context file passing
  - Document timeout and error handling
  - **Validation:** Users can configure AI CLI from guide

### Phase 8: Polish and Release Preparation

- [ ] **Task 8.1: Add structured output modes**
  - Implement --json flag for JSON output
  - Implement --quiet flag for minimal output
  - Implement --verbose flag for detailed output
  - Test each mode
  - **Validation:** Each flag produces correct output format
  - **Dependency:** Task 5.1

- [ ] **Task 8.2: Optimize performance**
  - Profile command execution
  - Optimize file I/O operations
  - Cache custom command modules
  - Minimize startup time
  - **Validation:** CLI starts in < 200ms, commands execute efficiently

- [ ] **Task 8.3: Cross-platform testing**
  - Test on Windows (PowerShell)
  - Test on macOS (zsh/bash)
  - Test on Linux (bash)
  - Verify file path handling
  - Verify color output
  - **Validation:** CLI works on all platforms

- [ ] **Task 8.4: Security review**
  - Audit command injection risks in powershell command
  - Review file access restrictions
  - Check for path traversal vulnerabilities
  - Validate input sanitization
  - **Validation:** No security issues identified

- [ ] **Task 8.5: Prepare for npm publish**
  - Verify package.json metadata
  - Add LICENSE file
  - Add .npmignore
  - Test package installation from tarball
  - Verify bin script works after install
  - **Validation:** `npm pack && npm install -g <tarball>` works

## Dependency Graph

```
Phase 1 (Setup)
├── 1.1 → 1.2 → 1.3 → 1.4

Phase 2 (Reference & Output)
├── 2.1 → 2.2, 2.3
├── 2.4 → 2.5

Phase 3 (Command Infra)
├── 2.1 → 3.1 → 3.2 → 3.3 → 3.4
├── 2.2, 2.3, 3.1 → 3.5

Phase 4 (Commands)
├── 3.1, 2.2, 2.3 → 4.1 → 4.3 → 4.4 → 4.5
├── 3.1, 2.2, 2.3 → 4.2
├── 4.1, 4.3 → 4.6

Phase 5 (Integration)
├── 3.5, Phase 4 → 5.1 → 5.3
├── 2.3, 2.4 → 5.2
├── 3.5 → 5.4

Phase 6 (Testing)
├── Phase 2, 3 → 6.1
├── Phase 4 → 6.2
├── Phase 5 → 6.3
├── 5.2 → 6.4

Phase 7 (Docs)
├── Phase 5 → 7.1, 7.2, 7.3, 7.4, 7.5

Phase 8 (Polish)
├── 5.1 → 8.1
├── Phase 6 → 8.2, 8.3, 8.4
├── Phase 7 → 8.5
```

## Parallel Work Opportunities

- **Phase 2 and 3** can be partially parallelized after Task 2.1
- **Phase 4** commands can be implemented in parallel (4.1, 4.2 independent)
- **Phase 7** documentation can start after Phase 5 (no need to wait for testing)
- **Testing** can be written alongside implementation

## Estimated Effort

- **Phase 1:** 2-4 hours
- **Phase 2:** 4-6 hours
- **Phase 3:** 6-8 hours
- **Phase 4:** 8-12 hours
- **Phase 5:** 4-6 hours
- **Phase 6:** 8-10 hours
- **Phase 7:** 6-8 hours
- **Phase 8:** 4-6 hours

**Total:** 42-60 hours (approximately 1-1.5 weeks full-time)

## Success Metrics

- [ ] All 6 built-in commands work correctly
- [ ] Custom commands can be added and discovered
- [ ] Command chaining with references works
- [ ] Output files follow naming convention
- [ ] Terminal output uses colors correctly
- [ ] Error handling is robust and informative
- [ ] Test coverage > 80%
- [ ] Documentation is complete
- [ ] CLI can be installed via npm
- [ ] Works on Windows, macOS, and Linux
