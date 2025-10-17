# Command Built-ins Specification

**Capability ID:** `command-builtins`  
**Version:** 1.0.0  
**Status:** Draft

## Overview

The Command Built-ins capability provides six essential commands that are packaged with the CLI: store, load, replace, powershell, ai-cli, and extract. These commands cover common operations for data storage, file I/O, string manipulation, shell execution, AI integration, and data extraction.

---

## ADDED Requirements

### Requirement: Store Command

The store command MUST save a value to memory and create a reference for later use.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Store string value

**Given** the user wants to save a value  
**When** the user runs `open-tasks store "Hello World"`  
**Then** the value "Hello World" should be stored in memory  
**And** a UUID-based reference should be created  
**And** the value should be written to a timestamped file  
**And** the reference ID should be displayed

#### Scenario: Store value with token

**Given** the user wants to save a value with a memorable name  
**When** the user runs `open-tasks store "Hello World" --token greeting`  
**Then** the value should be stored with token "greeting"  
**And** the file should be named with the token (e.g., `20251017-143000-001-greeting.txt`)  
**And** the token should be displayed for reference

#### Scenario: Store multiline value

**Given** the user wants to store multiline text  
**When** the user runs `open-tasks store "Line 1\nLine 2\nLine 3"`  
**Then** all lines should be preserved in the output file  
**And** the reference should contain the full multiline text

---

### Requirement: Load Command

The load command MUST read content from a file and create a reference.

**Priority:** Critical  
**Type:** Functional

#### Scenario: Load file by path

**Given** a file exists at `./data.txt`  
**When** the user runs `open-tasks load ./data.txt`  
**Then** the file content should be read  
**And** a reference should be created with the content  
**And** the content should be written to an output file  
**And** the reference ID should be displayed

#### Scenario: Load file with token

**Given** a file exists at `./config.json`  
**When** the user runs `open-tasks load ./config.json --token config`  
**Then** the file content should be stored with token "config"  
**And** subsequent commands can reference it via `--ref config`

#### Scenario: Load non-existent file

**Given** a file does not exist at the specified path  
**When** the user runs `open-tasks load ./missing.txt`  
**Then** an error should be displayed  
**And** the error should indicate the file was not found  
**And** the CLI should exit with a non-zero code

#### Scenario: Load binary file

**Given** a binary file exists at `./image.png`  
**When** the user runs `open-tasks load ./image.png`  
**Then** the file should be read as a buffer  
**And** the reference should contain the binary data  
**And** the output file should preserve the binary content

---

### Requirement: Replace Command

The replace command MUST perform string replacement using template syntax with reference substitution.

**Priority:** High  
**Type:** Functional

#### Scenario: Replace single token

**Given** a reference "greeting" contains "Hello"  
**When** the user runs `open-tasks replace "{{greeting}} World" --ref greeting`  
**Then** "{{greeting}}" should be replaced with "Hello"  
**And** the result should be "Hello World"  
**And** a new reference should be created with the result

#### Scenario: Replace multiple tokens

**Given** reference "first" contains "Hello"  
**And** reference "last" contains "World"  
**When** the user runs `open-tasks replace "{{first}} {{last}}!" --ref first --ref last`  
**Then** both tokens should be replaced  
**And** the result should be "Hello World!"

#### Scenario: Replace with named token syntax

**Given** reference "name" contains "Alice"  
**When** the user runs `open-tasks replace "Hi {{name}}, welcome!" --ref name`  
**Then** the CLI should match token name with reference name  
**And** replace "{{name}}" with "Alice"  
**And** the result should be "Hi Alice, welcome!"

#### Scenario: Template with missing reference

**Given** a template contains "{{missing}}"  
**And** no reference named "missing" exists  
**When** the user runs the replace command  
**Then** an error should be displayed  
**And** indicate which reference is missing  
**And** the command should not execute

---

### Requirement: PowerShell Command

The powershell command MUST execute PowerShell commands and capture output.

**Priority:** High  
**Type:** Functional

#### Scenario: Execute simple PowerShell command

**Given** PowerShell is available on the system  
**When** the user runs `open-tasks powershell "Get-Date"`  
**Then** the PowerShell command should execute  
**And** the output should be captured  
**And** a reference should be created with the output  
**And** the output should be written to a file

