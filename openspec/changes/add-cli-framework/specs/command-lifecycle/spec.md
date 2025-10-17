# Command Lifecycle Specification

**Capability ID:** `command-lifecycle`  
**Version:** 1.0.0  
**Status:** Draft

## Overview

The Command Lifecycle capability defines how commands are executed asynchronously, how outputs are managed, and how references are created and resolved throughout the execution chain.

---

## ADDED Requirements

### Requirement: Async Command Execution

All commands MUST execute asynchronously and return a Promise that resolves to a ReferenceHandle.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Execute command asynchronously

**Given** a user invokes a command  
**When** the command handler's execute method is called  
**Then** the execution should return a Promise immediately  
**And** the command should run asynchronously without blocking  
**And** the CLI should display a progress indicator during execution

#### Scenario: Command completes successfully

**Given** a command is executing  
**When** the command completes without errors  
**Then** the Promise should resolve with a ReferenceHandle  
**And** the reference should contain the command output  
**And** the reference should include a timestamp  
**And** the reference should include the output file path

#### Scenario: Command fails with error

**Given** a command is executing  
**When** the command encounters an error  
**Then** the Promise should reject with an error object  
**And** the error should include the command name and arguments  
**And** the error details should be written to an `.error` file  
**And** the CLI should halt further execution

---

### Requirement: Reference Management

The system MUST manage references to command outputs using UUID-based or token-based identifiers.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Create reference with UUID

**Given** a command completes successfully  
**And** no token is provided by the user  
**When** the output handler creates a reference  
**Then** a UUID should be generated as the reference ID  
**And** the reference should be stored in memory  
**And** the UUID should be displayed to the user

#### Scenario: Create reference with user token

**Given** a command completes successfully  
**And** the user provided `--token mydata`  
**When** the output handler creates a reference  
**Then** "mydata" should be used as the reference ID  
**And** the reference should be stored in memory  
**And** the token should be displayed to the user

#### Scenario: Resolve reference by token

**Given** a command requires a reference  
**And** the user provided `--ref mydata`  
**When** the CLI resolves references before execution  
**Then** the reference manager should look up "mydata"  
**And** return the associated ReferenceHandle  
**And** the command should receive the referenced content

#### Scenario: Resolve non-existent reference

**Given** a command requires a reference  
**And** the user provided `--ref unknown`  
**When** the CLI attempts to resolve references  
**Then** the reference manager should fail to find "unknown"  
**And** the CLI should display an error message  
**And** list available references  
**And** exit without executing the command

#### Scenario: Reference collision with token

**Given** a reference with token "mydata" exists  
**When** the user creates a new reference with `--token mydata`  
**Then** the CLI should display a warning  
**And** overwrite the existing reference  
**And** log the collision in the output file

---

### Requirement: In-Memory Storage

References MUST be stored in memory during a command execution session.

**Priority:** High  
**Type:** Functional

#### Scenario: Store reference in memory

**Given** a command creates output  
**When** a reference is created  
**Then** the content should be stored in a memory map  
**And** the reference ID should be the map key  
**And** the ReferenceHandle should be the map value

#### Scenario: Access reference across commands

**Given** a first command created a reference "ref1"  
**And** "ref1" is stored in memory  
**When** a second command uses `--ref ref1`  
**Then** the reference manager should retrieve "ref1" from memory  
**And** pass its content to the second command

#### Scenario: Memory cleanup after execution

**Given** a command chain completes  
**When** the CLI process exits  
**Then** all in-memory references should be cleared  
**And** only file outputs should persist

---

### Requirement: Output File Creation

All command outputs MUST be written to timestamped files in the output directory.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Write output with token

**Given** a command completes with output  
**And** the user provided `--token mydata`  
**When** the output handler writes the file  
**Then** the filename should follow pattern `YYYYMMDD-HHmmss-SSS-mydata.txt`  
**And** the file should be created in `.open-tasks/outputs/`  
**And** the file should contain the command output

