# Workflow Processing Specification

**Capability ID:** `workflow-processing`  
**Version:** 1.0.0  
**Status:** Draft

## Overview

The Workflow Processing capability provides a context-based **internal programmatic API** (`IWorkflowContext`) for executing asynchronous processes with automatic file-based input/output recording. It enables storing values with memory references, token-based value lookup, and running command implementations that can be chained together.

**CRITICAL DISTINCTION**: The functions in this specification (`context.store()`, `context.token()`, `context.run()`) are **internal API functions** used by command implementations. They are **NOT exposed as CLI commands** to end users.

**User-Facing Commands** are defined in the `cli-core`, `command-builtins`, and `command-extension` capabilities:
- **System Commands**: `init`, `create` - manage project setup
- **Built-in CLI Commands**: Core operational commands for storing, loading, replacing, executing processes
- **Task Handlers**: Custom user-defined commands in `.open-tasks/commands/` (implements `TaskHandler` abstract class)

**Relationship**: Task handlers and built-in commands use the `IWorkflowContext` API internally. Commands receive the context object and can call `context.store()`, `context.token()`, and `context.run()` to orchestrate workflows.

**Core Types**:
- **IWorkflowContext**: Interface for workflow execution context
- **MemoryRef**: Reference to stored values with id, token, and fileName
- **ICommand**: Interface for command implementations executed via `context.run()`
- **IMemoryDecorator**: Interface for transforming MemoryRef during storage

---

## ADDED Requirements

### Requirement: Context Object Interface

The system MUST provide an IWorkflowContext interface that all context implementations follow.

**Priority:** Critical  
**Type:** Technical

#### Scenario: IWorkflowContext interface definition

**Given** a developer wants to implement a workflow context  
**When** they implement the IWorkflowContext interface  
**Then** the interface must define `store(value: string, transforms: IMemoryDecorator[]): Promise<MemoryRef>`  
**And** the interface must define `token(name: string): string | undefined`  
**And** the interface must define `run(command: ICommand): Promise<MemoryRef[]>`  
**And** all methods must be asynchronous (except token lookup)

#### Scenario: Multiple context implementations

**Given** IWorkflowContext interface exists  
**When** different contexts are implemented (InMemoryWorkflowContext, DirectoryOutputContext)  
**Then** all implementations must follow the same interface  
**And** commands can work with any context implementation  
**And** context implementations can be swapped without changing command code

---

### Requirement: Store Operation with Decorators

The context MUST provide a store method that saves values and creates memory references with optional transformations.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Store string value with automatic file creation

**Given** a WorkflowContext is initialized  
**When** the user calls `context.store("Hello World")`  
**Then** the value should be stored  
**And** a MemoryRef should be returned with unique id, token, and fileName  
**And** the file should be created (for file-based contexts)

#### Scenario: Store value with decorators applied

**Given** a WorkflowContext is initialized  
**And** decorators are defined (TimestampDecorator, TokenDecorator)  
**When** the user calls `context.store("data", [timestampDecorator, tokenDecorator])`  
**Then** decorators should be applied before saving  
**And** the MemoryRef should reflect the decorated properties  
**And** the file name should be modified by decorators (if applicable)

#### Scenario: Store without decorators uses defaults

**Given** a WorkflowContext is initialized  
**When** the user calls `context.store("value")`  
**Then** default decorators should be applied (if any)  
**And** a valid MemoryRef should be returned  
**And** the storage should succeed with default naming

#### Scenario: Decorators execute in order

**Given** multiple decorators are provided  
**When** `context.store()` is called with decorators array  
**Then** decorators should be applied in array order  
**And** each decorator receives the MemoryRef from the previous decorator  
**And** the final MemoryRef reflects all transformations

---

### Requirement: Token Lookup Operation

The context MUST provide a token method that retrieves stored values by token name.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Lookup existing token value