#### Scenario: Execute PowerShell with reference input

**Given** reference "path" contains "C:\temp"  
**When** the user runs `open-tasks powershell "Get-ChildItem {{path}}" --ref path`  
**Then** "{{path}}" should be replaced with "C:\temp"  
**And** the PowerShell command should execute with the substituted value  
**And** the output should be captured

#### Scenario: PowerShell command fails

**Given** PowerShell is available  
**When** the user runs `open-tasks powershell "Invalid-Command"`  
**Then** the error output should be captured  
**And** an error file should be created  
**And** the CLI should display the PowerShell error  
**And** exit with a non-zero code

#### Scenario: Execute multi-line PowerShell script

**Given** the user wants to run multiple PowerShell commands  
**When** the user runs `open-tasks powershell "$a = 5; $b = 10; $a + $b"`  
**Then** all commands should execute in sequence  
**And** the final output should be captured  
**And** a reference should be created

---

### Requirement: AI CLI Command

The ai-cli command MUST execute configured AI CLI tools with context from references.

**Priority:** High  
**Type:** Functional

#### Scenario: Execute AI CLI with configuration

**Given** AI CLI is configured in `.open-tasks/ai-config.json`  
**And** the configuration specifies command "copilot"  
**When** the user runs `open-tasks ai-cli "Explain this code"`  
**Then** the CLI should execute `copilot` with the prompt  
**And** capture the AI response  
**And** create a reference with the response

#### Scenario: AI CLI with context files

**Given** reference "code" contains source code  
**And** AI CLI is configured  
**When** the user runs `open-tasks ai-cli "Review this" --ref code`  
**Then** the code file should be passed as context  
**And** the AI CLI should be invoked with the context file  
**And** the response should be captured

#### Scenario: AI CLI with multiple context references

**Given** references "file1" and "file2" exist  
**When** the user runs `open-tasks ai-cli "Compare these" --ref file1 --ref file2`  
**Then** both files should be passed as context  
**And** the AI CLI should receive both context files  
**And** the response should be captured

#### Scenario: AI CLI not configured

**Given** no AI configuration exists  
**When** the user runs `open-tasks ai-cli "Help"`  
**Then** an error should be displayed  
**And** indicate that AI CLI is not configured  
**And** provide instructions for creating config  
**And** exit with a non-zero code

#### Scenario: AI CLI timeout

**Given** AI CLI is configured with timeout 30 seconds  
**When** the AI command runs longer than 30 seconds  
**Then** the process should be terminated  
**And** a timeout error should be displayed  
**And** partial output (if any) should be saved

---

### Requirement: Extract Command

The extract command MUST extract data using regular expressions.

**Priority:** Medium  
**Type:** Functional

#### Scenario: Extract with simple regex

**Given** reference "text" contains "Email: user@example.com"  
**When** the user runs `open-tasks extract "[a-z]+@[a-z]+\.[a-z]+" --ref text`  
**Then** the regex should match "user@example.com"  
**And** the match should be captured  
**And** a reference should be created with "user@example.com"

#### Scenario: Extract with capture groups

**Given** reference "log" contains "Error on line 42: file not found"  
**When** the user runs `open-tasks extract "line (\d+)" --ref log`  
**Then** the first capture group "42" should be extracted  
**And** a reference should be created with "42"

#### Scenario: Extract all matches

**Given** reference "html" contains multiple email addresses  
**When** the user runs `open-tasks extract "[a-z]+@[a-z]+\.[a-z]+" --ref html --all`  
**Then** all email addresses should be extracted  
**And** a reference should be created with an array of matches  
**And** the output file should contain one match per line

#### Scenario: Extract with no matches

**Given** reference "text" contains "Hello World"  
**When** the user runs `open-tasks extract "\d+" --ref text`  
**Then** no matches should be found  
**And** an empty result should be returned  
**And** a warning should be displayed

#### Scenario: Extract with invalid regex

**Given** the user provides an invalid regex pattern  
**When** the user runs `open-tasks extract "[invalid" --ref text`  
**Then** a regex syntax error should be displayed  
**And** the command should not execute  
**And** exit with a non-zero code