#### Scenario: Write output without token

**Given** a command completes with output  
**And** no token was provided  
**When** the output handler writes the file  
**Then** the filename should follow pattern `YYYYMMDD-HHmmss-SSS-{uuid}.txt`  
**And** the file should be created in `.open-tasks/outputs/`  
**And** the file should contain the command output

#### Scenario: Create output directory if missing

**Given** the `.open-tasks/outputs/` directory does not exist  
**When** the first command produces output  
**Then** the output handler should create the directory  
**And** create all parent directories as needed  
**And** write the output file successfully

#### Scenario: Write error file

**Given** a command fails with an error  
**When** the error handler processes the error  
**Then** an error file should be created with `.error` extension  
**And** the filename should include the timestamp  
**And** the file should contain the error message, stack trace, and command context

---

### Requirement: Progress Feedback

The CLI MUST provide visual feedback during command execution.

**Priority:** Medium  
**Type:** Functional

#### Scenario: Display progress during execution

**Given** a long-running command is executing  
**When** the command is in progress  
**Then** the CLI should display a spinner or progress indicator  
**And** update the display until completion  
**And** clear the indicator when done

#### Scenario: Display completion status

**Given** a command completes  
**When** the command succeeds  
**Then** the CLI should display a success indicator (✓)  
**And** show the reference ID or token  
**And** show the output file path

#### Scenario: Display error status

**Given** a command fails  
**When** the command errors  
**Then** the CLI should display an error indicator (✗)  
**And** show a formatted error message  
**And** show the error file path

---

### Requirement: Command Chaining

Users MUST be able to chain multiple commands where outputs of one command become inputs to the next.

**Priority:** High  
**Type:** Functional

#### Scenario: Chain two commands with explicit reference

**Given** the first command creates reference "step1"  
**When** the user runs a second command with `--ref step1`  
**Then** the second command should receive the output from "step1"  
**And** both commands should execute in sequence  
**And** each should create its own output file

#### Scenario: Chain multiple commands

**Given** the user runs three commands in sequence  
**And** each command references the previous command's output  
**When** all commands execute  
**Then** references should be resolved in order  
**And** each command should wait for the previous to complete  
**And** all outputs should be timestamped chronologically

---

### Requirement: Reference Handle Structure

References MUST follow a consistent structure with all required metadata.

**Priority:** High  
**Type:** Technical

#### Scenario: Reference includes required fields

**Given** a command creates output  
**When** a ReferenceHandle is created  
**Then** it must include an `id` field (UUID or token)  
**And** it must include a `content` field (the actual data)  
**And** it must include a `timestamp` field (Date object)  
**And** it must include an `outputFile` field (absolute path)  
**And** it may include a `metadata` field (command name, args, etc.)

---

## Data Models

### ReferenceHandle Interface

```typescript
interface ReferenceHandle {
  id: string;              // UUID or user-provided token
  content: any;            // Command output (string, buffer, object)
  timestamp: Date;         // Creation timestamp
  outputFile: string;      // Absolute path to output file
  metadata?: {
    commandName: string;   // Name of command that created this
    args: string[];        // Arguments passed to command
    duration: number;      // Execution time in milliseconds
  };
}
```

### ExecutionContext Interface

```typescript
interface ExecutionContext {
  cwd: string;                     // Current working directory
  outputDir: string;               // Output directory path
  referenceManager: ReferenceManager;
  config: Record<string, any>;     // Loaded configuration
}
```

---

## Technical Constraints

- Maximum in-memory reference storage: Limited by Node.js heap (typically ~1.4GB)
- Reference IDs must be unique within a session
- Output files must not exceed filesystem limits (typically 255 characters for filename)
- Timestamp precision: milliseconds (not microseconds)

---

## Performance Requirements

- Reference lookup: O(1) via Map structure
- Reference creation: < 10ms overhead
- File write operations: Non-blocking (async)
- Progress updates: Max 100ms interval to avoid flicker
