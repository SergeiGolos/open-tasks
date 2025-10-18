# CLI Core Specification

**Capability ID:** `cli-core`  
**Version:** 1.0.0  
**Status:** Draft

## Overview

The CLI Core capability provides the foundational framework for the open-tasks-cli tool, including command parsing, routing, and the execution engine that orchestrates command invocation.

**Command Types**:
1. **System Commands**: Built-in commands for project setup and scaffolding (`init`, `create`) - these are NOT process commands
2. **Built-in CLI Commands**: Six core operational commands (`store`, `load`, `replace`, `powershell`, `ai-cli`, `extract`)
3. **Process Commands**: User-defined custom commands discovered from `.open-tasks/commands/` directory

**Not Exposed as CLI Commands**: The Context API functions (`context.store()`, `context.load()`, `context.transform()`, `context.run()`) are internal programmatic APIs used by command implementations. They are NOT user-facing CLI commands.

---

## ADDED Requirements

### Requirement: CLI Installation and Invocation

The tool MUST be installable via npm and invokable from the command line.

**Priority:** Critical  
**Type:** Functional

#### Scenario: User installs CLI globally

**Given** the user has npm installed  
**When** the user runs `npm install -g open-tasks-cli`  
**Then** the CLI should be installed globally  
**And** the user can invoke it using `open-tasks` from any directory

#### Scenario: User installs CLI locally in project

**Given** the user has a Node.js project  
**When** the user runs `npm install --save-dev open-tasks-cli`  
**Then** the CLI should be available via `npx open-tasks`

#### Scenario: User invokes CLI without arguments

**Given** the CLI is installed  
**When** the user runs `open-tasks` without arguments  
**Then** the CLI should display help information  
**And** list all available commands  
**And** show usage examples

---

### Requirement: Command Routing

The CLI MUST route command invocations to the appropriate command handler based on the command name.

**Priority:** Critical  
**Type:** Functional

#### Scenario: User invokes built-in command

**Given** the CLI has built-in commands registered  
**When** the user runs `open-tasks store "Hello World"`  
**Then** the router should identify "store" as the command  
**And** pass remaining arguments to the store command handler  
**And** execute the command asynchronously

#### Scenario: User invokes custom command

**Given** a custom command exists in `.open-tasks/commands/my-cmd.js`  
**When** the user runs `open-tasks my-cmd arg1 arg2`  
**Then** the router should discover and load the custom command  
**And** pass arguments to the custom command handler  
**And** execute the command asynchronously

#### Scenario: User invokes non-existent command

**Given** the CLI is running  
**When** the user runs `open-tasks invalid-command`  
**Then** the CLI should display an error message  
**And** suggest available commands  
**And** exit with a non-zero exit code

---

### Requirement: Argument Parsing

The CLI MUST parse command-line arguments including positional arguments, flags, and reference tokens.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Parse positional arguments

**Given** the user invokes a command  
**When** the user runs `open-tasks store "value1" "value2"`  
**Then** the CLI should parse "value1" and "value2" as positional arguments  
**And** pass them as an array to the command handler

#### Scenario: Parse token flag

**Given** the user wants to assign a token to the output  
**When** the user runs `open-tasks store "data" --token mydata`  
**Then** the CLI should parse "mydata" as the token  
**And** pass it to the reference manager for assignment

#### Scenario: Parse reference flag

**Given** the user wants to reference previous output  
**When** the user runs `open-tasks load --ref mydata`  
**Then** the CLI should parse "mydata" as a reference token  
**And** resolve it before passing to the command handler

#### Scenario: Parse multiple references

**Given** the user wants to pass multiple references  
**When** the user runs `open-tasks ai-cli "Compare these" --ref file1 --ref file2`  
**Then** the CLI should parse both "file1" and "file2" as reference tokens  
**And** resolve all references before command execution

---

### Requirement: Version Information

The CLI MUST display version information when requested.

**Priority:** Medium  
**Type:** Functional

#### Scenario: Display version

**Given** the CLI is installed  
**When** the user runs `open-tasks --version` or `open-tasks -v`  
**Then** the CLI should display the current version number  
**And** exit successfully

---

### Requirement: Help System

The CLI MUST provide contextual help for commands and usage.

**Priority:** High  
**Type:** Functional

#### Scenario: Display general help

**Given** the CLI is installed  
**When** the user runs `open-tasks --help` or `open-tasks -h`  
**Then** the CLI should display general usage information  
**And** list all available commands with brief descriptions  
**And** show common examples

#### Scenario: Display command-specific help

**Given** a command exists  
**When** the user runs `open-tasks store --help`  
**Then** the CLI should display help for the store command  
**And** show command-specific arguments and flags  
**And** provide usage examples for that command

---

### Requirement: Error Handling

The CLI MUST handle errors gracefully and provide meaningful error messages.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Handle command execution error

**Given** a command encounters an error during execution  
**When** the command throws an exception  
**Then** the CLI should catch the exception  
**And** display a formatted error message with context  
**And** write error details to a `.error` file  
**And** exit with a non-zero exit code