**Given** a MemoryRef with token "mydata" has been created  
**When** the user calls `context.token("mydata")`  
**Then** the method should return the value associated with "mydata"  
**And** the return value should match the stored content

#### Scenario: Lookup non-existent token

**Given** no MemoryRef with token "missing" exists  
**When** the user calls `context.token("missing")`  
**Then** the method should return `undefined`  
**And** no error should be thrown

#### Scenario: Multiple refs with same token returns latest

**Given** two MemoryRefs with token "data" have been created at different times  
**When** the user calls `context.token("data")`  
**Then** the method should return the value from the most recently created MemoryRef  
**And** older values with the same token should be ignored

#### Scenario: Token lookup is synchronous

**Given** MemoryRefs exist in the context  
**When** the user calls `context.token(name)`  
**Then** the method should return immediately without awaiting  
**And** the method signature should not return a Promise

---

### Requirement: Run Operation with ICommand

The context MUST provide a run method that executes ICommand instances and returns their output.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Execute command with context

**Given** a class implementing ICommand interface exists  
**When** the user calls `context.run(commandInstance)`  
**Then** the command's execute method should be called with the context  
**And** the command should execute asynchronously  
**And** the method should return Promise<MemoryRef[]>  
**And** the returned array should contain MemoryRefs for command outputs

#### Scenario: Command creates multiple outputs

**Given** a command generates multiple output files  
**When** the command executes via `context.run()`  
**Then** the command should return an array of MemoryRefs  
**And** each MemoryRef should represent one output  
**And** all outputs should be tracked in the context

#### Scenario: Handle command execution error

**Given** a command that throws an error during execution  
**When** the user calls `context.run(command)`  
**Then** the error should propagate to the caller  
**And** the error should include context about the command that failed  
**And** the context state should remain consistent

#### Scenario: Commands can access context methods

**Given** a command is executing  
**When** the execute method has access to the context  
**Then** the command can call `context.store()` to save values  
**And** the command can call `context.token()` to lookup values  
**And** the command can call `context.run()` to execute other commands  
**And** all operations should work correctly within the command

---

### Requirement: MemoryRef Structure

The system MUST provide a MemoryRef type that represents stored values with metadata.

**Priority:** Critical  
**Type:** Technical

#### Scenario: MemoryRef contains required properties

**Given** a value is stored via `context.store()`  
**When** a MemoryRef is created  
**Then** it must contain an `id` property (absolute path or unique identifier)  
**And** it must contain a `token` property (value match for token replacement)  
**And** it must contain a `fileName` property (absolute path to the file)  
**And** all properties must be strings

#### Scenario: MemoryRef id is unique

**Given** multiple values are stored  
**When** MemoryRefs are created  
**Then** each MemoryRef should have a unique `id`  
**And** the `id` can be used to identify the specific stored value  
**And** the `id` should be stable and not change

#### Scenario: MemoryRef token enables lookup

**Given** a MemoryRef is created with a token value  
**When** `context.token(tokenName)` is called  
**Then** the token property enables matching  
**And** the correct value should be returned based on the token

#### Scenario: MemoryRef fileName points to storage

**Given** a MemoryRef exists  
**When** code accesses the `fileName` property  
**Then** it should be an absolute path  
**And** the file should exist at that location (for file-based contexts)  
**And** the file should contain the stored value

---

### Requirement: ICommand Interface

The system MUST define an ICommand interface that can be implemented for executable commands.

**Priority:** High  
**Type:** Technical

#### Scenario: Implement custom command

**Given** the ICommand interface is available  
**When** a developer creates a class implementing ICommand  
**Then** the class must implement `execute(context: WorkflowContext): Promise<MemoryRef[]>`  
**And** the execute method must be asynchronous  
**And** the execute method must return an array of MemoryRefs

#### Scenario: Command uses constructor for configuration

**Given** a command needs arguments or configuration  
**When** the command class is instantiated  
**Then** constructor parameters should provide the configuration  
**And** the execute method receives only the context  
**And** this separates configuration from execution

