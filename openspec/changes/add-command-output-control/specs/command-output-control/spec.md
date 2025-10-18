# Capability Specification: Command Output Control

**Capability ID:** `command-output-control`  
**Version:** 1.0.0  
**Status:** Draft

## Overview

Provides standardized output control for CLI command execution, including verbosity levels, output destination routing, and formatted summaries with execution timing.

## ADDED Requirements

### Requirement: Multiple Verbosity Levels

The system MUST support four verbosity levels for command output:
- `quiet`: Minimal output (success/failure + time only)
- `summary`: Default formatted summary (command, time, file, reference)
- `verbose`: Detailed output with progress and metadata
- `stream`: Real-time streaming output during execution

**ID:** COC-001  
**Priority:** High

#### Scenario: User runs command in quiet mode
**Given** a user executes a command with `--quiet` flag  
**When** the command completes successfully  
**Then** only a single line summary is displayed: "✓ command-name completed in Xms"  
**And** no detailed output or file paths are shown

#### Scenario: User runs command in verbose mode
**Given** a user executes a command with `--verbose` flag  
**When** the command processes data  
**Then** progress updates are displayed during execution  
**And** detailed metadata is included in the final summary  
**And** execution timing for each step is shown

#### Scenario: User runs command with default verbosity
**Given** a user executes a command without verbosity flags  
**When** the command completes  
**Then** a formatted summary is displayed with command name, execution time, output file path, and reference token  
**And** the output matches current behavior (backward compatible)

 ### Requirement: Output Destination Control

The system MUST support routing command output to different destinations:
- `screen-only`: Display on terminal only
- `log-only`: Write to file only  
- `both`: Display and write to file (default)
- `file <path>`: Write to custom file location

**ID:** COC-002  
**Priority:** High

#### Scenario: User outputs to screen only
**Given** a user executes a command with `--screen-only` flag  
**When** the command generates output  
**Then** the output is displayed on the terminal  
**And** no output files are created in the output directory

#### Scenario: User outputs to log file only
**Given** a user executes a command with `--log-only` flag  
**When** the command generates output  
**Then** the output is written to the default output directory  
**And** nothing is displayed on the terminal

#### Scenario: User specifies custom output file
**Given** a user executes a command with `--file /custom/path.txt` flag  
**When** the command generates output  
**Then** the output is written to /custom/path.txt  
**And** the summary is displayed on the terminal

### Requirement: Output Builder Abstraction

The system MUST provide an `IOutputBuilder` interface for constructing formatted output with implementations for each verbosity level.

**ID:** COC-003  
**Priority:** High

#### Scenario: Command uses output builder for quiet mode
**Given** a command execution with quiet verbosity  
**When** the command creates an output builder  
**Then** a QuietOutputBuilder instance is provided  
**And** only essential sections are included in the output  
**And** the builder produces a single line summary

#### Scenario: Command adds sections to verbose builder
**Given** a command execution with verbose verbosity  
**When** the command adds multiple sections via `addSection()`  
**Then** each section is included in the final output  
**And** sections are formatted with headers and content  
**And** the builder produces detailed multi-line output

### Requirement: Execution Time Tracking

The system MUST automatically track command execution time and include it in output summaries.

**ID:** COC-004  
**Priority:** High

#### Scenario: Command execution timing is tracked
**Given** a command begins execution  
**When** the command processing takes 245ms  
**Then** the execution time is automatically calculated  
**And** the summary displays "completed in 245ms"  
**And** timing is accurate within 10ms

#### Scenario: Long-running command shows progress time
**Given** a command execution with stream verbosity  
**When** the command runs for more than 1 second  
**Then** intermediate progress messages include elapsed time  
**And** the final summary shows total execution time

### Requirement: Standardized Summary Format

The system MUST provide a consistent summary format across all commands including: command name, execution time, output file path, and reference token.

**ID:** COC-005  
**Priority:** Medium

#### Scenario: Successful command shows standard summary
**Given** a command completes successfully  
**When** the summary is displayed  
**Then** it includes "✓ command-name completed in Xms"  
**And** it includes "📁 Saved to: <path>" if a file was created  
**And** it includes "🔗 Reference: @<token>" if a reference was created  
**And** the format is consistent across all commands

#### Scenario: Failed command shows error summary
**Given** a command fails with an error  
**When** the summary is displayed  
**Then** it includes "✗ command-name failed in Xms"  
**And** it includes the error message  
**And** it includes "📁 Error log: <path>" if an error file was created