#### Scenario: Handle missing required arguments

**Given** a command requires specific arguments  
**When** the user runs the command without required arguments  
**Then** the CLI should display an error message  
**And** show the correct usage pattern  
**And** exit with a non-zero exit code

---

### Requirement: Execution Context

The CLI MUST provide an execution context to all commands with access to configuration and shared resources.

**Priority:** High  
**Type:** Functional

#### Scenario: Provide execution context to commands

**Given** a command is being executed  
**When** the command handler's execute method is called  
**Then** the CLI should pass an execution context object  
**And** the context should include the current working directory  
**And** the context should include output directory path  
**And** the context should include reference manager instance

#### Scenario: Share configuration across commands

**Given** configuration exists in `.open-tasks/config.json`  
**When** any command is executed  
**Then** the execution context should include loaded configuration  
**And** commands can access configuration values

---

### Requirement: Init System Command

The CLI MUST provide an `init` command to set up a new open-tasks project in the current directory.

**Priority:** High  
**Type:** Functional

#### Scenario: Initialize project in empty directory

**Given** the user is in a directory without `.open-tasks/` structure  
**When** the user runs `open-tasks init`  
**Then** the CLI should create `.open-tasks/` directory structure  
**And** create `.open-tasks/commands/` directory  
**And** create `.open-tasks/outputs/` directory  
**And** create default `.open-tasks/config.json` file  
**And** install any required npm dependencies in the current directory  
**And** display success message with next steps

#### Scenario: Initialize project with existing .open-tasks directory

**Given** a `.open-tasks/` directory already exists  
**When** the user runs `open-tasks init`  
**Then** the CLI should display a warning  
**And** ask for confirmation to overwrite  
**And** only proceed if user confirms  
**And** preserve existing custom commands if present

#### Scenario: Initialize with package.json missing

**Given** the current directory does not have a `package.json`  
**When** the user runs `open-tasks init`  
**Then** the CLI should create a basic `package.json`  
**And** include open-tasks-cli as a dependency  
**And** set up default npm scripts  
**And** display message about package.json creation

#### Scenario: Initialize with --force flag

**Given** a `.open-tasks/` directory exists  
**When** the user runs `open-tasks init --force`  
**Then** the CLI should reinitialize without prompting  
**And** preserve user-created process commands  
**And** reset configuration to defaults  
**And** display warning about reset

---

### Requirement: Create System Command

The CLI MUST provide a `create` command to scaffold new process command templates.

**Priority:** High  
**Type:** Functional

#### Scenario: Create new process command template

**Given** the user has initialized an open-tasks project  
**When** the user runs `open-tasks create my-command`  
**Then** the CLI should create `.open-tasks/commands/my-command.js`  
**And** the file should contain a template class extending CommandHandler  
**And** include placeholder execute method with documentation  
**And** include example argument handling  
**And** include example reference usage  
**And** display success message with file path

#### Scenario: Create command with existing name

**Given** a process command `.open-tasks/commands/existing.js` exists  
**When** the user runs `open-tasks create existing`  
**Then** the CLI should display an error  
**And** indicate the command already exists  
**And** suggest using a different name or removing the existing file  
**And** not overwrite the existing file

#### Scenario: Create command in uninitialized project

**Given** the user has not run `open-tasks init`  
**And** no `.open-tasks/commands/` directory exists  
**When** the user runs `open-tasks create my-command`  
**Then** the CLI should display an error  
**And** suggest running `open-tasks init` first  
**And** not create the command file

#### Scenario: Create command with TypeScript template

**Given** the user wants a TypeScript process command  
**When** the user runs `open-tasks create my-command --typescript`  
**Then** the CLI should create `.open-tasks/commands/my-command.ts`  
**And** use TypeScript syntax in the template  
**And** include proper type annotations  
**And** configure TypeScript if not already configured

#### Scenario: Create command with custom description

**Given** the user wants to add metadata  
**When** the user runs `open-tasks create my-command --description "My custom command"`  
**Then** the template should include the description in comments  
**And** the description should appear in help output when command is registered

---

## Configuration

### Default Configuration

```json
{
  "outputDir": ".open-tasks/outputs",
  "customCommandsDir": ".open-tasks/commands",
  "timestampFormat": "YYYYMMDD-HHmmss-SSS",
  "defaultFileExtension": "txt",
  "colors": true
}
```

### Configuration File Location

The CLI looks for configuration in the following order:
1. `.open-tasks/config.json` (project-level)
2. `~/.open-tasks/config.json` (user-level)
3. Built-in defaults

---

## Technical Constraints

- Must be compatible with Node.js 18.x and above
- Must support Windows, macOS, and Linux
- Must have zero-config operation (works without configuration file)
- Maximum command line length: system-dependent (typically 32KB on Windows)

---

## Dependencies

- **commander**: ^11.0.0 - Command-line argument parsing
- **chalk**: ^5.3.0 - Terminal color output
- **fs-extra**: ^11.1.0 - Enhanced file system operations