**Example**:
```typescript
class PowershellCommand implements ICommand {
  constructor(private script: string, private args: string[]) {}
  
  async execute(context: WorkflowContext): Promise<MemoryRef[]> {
    // Execute PowerShell with this.script and this.args
    // Use context.store() to save output
    // Return array of MemoryRefs
  }
}

// Usage
const cmd = new PowershellCommand("Get-Process", ["-Name", "chrome"]);
const refs = await context.run(cmd);
```

#### Scenario: Access context in command execution

**Given** a command is executing  
**When** the execute method is called with context  
**Then** the command can call `context.store()` to save output  
**And** the command can call `context.token()` to lookup values  
**And** the command can call `context.run()` to execute other commands  
**And** all context operations should work correctly

#### Scenario: Return multiple MemoryRefs from command

**Given** a command generates multiple outputs  
**When** the execute method completes  
**Then** it should return an array with multiple MemoryRefs  
**And** each MemoryRef should represent a distinct output  
**And** the array can be empty if no output is generated

---

### Requirement: IMemoryDecorator Interface

The system MUST define an IMemoryDecorator interface for transforming MemoryRefs during storage.

**Priority:** High  
**Type:** Technical

#### Scenario: Implement memory decorator

**Given** the IMemoryDecorator interface is available  
**When** a developer creates a class implementing IMemoryDecorator  
**Then** the class must implement `decorate(source: MemoryRef): MemoryRef`  
**And** the method should modify the MemoryRef properties  
**And** the method should return the modified MemoryRef

#### Scenario: TimestampDecorator prepends timestamp

**Given** a TimestampDecorator is implemented  
**And** a MemoryRef with fileName "output.txt" is provided  
**When** the decorator's decorate method is called  
**Then** the fileName should be modified to "YYYYMMDD-HHmmss-output.txt" (or similar format)  
**And** other properties (id, token) should remain unchanged unless explicitly modified

#### Scenario: TokenDecorator sets token value

**Given** a TokenDecorator is configured with token name "mydata"  
**And** a MemoryRef is provided  
**When** the decorator's decorate method is called  
**Then** the MemoryRef's token property should be set to "mydata"  
**And** other properties should remain unchanged

#### Scenario: SetNameDecorator replaces fileName

**Given** a SetNameDecorator is configured with name "output.txt"  
**And** a MemoryRef with fileName "temp.txt" is provided  
**When** the decorator's decorate method is called  
**Then** the fileName should be changed to "output.txt"  
**And** the id may also need to be updated to reflect the new fileName

#### Scenario: PrependNameDecorator adds prefix

**Given** a PrependNameDecorator is configured with prefix "debug-"  
**And** a MemoryRef with fileName "log.txt" is provided  
**When** the decorator's decorate method is called  
**Then** the fileName should be changed to "debug-log.txt"  
**And** the prefix should be added to the existing name

#### Scenario: Chain multiple decorators

**Given** multiple decorators are provided to `context.store()`  
**When** decorators are applied in sequence  
**Then** each decorator should receive the output of the previous decorator  
**And** the final MemoryRef should reflect all transformations  
**And** decorators should be applied in the order provided

---

### Requirement: Context Implementations

The system MUST support multiple IWorkflowContext implementations for different storage strategies.

**Priority:** High  
**Type:** Functional

#### Scenario: InMemoryWorkflowContext stores values in memory

**Given** an InMemoryWorkflowContext is created  
**When** values are stored via `context.store()`  
**Then** values should be kept in memory using a dictionary<string, string> lookup  
**And** MemoryRefs should point to in-memory locations (not files)  
**And** `context.token()` should retrieve from the in-memory dictionary  
**And** no files should be written to disk

#### Scenario: DirectoryOutputContext creates timestamped directories

