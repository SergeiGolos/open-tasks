# Command Extension Specification

**Capability ID:** `command-extension`  
**Version:** 1.0.0  
**Status:** Draft

## Overview

The Command Extension capability enables users to create custom **Task Handlers** that extend the CLI's functionality. Task handlers are user-defined commands that are auto-discovered from the `.open-tasks/commands/` directory and integrated seamlessly with built-in CLI commands.

**Terminology**: 
- **Task Handlers**: Custom user-defined command implementations stored in `.open-tasks/commands/` directory (extends `TaskHandler` abstract class)
- **Built-in CLI Commands**: Core operational commands packaged with the CLI
- **System Commands**: Framework commands (init, create) that manage the project
- **IWorkflowContext**: Internal programmatic API (context.store(), context.token(), context.run()) - NOT exposed as CLI commands

Task handlers use the IWorkflowContext API internally and return TaskOutcome objects that track execution results, logs, and errors.

**Key Types**:
- **TaskHandler**: Abstract class for creating custom commands
- **TaskOutcome**: Return type containing id, name, logs, and errors
- **TaskLog**: Log entry tracking MemoryRef results, command details, and timestamps

---

## ADDED Requirements

### Requirement: Task Handler Discovery

The CLI MUST automatically discover and load task handlers from the user's workspace.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Discover task handlers in standard location

**Given** the directory `.open-tasks/commands/` exists  
**And** it contains `my-command.js`  
**When** the CLI starts  
**Then** the CLI should scan the directory  
**And** discover `my-command.js`  
**And** register it as task handler "my-command"

#### Scenario: Discover TypeScript task handlers

**Given** the directory `.open-tasks/commands/` contains `my-command.ts`  
**And** ts-node or tsx is available  
**When** the CLI starts  
**Then** the CLI should discover the TypeScript file  
**And** register it as task handler "my-command"  
**And** execute it using the TypeScript runtime

#### Scenario: No commands directory

**Given** the directory `.open-tasks/commands/` does not exist  
**When** the CLI starts  
**Then** the CLI should not error  
**And** only system commands and built-in CLI commands should be available  
**And** the CLI should function normally

#### Scenario: Empty commands directory

**Given** the directory `.open-tasks/commands/` exists but is empty  
**When** the CLI starts  
**Then** the CLI should scan the directory  
**And** find no task handlers  
**And** only system commands and built-in CLI commands should be available

#### Scenario: Multiple task handlers

**Given** the directory contains `cmd1.js`, `cmd2.js`, and `cmd3.js`  
**When** the CLI starts  
**Then** all three task handlers should be discovered  
**And** registered as "cmd1", "cmd2", and "cmd3"  
**And** all should be available for invocation alongside built-in commands

---

### Requirement: Task Handler Module Format

Custom task handler modules MUST follow a specific structure to be loaded successfully.

**Priority:** Critical  
**Type:** Technical

#### Scenario: Task handler exports default class extending TaskHandler

**Given** a custom task handler file exists  
**When** the module exports a default class extending TaskHandler  
**Then** the CLI should load the class  
**And** instantiate it for command execution  
**And** call its execute method when invoked

#### Scenario: Task handler with static name property

**Given** a TaskHandler class is defined  
**When** the class includes a static `name` property  
**Then** the CLI should use this name for command registration  
**And** users can invoke it with `open-tasks <name>`  
**And** the name should override the filename-based default

#### Scenario: Task handler with static description

**Given** a TaskHandler class is defined  
**When** the class includes a static `description` property  
**Then** the CLI should display this description in help output  
**And** the description should explain what the command does

#### Scenario: Task handler with static examples

**Given** a TaskHandler class is defined  
**When** the class includes a static `examples` array  
**Then** the CLI should display these examples in help output  
**And** examples should show typical usage patterns

#### Scenario: Task handler with invalid export

**Given** a custom command file exists  
**And** it does not export a default class extending TaskHandler  
**When** the CLI attempts to load it  
**Then** a warning should be displayed  
**And** the command should be skipped  
**And** the CLI should continue loading other commands

#### Scenario: Task handler with missing execute method

**Given** a custom task handler class exists  
**And** it does not implement the execute method  
**When** the CLI attempts to use the command  
**Then** an error should be displayed  
**And** indicate the missing execute method  
**And** the command should not be available  
**And** it does not implement the execute method  
**When** the CLI attempts to use the command  
**Then** an error should be displayed  
**And** indicate the missing execute method  
**And** the command should not be available

