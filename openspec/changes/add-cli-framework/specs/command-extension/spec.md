# Command Extension Specification

**Capability ID:** `command-extension`  
**Version:** 1.0.0  
**Status:** Draft

## Overview

The Command Extension capability enables users to create custom commands that extend the CLI's functionality. Custom commands are auto-discovered from the `.open-tasks/commands/` directory and integrated seamlessly with built-in commands.

---

## ADDED Requirements

### Requirement: Custom Command Discovery

The CLI MUST automatically discover and load custom commands from the user's workspace.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Discover commands in standard location

**Given** the directory `.open-tasks/commands/` exists  
**And** it contains `my-command.js`  
**When** the CLI starts  
**Then** the CLI should scan the directory  
**And** discover `my-command.js`  
**And** register it as command "my-command"

#### Scenario: Discover TypeScript commands

**Given** the directory `.open-tasks/commands/` contains `my-command.ts`  
**And** ts-node or tsx is available  
**When** the CLI starts  
**Then** the CLI should discover the TypeScript file  
**And** register it as command "my-command"  
**And** execute it using the TypeScript runtime

#### Scenario: No custom commands directory

**Given** the directory `.open-tasks/commands/` does not exist  
**When** the CLI starts  
**Then** the CLI should not error  
**And** only built-in commands should be available  
**And** the CLI should function normally

#### Scenario: Empty custom commands directory

**Given** the directory `.open-tasks/commands/` exists but is empty  
**When** the CLI starts  
**Then** the CLI should scan the directory  
**And** find no custom commands  
**And** only built-in commands should be available

#### Scenario: Multiple custom commands

**Given** the directory contains `cmd1.js`, `cmd2.js`, and `cmd3.js`  
**When** the CLI starts  
**Then** all three commands should be discovered  
**And** registered as "cmd1", "cmd2", and "cmd3"  
**And** all should be available for invocation

---

### Requirement: Command Module Format

Custom command modules MUST follow a specific structure to be loaded successfully.

**Priority:** Critical  
**Type:** Technical

#### Scenario: Command exports default class

**Given** a custom command file exists  
**When** the module exports a default class extending CommandHandler  
**Then** the CLI should load the class  
**And** instantiate it for command execution  
**And** call its execute method when invoked

#### Scenario: Command with invalid export

**Given** a custom command file exists  
**And** it does not export a default class  
**When** the CLI attempts to load it  
**Then** a warning should be displayed  
**And** the command should be skipped  
**And** the CLI should continue loading other commands

#### Scenario: Command with missing execute method

**Given** a custom command class exists  
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

### Requirement: Command Handler Interface

Custom commands MUST implement the CommandHandler interface.

**Priority:** Critical  
**Type:** Technical

#### Scenario: Custom command receives arguments

**Given** a custom command is invoked  
**When** the user runs `open-tasks my-cmd arg1 arg2`  
**Then** the execute method should receive `["arg1", "arg2"]`  
**And** the command can process the arguments

#### Scenario: Custom command receives references

**Given** a custom command accepts references  
**When** the user runs `open-tasks my-cmd --ref token1 --ref token2`  
**Then** the execute method should receive a Map with resolved references  
**And** the command can access reference content by token

#### Scenario: Custom command receives execution context

**Given** a custom command is invoked  
**When** the execute method is called  
**Then** the execution context should be passed as the third parameter  
**And** the context should include cwd, outputDir, and referenceManager  
**And** the command can access shared resources

#### Scenario: Custom command returns reference

**Given** a custom command executes successfully  
**When** the execute method completes  
**Then** it must return a Promise<ReferenceHandle>  
**And** the reference should contain the command output  
**And** the output should be written to a file automatically

---

### Requirement: Error Handling in Custom Commands

Custom commands MUST handle errors gracefully, with support from the CLI framework.

**Priority:** High  
**Type:** Functional

#### Scenario: Custom command throws error

**Given** a custom command encounters an error  
**When** the execute method throws an exception  
**Then** the CLI should catch the exception  
**And** display a formatted error message  
**And** write error details to an `.error` file  
**And** exit with a non-zero code

#### Scenario: Custom command validation error

**Given** a custom command receives invalid arguments  
**When** the command validates the arguments  
**And** finds them invalid  
**Then** the command should throw a validation error  
**And** the CLI should display the error  
**And** suggest correct usage

---

### Requirement: Command Metadata

Custom commands MUST provide metadata for help and documentation.

**Priority:** Medium  
**Type:** Functional

#### Scenario: Command with description

**Given** a custom command class has a static `description` property  
**When** the user runs `open-tasks --help`  
**Then** the command should be listed  
**And** the description should be displayed next to the command name

#### Scenario: Command with usage examples

**Given** a custom command class has a static `examples` property  
**When** the user runs `open-tasks my-cmd --help`  
**Then** the examples should be displayed  
**And** formatted as usage examples

#### Scenario: Command without metadata

