# Change Proposal: Add Command Output Control

**Change ID:** `add-command-output-control`  
**Created:** 2025-10-18  
**Status:** Draft

## Summary

Enhance the CLI command system with flexible output control features including verbosity levels, summary views, and output redirection options. This allows users to control how command execution results are displayed and saved, from minimal quiet mode to detailed verbose modes.

**Key Features:**
1. **Verbosity Levels**: `--quiet`, `--summary` (default), `--verbose`
2. **Command-Level Defaults**: Commands can specify preferred verbosity via constructor enum
3. **Output Redirection**: `--log-only`, `--screen-only`, `--both` (default), `--file <path>`
4. **Summary Views**: Consistent formatted summaries with execution time, output location, and reference tokens
5. **Hierarchical Control**: CLI flags override command defaults, which override application defaults

## Motivation

Currently, all commands output directly to console with inconsistent formatting and no control over verbosity or destination. Users need:
- **Quiet mode** for CI/CD pipelines and scripting
- **Verbose mode** for debugging and understanding long-running operations
- **Output redirection** for integration with other tools
- **Consistent summaries** across all commands for predictable parsing

The current `ExecutionContext` and `CommandHandler` architecture provides no standardized way to:
- Control output verbosity per command
- Allow commands to specify their preferred output style
- Format consistent summaries with timing information
- Redirect output to different destinations

Commands should be able to declare their preferred verbosity level (e.g., a data processing command might default to verbose), while users can override this preference via CLI flags.

## Goals

1. **Verbosity Control**: Support 3 levels (quiet, summary, verbose) with hierarchical resolution
2. **Command Defaults**: Allow commands to specify preferred verbosity via constructor enum
3. **CLI Override**: Application-level flags override command preferences
4. **Output Builders**: Introduce `IOutputBuilder` abstraction for constructing formatted output
5. **Summary Format**: Standardize summary output with command name, execution time, output file, reference token
6. **Output Redirection**: Support screen-only, log-only, both, and custom file destinations
7. **Backward Compatibility**: Maintain existing command behavior as default (summary mode)
8. **ExecutionContext Extension**: Add output control properties without breaking existing code
9. **CommandHandler Enhancement**: Add timing, output building, and summary formatting capabilities

## Non-Goals

- Custom output templates or theming (can be added later)
- Output filtering or searching capabilities
- Integration with external logging systems (beyond file writing)
- Performance monitoring dashboards (only execution time tracking)
- Binary output format support (text-only)

## Affected Capabilities

This change introduces one new capability:

### **command-output-control**
Manages command execution output formatting, verbosity control, and destination routing.

**Related To:**
- `command-builtins` (MODIFIED): Built-in commands updated to use output builders
- `command-lifecycle` (MODIFIED): Command execution enhanced with timing and output handling
- `output-formatting` (MODIFIED): Formatters extended for new output modes

## Impact Assessment

### User Impact
- **Positive**: Better control over CLI output, improved CI/CD integration, enhanced debugging
- **Breaking**: None - default behavior preserved
- **Migration**: Optional - commands work without changes, gradual adoption encouraged

### System Impact
- **Performance**: Minimal - output building overhead negligible
- **Complexity**: Medium - adds abstraction layer but follows existing patterns
- **Testing**: Requires new tests for each verbosity mode and output destination

## Open Questions

1. Should streaming mode buffer output or write immediately? *(Recommendation: Write immediately for true streaming)*
2. Should verbosity be inheritable in nested command calls? *(Recommendation: Yes, pass through ExecutionContext)*
3. Should output builders support custom formatters (JSON, XML)? *(Recommendation: Later - start with text only)*
4. Should there be size limits on verbose output? *(Recommendation: Yes, configurable per command)*

## Alternatives Considered

### Alternative 1: Simple Console.log Wrappers
**Rejected**: Too simplistic, doesn't provide structured output or summaries

### Alternative 2: External Logging Library (Winston, Bunyan)
**Rejected**: Overkill for CLI needs, adds unnecessary dependency

### Alternative 3: Separate Output Command
**Rejected**: Doesn't integrate naturally with command execution flow

## Dependencies

- Depends on: `command-lifecycle` (existing)
- Depends on: `output-formatting` (existing)
- Blocks: None
- Blocked by: None

## References

- Feature specification document: `command-output-features.md`
- Current ExecutionContext: `src/types.ts`
- Current OutputHandler: `src/types.ts`
- Current formatters: `src/formatters.ts`