---

### Requirement: Command Name Derivation

Command names MUST be derived from the filename in a consistent manner.

**Priority:** High  
**Type:** Functional

#### Scenario: Kebab-case filename

**Given** a file is named `my-custom-command.js`  
**When** the CLI loads the command  
**Then** the command name should be "my-custom-command"  
**And** users can invoke it with `open-tasks my-custom-command`

#### Scenario: Filename with extension

**Given** files are named `cmd.js` and `cmd.ts`  
**When** the CLI loads commands  
**Then** the extension should be stripped  
**And** the command name should be "cmd"  
**And** both files should not conflict (one is loaded)

#### Scenario: Invalid filename characters

**Given** a file is named `my@command.js`  
**When** the CLI attempts to load it  
**Then** a warning should be displayed  
**And** the file should be skipped  
**And** suggest valid naming conventions

---

### Requirement: TaskHandler Interface

Custom task handlers MUST implement the TaskHandler abstract class.

**Priority:** Critical  
**Type:** Technical

#### Scenario: TaskHandler abstract class definition

**Given** the TaskHandler abstract class is available  
**When** a developer creates a custom task handler  
**Then** the class must extend TaskHandler  
**And** the class must implement `execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome>`  
**And** the class may define static `name`, `description`, and `examples` properties

#### Scenario: Task handler receives arguments

**Given** a task handler is invoked  
**When** the user runs `open-tasks my-cmd arg1 arg2`  
**Then** the execute method should receive `["arg1", "arg2"]`  
**And** the handler can process the arguments as needed

#### Scenario: Task handler receives workflow context

**Given** a task handler is invoked  
**When** the execute method is called  
**Then** an IWorkflowContext instance should be passed as the second parameter  
**And** the handler can call `context.store()` to save values  
**And** the handler can call `context.token()` to lookup values  
**And** the handler can call `context.run()` to execute ICommand instances

#### Scenario: Task handler returns TaskOutcome

**Given** a task handler executes successfully  
**When** the execute method completes  
**Then** it must return a Promise<TaskOutcome>  
**And** the TaskOutcome must contain a unique `id`  
**And** the TaskOutcome must contain the task `name`  
**And** the TaskOutcome must contain a `logs` array (may be empty)  
**And** the TaskOutcome must contain an `errors` array (should be empty on success)

#### Scenario: Task handler with execution errors

**Given** a task handler encounters errors during execution  
**When** the execute method completes  
**Then** the TaskOutcome `errors` array should contain error messages  
**And** the `logs` array may contain partial execution logs  
**And** the CLI should recognize the task as failed

---

### Requirement: TaskOutcome Structure

Task handlers MUST return TaskOutcome objects with standardized structure.

**Priority:** Critical  
**Type:** Technical

#### Scenario: TaskOutcome required properties

**Given** a task handler returns a TaskOutcome  
**When** the outcome is created  
**Then** it must contain `id` property (string - unique identifier or user token)  
**And** it must contain `name` property (string - the task that was run)  
**And** it must contain `logs` property (TaskLog[] - collection of command logs)  
**And** it must contain `errors` property (string[] - collection of error messages)

#### Scenario: TaskLog structure in logs array

**Given** a task handler creates TaskLog entries  
**When** commands are executed via `context.run()`  
**Then** each TaskLog should include all MemoryRef properties (id, token, fileName)  
**And** each TaskLog should include `command` property (string - type of command run)  
**And** each TaskLog should include `args` property (MemoryRef[] - args passed to command)  
**And** each TaskLog should include `start` property (DateTime - start time)  
**And** each TaskLog should include `end` property (DateTime - end time)

#### Scenario: Empty logs array for simple handlers

**Given** a task handler doesn't execute any commands  
**When** the handler completes  
**Then** the TaskOutcome `logs` array may be empty  
**And** this should be valid (e.g., for validation-only tasks)

#### Scenario: Multiple logs for complex workflows

**Given** a task handler executes multiple commands  
**When** each command completes via `context.run()`  
**Then** a TaskLog entry should be added to the logs array  
**And** logs should be ordered chronologically  
**And** all command executions should be tracked

---

### Requirement: Error Handling in Task Handlers

Task handlers MUST handle errors gracefully and report them via TaskOutcome.

**Priority:** High  
**Type:** Functional

#### Scenario: Task handler catches and reports errors