**Given** a custom command has no metadata properties  
**When** the user views help  
**Then** the command should still be listed  
**And** a default description should be shown  
**And** no examples should be displayed

---

### Requirement: Access to Shared Services

Custom commands MUST have access to shared CLI services and utilities.

**Priority:** High  
**Type:** Technical

#### Scenario: Custom command writes output file

**Given** a custom command produces output  
**When** the command uses the execution context  
**Then** it should access the output handler  
**And** write files to the configured output directory  
**And** follow the standard naming convention

#### Scenario: Custom command creates reference

**Given** a custom command produces output  
**When** the command uses the reference manager  
**Then** it can create a new reference  
**And** the reference should be available to subsequent commands  
**And** stored in memory for the session

#### Scenario: Custom command reads configuration

**Given** a custom command needs configuration  
**When** the command accesses the execution context  
**Then** it can read the configuration object  
**And** access both project-level and user-level config  
**And** use configuration values in its logic

---

### Requirement: Template and Documentation

The CLI MUST provide templates and documentation for creating custom commands.

**Priority:** Medium  
**Type:** Documentation

#### Scenario: Template command available

**Given** the CLI package includes a template  
**When** developers want to create a custom command  
**Then** they can copy the template from `templates/example-command.ts`  
**And** the template should include all required boilerplate  
**And** include comments explaining each part

#### Scenario: Documentation for custom commands

**Given** developers want to extend the CLI  
**When** they read the README or documentation  
**Then** a section should explain custom commands  
**And** show the file structure and conventions  
**And** provide a complete example  
**And** explain the CommandHandler interface

---

### Requirement: Command Isolation

Custom commands MUST execute in isolation without affecting other commands or the CLI core.

**Priority:** High  
**Type:** Technical

#### Scenario: Custom command error does not crash CLI

**Given** a custom command has a bug  
**When** the command throws an unexpected error  
**Then** the CLI should catch the error  
**And** the CLI should remain stable  
**And** other commands should remain usable

#### Scenario: Custom command cannot modify core behavior

**Given** a custom command attempts to modify CLI internals  
**When** the command executes  
**Then** it should only have access to the provided interfaces  
**And** should not be able to modify the command router  
**And** should not be able to affect other command registrations

---

## Command Handler API

### Base Class

```typescript
abstract class CommandHandler {
  /**
   * Execute the command
   * @param args - Positional arguments passed to the command
   * @param refs - Map of resolved references (token -> ReferenceHandle)
   * @param context - Execution context with shared resources
   * @returns Promise resolving to a ReferenceHandle
   */
  abstract execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;

  /**
   * Command description for help output (optional)
   */
  static description?: string;

  /**
   * Usage examples for help output (optional)
   */
  static examples?: string[];
}
```

### Example Custom Command

```typescript
// .open-tasks/commands/uppercase.ts
import { CommandHandler, ReferenceHandle, ExecutionContext } from 'open-tasks-cli';

export default class UppercaseCommand extends CommandHandler {
  static description = 'Convert text to uppercase';
  static examples = [
    'open-tasks uppercase "hello world"',
    'open-tasks uppercase --ref mytext',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // Get input from args or first reference
    let input: string;
    if (args.length > 0) {
      input = args[0];
    } else if (refs.size > 0) {
      const firstRef = refs.values().next().value;
      input = firstRef.content.toString();
    } else {
      throw new Error('No input provided. Provide text as argument or use --ref');
    }

    // Transform to uppercase
    const output = input.toUpperCase();

    // Create reference using context services
    const outputFile = await context.outputHandler.writeOutput(
      output,
      context.token || undefined
    );

    return {
      id: context.token || generateUUID(),
      content: output,
      timestamp: new Date(),
      outputFile,
      metadata: {
        commandName: 'uppercase',
        args,
        duration: 0,
      },
    };
  }
}
```

---

## Directory Structure

```
project-root/
└── .open-tasks/
    ├── commands/           # Custom command modules
    │   ├── my-command.js   # JavaScript command
    │   ├── another-cmd.ts  # TypeScript command
    │   └── transform.js    # Another custom command
    ├── outputs/            # Command output files
    └── config.json         # Optional configuration
```

---

## Technical Constraints

- Custom commands must be in `.open-tasks/commands/` (not subdirectories)
- Only `.js` and `.ts` files are scanned
- Command names must be valid identifiers (alphanumeric, hyphens, underscores)
- Commands cannot override built-in commands
- Maximum 100 custom commands per workspace (performance consideration)

---

## Security Considerations

- Custom commands execute with same privileges as the user
- No sandboxing or permission system in v1
- Users are responsible for vetting custom command code
- Recommend code review before adding third-party commands
- File operations should be limited to workspace directory

---

## Performance Requirements

- Command discovery: < 100ms for 50 commands
- Command loading: Lazy (only load when invoked)
- Module caching: Cache loaded modules for the session
- Reload: No hot-reload in v1 (restart CLI to pick up changes)
