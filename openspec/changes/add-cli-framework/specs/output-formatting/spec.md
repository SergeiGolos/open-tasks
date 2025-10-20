# Output Formatting Specification

**Capability ID:** `output-formatting`  
**Version:** 1.0.0  
**Status:** Draft

## Overview

The Output Formatting capability defines how command outputs are formatted for terminal display and written to files. It includes color coding, progress indicators, and structured output formatting to provide clear visual feedback to users.

---

## ADDED Requirements

### Requirement: Terminal Color Coding

The CLI MUST use colors to distinguish different types of terminal output.

**Priority:** High  
**Type:** Functional

#### Scenario: Display command invocation

**Given** the user invokes a command  
**When** the CLI echoes the command  
**Then** the command name should be displayed in cyan  
**And** the arguments should be displayed in the default color  
**And** the output should be visually distinct

#### Scenario: Display reference tokens

**Given** a command creates a reference  
**When** the reference ID is displayed  
**Then** tokens should be displayed in yellow  
**And** UUIDs should be displayed in dim yellow  
**And** the reference type should be clear

#### Scenario: Display success messages

**Given** a command completes successfully  
**When** the completion message is displayed  
**Then** the success indicator (✓) should be green  
**And** the message should be clear and positive

#### Scenario: Display error messages

**Given** a command fails  
**When** the error is displayed  
**Then** the error indicator (✗) should be red  
**And** the error message should be in red  
**And** the stack trace should be in dim red  
**And** the output should clearly indicate failure

#### Scenario: Display info messages

**Given** the CLI provides informational output  
**When** info messages are displayed  
**Then** they should be in blue  
**And** include contextual information  
**And** be distinguishable from command output

#### Scenario: Respect NO_COLOR environment variable

**Given** the environment variable NO_COLOR is set  
**When** the CLI runs  
**Then** no color codes should be output  
**And** all text should be plain  
**And** formatting should use ASCII characters only

---

### Requirement: Progress Indicators

The CLI MUST display progress indicators during long-running operations.

**Priority:** Medium  
**Type:** Functional

#### Scenario: Display spinner during execution

**Given** a command is executing  
**And** the command takes more than 500ms  
**When** the command is in progress  
**Then** a spinner should be displayed  
**And** update at least every 100ms  
**And** show the command name next to the spinner

#### Scenario: Clear spinner on completion

**Given** a spinner is displayed  
**When** the command completes  
**Then** the spinner should be cleared  
**And** replaced with a completion message  
**And** the line should be finalized

#### Scenario: No spinner for fast commands

**Given** a command executes  
**When** the command completes in under 500ms  
**Then** no spinner should be displayed  
**And** only the result should be shown  
**And** avoid flicker in the terminal

#### Scenario: Progress with percentage

**Given** a command reports progress  
**When** progress updates are available  
**Then** the percentage should be displayed  
**And** update in place without creating new lines  
**And** show estimated time remaining if available

---

### Requirement: Output File Formatting

Command outputs written to files MUST be formatted consistently.

**Priority:** High  
**Type:** Functional

#### Scenario: Write plain text output

**Given** a command produces text output  
**When** the output is written to a file  
**Then** the file should contain the raw text  
**And** preserve all whitespace and newlines  
**And** use UTF-8 encoding

#### Scenario: Write JSON output

**Given** a command produces JSON data  
**When** the output is written to a file  
**Then** the JSON should be pretty-printed  
**And** use 2-space indentation  
**And** the file should have `.json` extension

#### Scenario: Write binary output

**Given** a command produces binary data  
**When** the output is written to a file  
**Then** the data should be written as-is  
**And** no text encoding should be applied  
**And** the file should preserve exact bytes

#### Scenario: Include metadata in output files

**Given** a command produces output  
**When** the output file is created  
**Then** a metadata header should be written (as comment)  
**And** include timestamp, command name, and arguments  
**And** the metadata should not interfere with data parsing

---

### Requirement: Error Output Formatting