**Given** a task handler encounters an error during execution  
**When** an ICommand throws an exception  
**Then** the task handler should catch the exception  
**And** add the error message to TaskOutcome.errors array  
**And** optionally continue with remaining operations  
**And** return the TaskOutcome with errors populated

#### Scenario: Task handler validation error

**Given** a task handler receives invalid arguments  
**When** the handler validates the arguments  
**And** finds them invalid  
**Then** the handler should return TaskOutcome with validation errors in the errors array  
**And** the logs array may be empty  
**And** the CLI should display the errors to the user

#### Scenario: Uncaught exception in task handler

**Given** a task handler throws an uncaught exception  
**When** the execute method throws an error  
**Then** the CLI framework should catch the exception  
**And** create a TaskOutcome with the error message  
**And** write error details to an `.error` file  
**And** exit with a non-zero code

#### Scenario: Partial success with errors

**Given** a task handler executes multiple commands  
**When** some commands succeed and others fail  
**Then** the TaskOutcome should contain logs for successful operations  
**And** the errors array should contain failures  
**And** the CLI should report the task as failed but show partial progress

---

### Requirement: Task Handler Metadata

Task handlers SHOULD provide metadata for help and documentation via static properties.

**Priority:** Medium  
**Type:** Functional

#### Scenario: Task handler with static name

**Given** a TaskHandler class has a static `name` property set to "my-task"  
**When** the task handler is registered  
**Then** it should be invokable as `open-tasks my-task`  
**And** the name should override the filename-based default

#### Scenario: Task handler with description

**Given** a TaskHandler class has a static `description` property  
**When** the user runs `open-tasks --help`  
**Then** the task handler should be listed  
**And** the description should be displayed next to the command name

#### Scenario: Task handler with usage examples

**Given** a TaskHandler class has a static `examples` array  
**When** the user runs `open-tasks my-task --help`  
**Then** the examples should be displayed  
**And** formatted as usage examples  
**And** help users understand how to use the task

#### Scenario: Task handler without metadata

**Given** a TaskHandler has no static metadata properties  
**When** the user views help  
**Then** the task handler should still be listed (using filename as name)  
**And** a default description should be shown  
**And** no examples should be displayed

---

### Requirement: Access to Workflow Context

Task handlers MUST have access to IWorkflowContext for orchestrating operations.

**Priority:** High  
**Type:** Technical

#### Scenario: Task handler stores output values

**Given** a task handler produces output  
**When** the handler calls `context.store(value, decorators)`  
**Then** a MemoryRef should be created and returned  
**And** the value should be stored according to context implementation  
**And** the MemoryRef can be added to TaskLog entries

#### Scenario: Task handler lookups token values

**Given** a task handler needs to reference previous values  
**When** the handler calls `context.token(name)`  
**Then** the value associated with the token should be returned  
**And** undefined should be returned if token doesn't exist  
**And** the lookup should be fast (synchronous)

#### Scenario: Task handler executes commands

**Given** a task handler needs to run a command  
**When** the handler creates an ICommand instance and calls `context.run(command)`  
**Then** the command should execute with the context  
**And** MemoryRef[] should be returned  
**And** the handler can track the results in TaskLog entries

---

### Requirement: Template and Documentation

The CLI MUST provide templates and documentation for creating task handlers.

**Priority:** Medium  
**Type:** Documentation

#### Scenario: Template task handler available

**Given** the CLI package includes a template  
**When** developers want to create a custom task handler  
**Then** they can use `open-tasks create <task-name>` to scaffold  
**And** the template should include all required boilerplate  
**And** include comments explaining each part  
**And** show how to use IWorkflowContext

#### Scenario: Documentation for task handlers

**Given** developers want to extend the CLI  
**When** they read the README or documentation  
**Then** a section should explain task handlers  
**And** show the file structure and conventions  
**And** provide a complete example  
**And** explain the TaskHandler abstract class and TaskOutcome structure

---

### Requirement: Task Handler Isolation

Task handlers MUST execute in isolation without affecting other tasks or the CLI core.

**Priority:** High  
**Type:** Technical

#### Scenario: Task handler error does not crash CLI

**Given** a task handler has a bug  
**When** the handler throws an unexpected error  
**Then** the CLI should catch the error  
**And** the CLI should remain stable  
**And** other task handlers should remain usable  
**And** a TaskOutcome with errors should be created

#### Scenario: Task handler cannot modify core behavior