---

### Requirement: Common Command Options

All built-in commands MUST support common options for consistency.

**Priority:** High  
**Type:** Functional

#### Scenario: All commands support --token

**Given** any built-in command  
**When** the user adds `--token myname` to the command  
**Then** the output reference should use "myname" as the ID  
**And** the output file should include "myname" in the filename

#### Scenario: All commands support --help

**Given** any built-in command  
**When** the user runs the command with `--help`  
**Then** command-specific help should be displayed  
**And** show argument descriptions  
**And** show usage examples  
**And** exit without executing the command

#### Scenario: Commands support multiple --ref flags

**Given** a command accepts references  
**When** the user provides multiple `--ref` flags  
**Then** all references should be resolved  
**And** passed to the command in the order specified

---

## Command Reference

### store

**Syntax:** `open-tasks store <value> [--token <name>]`

**Arguments:**
- `<value>`: The value to store (string)

**Options:**
- `--token <name>`: Assign a token to the reference

**Output:** Reference ID and output file path

---

### load

**Syntax:** `open-tasks load <filepath> [--token <name>]`

**Arguments:**
- `<filepath>`: Path to file to load (relative or absolute)

**Options:**
- `--token <name>`: Assign a token to the reference

**Output:** Reference ID and output file path

---

### replace

**Syntax:** `open-tasks replace <template> --ref <token> [--ref <token>...] [--token <name>]`

**Arguments:**
- `<template>`: Template string with `{{token}}` placeholders

**Options:**
- `--ref <token>`: Reference to use for replacement (can be repeated)
- `--token <name>`: Assign a token to the output reference

**Output:** Reference ID and output file path

---

### powershell

**Syntax:** `open-tasks powershell <script> [--ref <token>...] [--token <name>]`

**Arguments:**
- `<script>`: PowerShell script to execute

**Options:**
- `--ref <token>`: Reference to substitute in script (can be repeated)
- `--token <name>`: Assign a token to the output reference

**Output:** Reference ID, output file path, and exit code

---

### ai-cli

**Syntax:** `open-tasks ai-cli <prompt> [--ref <token>...] [--token <name>]`

**Arguments:**
- `<prompt>`: Prompt to send to AI CLI

**Options:**
- `--ref <token>`: Context reference to include (can be repeated)
- `--token <name>`: Assign a token to the output reference
- `--timeout <seconds>`: Override default timeout (default: 60)

**Output:** Reference ID and output file path

**Requires:** `.open-tasks/ai-config.json` configuration file

---

### extract

**Syntax:** `open-tasks extract <pattern> --ref <token> [--all] [--token <name>]`

**Arguments:**
- `<pattern>`: Regular expression pattern

**Options:**
- `--ref <token>`: Reference to extract from (required)
- `--all`: Extract all matches (default: first match only)
- `--token <name>`: Assign a token to the output reference

**Output:** Reference ID and output file path

---

## Configuration

### AI CLI Configuration

File: `.open-tasks/ai-config.json`

```json
{
  "command": "copilot",
  "args": ["chat"],
  "contextFlag": "--context",
  "promptFlag": null,
  "timeout": 60,
  "outputParser": "markdown"
}
```

**Fields:**
- `command`: Executable name or path
- `args`: Default arguments (array)
- `contextFlag`: Flag to pass context files (e.g., "--context")
- `promptFlag`: Flag for prompt (null if positional argument)
- `timeout`: Maximum execution time in seconds
- `outputParser`: How to parse output ("text", "json", "markdown")

---

## Technical Constraints

- All commands must extend the base `CommandHandler` class
- All commands must return `Promise<ReferenceHandle>`
- PowerShell command requires PowerShell 5.1 or later on Windows
- AI CLI command requires external tool to be installed and authenticated
- Extract command uses JavaScript RegExp engine (no PCRE features)

---

## Error Handling

All commands must handle these error cases:
1. Missing required arguments → Display usage and exit
2. Invalid argument values → Display error with guidance
3. Failed external processes → Capture stderr and display
4. Timeout → Terminate process and report
5. File system errors → Display clear error with path context