**Given** a DirectoryOutputContext is created  
**When** the context is initialized  
**Then** a timestamped directory should be created in `.open-tasks/output/{timestamp-dir}`  
**And** all subsequent `context.store()` operations should save files to that directory  
**And** MemoryRefs should point to files in the timestamped directory  
**And** the directory should persist after context is disposed

#### Scenario: DirectoryOutputContext file organization

**Given** a DirectoryOutputContext with timestamp directory  
**When** multiple values are stored  
**Then** each file should be saved with appropriate naming  
**And** files should be organized within the timestamp directory  
**And** the directory structure should be easy to navigate

#### Scenario: Future RemoteOutputContext for cloud storage

**Given** a RemoteOutputContext implementation (future)  
**When** values are stored via `context.store()`  
**Then** values should be uploaded to remote storage (e.g., S3 bucket)  
**And** MemoryRefs should contain remote URLs or identifiers  
**And** `context.token()` should retrieve from remote storage or cache  
**And** the implementation should follow IWorkflowContext interface

#### Scenario: Switch context implementations without code changes

**Given** commands use IWorkflowContext interface  
**When** a different context implementation is provided  
**Then** commands should work without modification  
**And** only the storage behavior should change  
**And** all interface methods should work consistently

---

### Requirement: Asynchronous Execution

Store and run operations MUST execute asynchronously and return Promises.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Store operation is asynchronous

**Given** a WorkflowContext is initialized  
**When** the user calls `context.store(value)`  
**Then** the method should return a Promise  
**And** the Promise should resolve to a MemoryRef  
**And** the storage operation should complete after the Promise resolves

#### Scenario: Run operation is asynchronous

**Given** an ICommand instance  
**When** the user calls `context.run(command)`  
**Then** the method should return a Promise  
**And** the command should execute asynchronously  
**And** the Promise should resolve to MemoryRef[]

#### Scenario: Token lookup is synchronous

**Given** a WorkflowContext with stored values  
**When** the user calls `context.token(name)`  
**Then** the method should return immediately (not a Promise)  
**And** the result should be string | undefined  
**And** no await should be required

#### Scenario: Await multiple operations in sequence

**Given** multiple workflow operations  
**When** operations are awaited in sequence  
**Then** each operation should complete before the next starts  
**And** MemoryRefs should be available for subsequent operations  
**And** the sequence should execute in predictable order

---

### Default Configuration

```json
{
  "outputDir": ".open-tasks/output",
  "timestampFormat": "YYYYMMDD-HHmmss-SSS",
  "fileExtension": "txt",
  "contextType": "directory"
}
```

### Configuration Options

- **outputDir**: Base directory for storing workflow output files (used by DirectoryOutputContext)
- **timestampFormat**: Format for timestamps in directory names and decorators
- **fileExtension**: Default extension for output files (.txt, .md, etc.)
- **contextType**: Which context implementation to use ("memory", "directory", "remote")

---

## Technical Constraints

- Must support Node.js 18.x and above
- All file operations must use UTF-8 encoding (for file-based contexts)
- File names must be valid on Windows, macOS, and Linux
- Maximum file size should be configurable (default: 10MB for file-based contexts)
- Memory-based contexts should handle large values efficiently
- Token lookup must be O(1) or O(log n) for performance

---

## Dependencies

- File system operations (fs/promises) - for DirectoryOutputContext
- Path manipulation (path module) - for file-based contexts
- Timestamp generation (Date or date library) - for decorators and directory naming
- Optional: Cloud storage SDKs (AWS SDK, Azure SDK) - for future RemoteOutputContext

---

## Extension Points

1. **Custom Context Implementations**: Implement IWorkflowContext interface for different storage backends
2. **Custom Commands**: Implement ICommand interface for executable operations
3. **Custom Memory Decorators**: Implement IMemoryDecorator interface for custom MemoryRef transformations
4. **Token Naming Strategies**: Customize how tokens are generated and matched