Error outputs MUST be formatted for clarity and actionability.

**Priority:** High  
**Type:** Functional

#### Scenario: Format error message

**Given** a command fails  
**When** the error is displayed  
**Then** the error type should be shown (e.g., "ValidationError")  
**And** the error message should be clear  
**And** the context should be included (command, args)  
**And** related information should be grouped

#### Scenario: Format error file

**Given** a command fails  
**When** the error file is created  
**Then** the file should include timestamp  
**And** include command name and arguments  
**And** include the full error message  
**And** include the stack trace  
**And** include system information (Node version, OS)

#### Scenario: Display error with suggestions

**Given** a command fails with a known error type  
**When** the error is displayed  
**Then** helpful suggestions should be included  
**And** examples of correct usage should be shown  
**And** links to documentation should be provided

---

### Requirement: Structured Output

The CLI MUST support structured output formats for programmatic consumption.

**Priority:** Medium  
**Type:** Functional

#### Scenario: JSON output mode

**Given** the user enables JSON mode  
**When** the user runs `open-tasks <command> --json`  
**Then** all output should be in JSON format  
**And** include success/failure status  
**And** include reference data  
**And** include no color codes or formatting

#### Scenario: Quiet mode

**Given** the user enables quiet mode  
**When** the user runs `open-tasks <command> --quiet`  
**Then** only essential output should be displayed  
**And** no progress indicators should be shown  
**And** only errors and final results should appear

#### Scenario: Verbose mode

**Given** the user enables verbose mode  
**When** the user runs `open-tasks <command> --verbose`  
**Then** detailed execution information should be displayed  
**And** include timing for each step  
**And** include internal operations  
**And** include resolved references

---

### Requirement: Output Grouping

Related output MUST be visually grouped for better readability.

**Priority:** Low  
**Type:** Functional

#### Scenario: Group multi-command output

**Given** the user runs multiple commands  
**When** all commands complete  
**Then** each command's output should be grouped  
**And** separated by visual dividers  
**And** command names should be headers

#### Scenario: Indent nested output

**Given** a command produces nested information  
**When** the output is displayed  
**Then** nested items should be indented  
**And** use consistent indentation (2 spaces)  
**And** maintain visual hierarchy

---

### Requirement: File Output Metadata

Output files MUST include metadata for traceability.

**Priority:** Medium  
**Type:** Functional

#### Scenario: Include metadata header

**Given** a command writes an output file  
**When** the file is created  
**Then** the first lines should contain metadata  
**And** be formatted as comments appropriate to file type  
**And** include: timestamp, command, arguments, reference ID

#### Scenario: Metadata for text files

**Given** the output is a text file  
**When** metadata is written  
**Then** it should use `# ` as comment prefix  
**And** be followed by a blank line before content

#### Scenario: Metadata for JSON files

**Given** the output is a JSON file  
**When** metadata is written  
**Then** it should be in a `_metadata` property at the root  
**And** the actual content should be in a `content` property  
**And** the JSON should remain valid

---

### Requirement: Terminal Width Adaptation

Output MUST adapt to the terminal width for better readability.

**Priority:** Low  
**Type:** Functional

#### Scenario: Wrap long lines

**Given** the terminal has a specific width  
**When** output lines exceed the width  
**Then** lines should wrap at word boundaries  
**And** maintain readability  
**And** not break in the middle of tokens

#### Scenario: Truncate in narrow terminals

**Given** the terminal is very narrow (< 60 columns)  
**When** long content is displayed  
**Then** content should be truncated with ellipsis  
**And** essential information should remain visible  
**And** indicate that truncation occurred

---

## Output Examples

### Successful Command

```
$ open-tasks store "Hello World" --token greeting
✓ Stored reference: greeting
  File: .open-tasks/outputs/20251017-143000-001-greeting.txt
```

### Failed Command