**Given** a task handler attempts to modify CLI internals  
**When** the handler executes  
**Then** it should only have access to the provided interfaces (IWorkflowContext)  
**And** should not be able to modify the command router  
**And** should not be able to affect other task handler registrations

---

## TaskHandler API

### Abstract Class Definition

```typescript
abstract class TaskHandler {
  /**
   * Execute the Task as defined in the execute class.
   * @param args - Positional arguments passed to the command from the CLI
   * @param context - Workflow context with IWorkflowContext interface
   * @returns Promise resolving to a TaskOutcome
   */
  abstract execute(
    args: string[],
    context: IWorkflowContext
  ): Promise<TaskOutcome>;

  /**
   * The Task name, used as the verb in the call to the open-tasks CLI command line.
   */
  static name: string;

  /**
   * Command description for help output (optional)
   */
  static description?: string;

  /**
   * Usage examples for help output (optional)
   */
  static examples?: string[];
}

/**
 * TaskOutcome - Result of CLI command execution
 */
type TaskOutcome = {
  /**
   * Unique identifier (user token or auto-generated UUID)
   */
  id: string;

  /**
   * The task that was run.
   */
  name: string;

  /**
   * A collection of command-generated logs.
   */
  logs: TaskLog[];

  /**
   * A collection of errors that may have been caught. If not empty, the Task has failed.
   */
  errors: string[];
}

/**
 * TaskLog - Log entry for a command execution
 */
type TaskLog = {
  // ... MemoryRef properties
  id: string;
  token: string;
  fileName: string;

  // Process tracking properties
  command: string;           // type of command being run
  args: MemoryRef[];        // the args passed to the command
  start: DateTime;          // start of the ICommand
  end: DateTime;            // end of the ICommand
}
```

### Example Task Handler

```typescript
// .open-tasks/commands/process-data.ts
import { TaskHandler, TaskOutcome, IWorkflowContext, MemoryRef, ICommand } from 'open-tasks-cli';

export default class ProcessDataHandler extends TaskHandler {
  static name = 'process-data';
  static description = 'Process data files and generate report';
  static examples = [
    'open-tasks process-data input.txt',
    'open-tasks process-data file1.txt file2.txt',
  ];

  async execute(
    args: string[],
    context: IWorkflowContext
  ): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateUUID(),
      name: 'process-data',
      logs: [],
      errors: []
    };

    try {
      // Store input files
      for (const file of args) {
        const ref = await context.store(
          await readFile(file),
          [new TokenDecorator(file), new TimestampDecorator()]
        );
        // Add to logs...
      }

      // Execute a command
      const processCmd = new DataProcessCommand(args);
      const results = await context.run(processCmd);
      
      // Track in logs
      outcome.logs.push({
        ...results[0],
        command: 'DataProcessCommand',
        args: [],
        start: new Date(startTime),
        end: new Date()
      });

      // Use token lookup
      const previousResult = context.token('last-result');
      if (previousResult) {
        // Do something with it...
      }

    } catch (error) {
      outcome.errors.push(error.message);
    }

    return outcome;
  }
}
```

---

## Directory Structure

```
project-root/
└── .open-tasks/
    ├── commands/           # Task handler modules
    │   ├── my-task.js      # JavaScript task handler
    │   ├── another-task.ts # TypeScript task handler
    │   └── transform.js    # Another custom task handler
    ├── output/             # Output files (timestamped directories)
    │   └── 20251017-120000/
    │       ├── result1.txt
    │       └── result2.txt
    └── config.json         # Optional configuration
```

---

## Technical Constraints

- Task handlers must be in `.open-tasks/commands/` (not subdirectories)
- Only `.js` and `.ts` files are scanned
- Task names must be valid identifiers (alphanumeric, hyphens, underscores)
- Task handlers cannot override built-in commands or system commands
- Maximum 100 custom task handlers per workspace (performance consideration)
- TaskOutcome must be returned even on failure (with errors populated)

---

## Security Considerations

- Task handlers execute with same privileges as the user
- No sandboxing or permission system in v1
- Users are responsible for vetting custom task handler code
- Recommend code review before adding third-party task handlers
- File operations should be limited to workspace directory
- ICommand implementations should validate inputs

---

## Performance Requirements

- Task handler discovery: < 100ms for 50 handlers
- Task handler loading: Lazy (only load when invoked)
- Module caching: Cache loaded modules for the session
- Context operations (store, token) should be fast (< 10ms each)
- Reload: No hot-reload in v1 (restart CLI to pick up changes)