### Requirement: Verbosity Hierarchy

The system MUST resolve verbosity from: command-level override → global application default → hardcoded default (summary).

**ID:** COC-006  
**Priority:** Medium

#### Scenario: Command-level override takes precedence
**Given** the global verbosity is set to 'verbose'  
**When** a command is executed with '--quiet' flag  
**Then** the command uses quiet verbosity  
**And** other commands still use verbose verbosity

#### Scenario: Global default is used when no override
**Given** the global verbosity is set to 'verbose' via CLI or config  
**When** a command is executed without verbosity flags  
**Then** the command uses verbose verbosity  
**And** detailed output is displayed

#### Scenario: Hardcoded default when nothing specified
**Given** no global verbosity is configured  
**When** a command is executed without verbosity flags  
**Then** the command uses 'summary' verbosity  
**And** the standard summary format is displayed

### Requirement: Real-time Streaming Output

The system MUST support streaming output for long-running commands, displaying progress updates in real-time.

**ID:** COC-007  
**Priority:** Medium

#### Scenario: Streaming command shows real-time progress
**Given** a command is executed with '--stream' flag  
**When** the command processes data incrementally  
**Then** progress updates are displayed immediately without buffering  
**And** each progress update includes a timestamp or elapsed time  
**And** the terminal updates dynamically

#### Scenario: Streaming completes with final summary
**Given** a streaming command is running  
**When** the command completes all processing  
**Then** a final summary is displayed  
**And** the summary includes total execution time  
**And** the summary includes total items processed

### Requirement: ExecutionContext Extension

The system MUST extend ExecutionContext interface with verbosity and output target properties without breaking existing code.

**ID:** COC-008  
**Priority:** High

#### Scenario: New context properties are accessible
**Given** a command receives an ExecutionContext  
**When** the command accesses context.verbosity  
**Then** the verbosity level is available ('quiet' | 'summary' | 'verbose' | 'stream')  
**And** the command accesses context.outputTarget  
**And** the output target is available ('screen-only' | 'log-only' | 'both' | 'file')

#### Scenario: Existing commands work with extended context
**Given** an existing command that doesn't use new properties  
**When** the command is executed with the extended ExecutionContext  
**Then** the command executes successfully  
**And** no runtime errors occur  
**And** the command behaves as before (backward compatible)

### Requirement: Custom Output Path Sanitization

The system MUST validate and sanitize custom output file paths to prevent directory traversal attacks and respect filesystem permissions.

**ID:** COC-009  
**Priority:** High

#### Scenario: Directory traversal is prevented
**Given** a user specifies `--file ../../../etc/passwd`  
**When** the system validates the output path  
**Then** the path is rejected as invalid  
**And** an error message is displayed  
**And** no file is written outside the allowed directory

#### Scenario: Valid custom path is accepted
**Given** a user specifies `--file ./custom/output.txt`  
**When** the system validates the output path  
**Then** the path is accepted  
**And** the output directory is created if needed  
**And** the file is written to the specified location

## Integration Points

### With `command-lifecycle`
- CommandHandler base class enhanced with timing and output building
- Execute method wraps command logic with timing and output handling
- Error handling integrated with output builders

### With `output-formatting`
- Formatters extended to support new output modes
- Color/emoji support maintained in summary format
- Backward compatible with existing formatters

### With `command-builtins`
- Built-in commands updated to use output builders
- Migration path documented for custom commands
- Templates updated to show new patterns

## Performance Requirements

- Output builder overhead MUST be <1ms per command
- File I/O performance MUST match current OutputHandler
- Streaming mode MUST output within 50ms of progress update
- Memory usage MUST remain constant for streaming (no buffering)

## Backward Compatibility

- All existing commands MUST work without modification
- Default behavior MUST match current behavior (summary mode, both target)
- ExecutionContext extension MUST not break existing code
- CLI flags MUST be optional (defaults preserve current behavior)

## Testing Requirements

- Unit tests for each OutputBuilder implementation
- Integration tests for each verbosity level
- End-to-end tests for output destination routing
- Backward compatibility tests for existing commands
- Performance tests for output builder overhead
- Security tests for path validation

## Dependencies

- Requires: `command-lifecycle` capability
- Requires: `output-formatting` capability
- Extends: ExecutionContext interface
- Extends: CommandHandler base class
- Extends: OutputHandler class

## Future Enhancements

- Custom output templates (JSON, XML, YAML)
- Progress bars for long operations
- Output filtering and searching
- Integration with external logging systems
- Performance monitoring dashboards