```
$ open-tasks load ./missing.txt
✗ Error: File not found
  Path: ./missing.txt
  Command: load
  
  Suggestion: Check the file path and try again.
  Error file: .open-tasks/outputs/20251017-143100-001-error.error
```

### Command with Progress

```
$ open-tasks ai-cli "Explain this code" --ref codebase
⠋ Executing ai-cli... (3s)
✓ AI response received
  Reference: a7f3c2d1-9b8e-4f5a-8c9d-1e2f3a4b5c6d
  File: .open-tasks/outputs/20251017-143200-001-a7f3c2d1-9b8e-4f5a-8c9d-1e2f3a4b5c6d.txt
```

### Verbose Output

```
$ open-tasks replace "{{name}} is awesome" --ref name --verbose
→ Command: replace
→ Arguments: ["{{name}} is awesome"]
→ References: ["name"]
→ Resolving reference: name
  ✓ Resolved: name → "Alice"
→ Template: "{{name}} is awesome"
→ Performing replacement...
  ✓ Result: "Alice is awesome"
→ Writing output file...
  ✓ File: .open-tasks/outputs/20251017-143300-001-b8c9d1e2-3f4a-5b6c-7d8e-9f1a2b3c4d5e.txt
✓ Reference created: b8c9d1e2-3f4a-5b6c-7d8e-9f1a2b3c4d5e
```

### JSON Output

```json
{
  "success": true,
  "command": "store",
  "reference": {
    "id": "greeting",
    "timestamp": "2025-10-17T14:30:00.001Z",
    "outputFile": ".open-tasks/outputs/20251017-143000-001-greeting.txt"
  },
  "duration": 5
}
```

---

## File Output Template

### Text File with Metadata

```
# @bitcobblers/open-tasks output
# Command: store
# Arguments: ["Hello World"]
# Reference: greeting
# Timestamp: 2025-10-17T14:30:00.001Z

Hello World
```

### JSON File with Metadata

```json
{
  "_metadata": {
    "command": "store",
    "arguments": ["Hello World"],
    "reference": "greeting",
    "timestamp": "2025-10-17T14:30:00.001Z"
  },
  "content": "Hello World"
}
```

### Error File

```
# @bitcobblers/open-tasks error
# Command: load
# Arguments: ["./missing.txt"]
# Timestamp: 2025-10-17T14:31:00.001Z
# Node: v18.17.0
# OS: Windows 10

Error: File not found
  at LoadCommand.execute (load.ts:45:13)
  at CommandRouter.route (router.ts:89:22)
  ...

Context:
  - Working directory: C:\Users\user\project
  - Output directory: .open-tasks/outputs
  - File path: ./missing.txt
```

---

## Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Commands | Cyan | Command names in output |
| References | Yellow | Token and UUID display |
| Success | Green | Success indicators (✓) |
| Error | Red | Error messages and indicators (✗) |
| Info | Blue | Informational messages |
| Warning | Yellow | Warning messages |
| Dim | Gray | Secondary information |
| Default | White | Regular output |

---

## Technical Implementation

### Libraries

- **chalk**: Terminal colors and styling
- **ora**: Spinner and progress indicators
- **cli-table3**: Table formatting (if needed)
- **wrap-ansi**: Text wrapping with ANSI support
- **terminal-size**: Detect terminal dimensions

### Configuration Options

```json
{
  "output": {
    "colors": true,
    "unicode": true,
    "timestamp": "ISO",
    "verbose": false,
    "quiet": false,
    "json": false,
    "metadata": true
  }
}
```

---

## Technical Constraints

- Color codes should use ANSI escape sequences
- Respect TTY detection (no colors if stdout is not a TTY)
- Support Windows console color codes
- Maximum line length: Adapt to terminal width (default 80)
- Progress updates: Minimum 100ms interval to avoid flicker

---

## Performance Considerations

- Color codes add minimal overhead (< 1ms per line)
- Progress indicators update efficiently (throttled to 100ms)
- Large outputs are streamed (not loaded entirely in memory)
- File writes are buffered (flush after 64KB or on completion)
