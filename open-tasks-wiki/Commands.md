# Tasks and Commands Reference

This page provides a complete reference of all built-in tasks and commands in Open Tasks CLI.

## Understanding Tasks vs Commands

Open Tasks CLI distinguishes between **Tasks** and **Commands** based on their purpose and how they interact with the workflow:

### Tasks
**Tasks** are high-level operations that:
- Can be invoked directly from the command line (e.g., `open-tasks init`, `open-tasks create`)
- Implement the `ITaskHandler` interface with `execute(args, context)` method
- Receive full `ExecutionContext` with all workflow components
- Are stored in `src/tasks/` for built-in tasks or `.open-tasks/tasks/` for custom tasks
- Typically orchestrate workflows and may use commands internally

**Example built-in tasks:** `init`, `create`

### Commands  
**Commands** are lower-level operations that:
- Can be invoked directly from the command line like tasks (e.g., `open-tasks load`, `open-tasks powershell`)
- Can either implement `ITaskHandler` directly or extend `TaskHandler` base class
- May use the simpler `executeCommand(config, args, flow, synk)` signature when extending `TaskHandler`
- Are stored in `src/commands/` for built-in commands
- Focus on specific data operations (load, transform, execute)

**Example built-in commands:** `load`, `powershell`

### Key Differences

| Aspect | Tasks | Commands |
|--------|-------|----------|
| **Purpose** | Orchestrate workflows | Perform specific operations |
| **Interface** | `ITaskHandler.execute(args, context)` | `ITaskHandler` or `TaskHandler.executeCommand(config, args, flow, synk)` |
| **Location** | `src/tasks/` or `.open-tasks/tasks/` | `src/commands/` |
| **Complexity** | Can be complex workflows | Focused, atomic operations |
| **Usage** | `open-tasks <task-name>` | `open-tasks <command-name>` |

**Note:** From a user perspective, both tasks and commands are invoked the same way from the CLI. The distinction is primarily architectural.

## Built-in Tasks

### `init` - Initialize Project

Create the `.open-tasks` directory structure and configuration.

**Syntax:**
```bash
open-tasks init
```

**Creates:**
- `.open-tasks/` directory
- `.open-tasks/config.json` with defaults
- `.open-tasks/tasks/` for custom tasks
- `.open-tasks/outputs/` for command outputs

**Example:**
```bash
cd /path/to/your/project
open-tasks init
```

---

### `create` - Scaffold Custom Task

Create a new custom task template.

**Syntax:**
```bash
open-tasks create <task-name> [--typescript] [--description "description"]
```

**Arguments:**
- `<task-name>` - Name of the task (kebab-case)

**Options:**
- `--typescript` - Generate TypeScript instead of JavaScript
- `--description "text"` - Custom description for the task

**Example:**
```bash
open-tasks create validate-email --typescript --description "Validate email addresses"
```

**Output:**
Creates `.open-tasks/tasks/validate-email.ts` with a template implementing:
- Basic command structure
- Output builder usage
- Reference handling

## Built-in Commands

The following are the currently implemented built-in commands.

### `load` - Load Files

Load content from a file and create a reference.

**Syntax:**
```bash
open-tasks load <filepath> [--token <name>]
```

**Arguments:**
- `<filepath>` - Path to the file to load

**Options:**
- `--token <name>` - Named token for referencing

**Examples:**

```bash
# Load a text file
open-tasks load ./data.txt

# Load with token for later reference
open-tasks load ./template.html --token template

# Load JSON file
open-tasks load ./config.json --token config

# Load source code
open-tasks load ./src/api.ts --token source
```

**Output:**
- Reads file content
- Creates reference for use in other commands
- Stores in memory with optional token

---

### `powershell` - Execute PowerShell

Execute PowerShell scripts and capture output.

**Syntax:**
```bash
open-tasks powershell <script> [--token <name>]
```

**Arguments:**
- `<script>` - PowerShell script to execute

**Options:**
- `--token <name>` - Named token for output

**Examples:**

```bash
# Simple command
open-tasks powershell "Get-Date"

# Capture output for later use
open-tasks powershell "Get-Process | Select-Object -First 5" --token processes

# API call
open-tasks powershell "Invoke-RestMethod 'https://api.example.com/data'" --token api-data
```

**Requirements:**
- PowerShell must be installed and in PATH
- Scripts execute in a new PowerShell session

---

## Creating Custom Commands and Tasks

You can extend the CLI by creating custom commands and tasks in the `.open-tasks/tasks/` directory. See:
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Learn how to create custom task handlers
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Learn about creating commands with visual output
- **[Example Tasks](./Example-Tasks.md)** - See complete examples of custom tasks

---

## Planned Commands (Not Yet Implemented)

The following commands are planned for future releases:

### `store` - Store Values (Planned)

### `replace` - Template Substitution (Planned)

**Syntax:**
```bash
open-tasks replace <template> --ref <token1> [--ref <token2> ...]
```

**Arguments:**
- `<template>` - Template string with `{{token}}` placeholders

**Options:**
- `--ref <token>` - Reference token(s) to substitute (can be used multiple times)

**Token Format:**
- Use `{{token}}` in templates
- Tokens are case-sensitive
- Unreplaced tokens remain as-is (with warning)

**Examples:**

```bash
# Simple replacement
open-tasks store "World" --token name
open-tasks replace "Hello {{name}}!" --ref name

# Multiple replacements
open-tasks store "John" --token first
open-tasks store "Doe" --token last
open-tasks replace "Name: {{first}} {{last}}" --ref first --ref last

# Template from file
open-tasks load ./email-template.txt --token template
open-tasks store "user@example.com" --token email
open-tasks replace "{{template}}" --ref template --ref email
```

**Output:**
- Creates new file with substituted content
- Returns reference to result

---

### `extract` - Regex Extraction (Planned)

**Syntax:**
```bash
open-tasks extract <pattern> --ref <input> [--all] [--token <name>]
```

**Arguments:**
- `<pattern>` - Regular expression pattern

**Options:**
- `--ref <input>` - Reference to extract from
- `--all` - Extract all matches (newline-separated)
- `--token <name>` - Named token for result

**Flags:**
- Without `--all`: Extract first match only
- With `--all`: Extract all matches
- Capture groups: Returns captured groups, not full match

**Examples:**

```bash
# Extract first email
open-tasks store "Contact: support@example.com" --token contact
open-tasks extract "[a-z]+@[a-z.]+" --ref contact

# Extract all function names
open-tasks load ./api.ts --token source
open-tasks extract "export function ([a-zA-Z]+)" --ref source --all --token functions

# Extract with capture groups
open-tasks store "Name: John Doe" --token name
open-tasks extract "Name: ([A-Z][a-z]+) ([A-Z][a-z]+)" --ref name

# Extract numbers
open-tasks store "Price: $42.99" --token price
open-tasks extract "\$([0-9.]+)" --ref price --token amount
```

**Output:**
- First match or all matches based on `--all` flag
- If pattern has capture groups, returns groups instead of full match

---

## Execution Commands

### `powershell` - Execute PowerShell

Execute PowerShell scripts and capture output.

**Syntax:**
```bash
open-tasks powershell <script> [--ref <token1> ...] [--token <name>]
```

**Arguments:**
- `<script>` - PowerShell script to execute

**Options:**
- `--ref <token>` - Reference to substitute in script (can use `{{token}}` in script)
- `--token <name>` - Named token for output

**Examples:**

```bash
# Simple command
open-tasks powershell "Get-Date"

# With reference substitution
open-tasks store "C:\Users" --token path
open-tasks powershell "Get-ChildItem {{path}}" --ref path

# Capture output for later use
open-tasks powershell "Get-Process | Select-Object -First 5" --token processes

# API call
open-tasks powershell "Invoke-RestMethod 'https://api.example.com/data'" --token api-data
```

**Requirements:**
- PowerShell must be installed and in PATH
- Scripts execute in a new PowerShell session

---

### `ai-cli` - AI CLI Integration (Planned)

**Syntax:**
```bash
open-tasks ai-cli <prompt> [--ref <context1> ...] [--token <name>]
```

**Arguments:**
- `<prompt>` - Prompt to send to the AI CLI

**Options:**
- `--ref <context>` - Reference to pass as context file (can be used multiple times)
- `--token <name>` - Named token for AI response

**Configuration:** Create `.open-tasks/ai-config.json`:

```json
{
  "command": "gh copilot suggest",
  "contextFlag": "-t",
  "timeout": 30000
}
```

**Supported AI CLIs:**

#### GitHub Copilot CLI
```json
{
  "command": "gh copilot suggest",
  "contextFlag": "-t",
  "timeout": 30000
}
```

#### Custom AI Tool
```json
{
  "command": "python /path/to/ai-tool.py",
  "contextFlag": "--file",
  "timeout": 45000
}
```

**Examples:**

```bash
# Simple AI query
open-tasks ai-cli "How do I list files in PowerShell?"

# With context from file
open-tasks load ./code.ts --token code
open-tasks ai-cli "Explain this code" --ref code

# With multiple context files
open-tasks load ./api.ts --token api
open-tasks load ./types.ts --token types
open-tasks ai-cli "How do these files work together?" --ref api --ref types

# Save AI response for later use
open-tasks ai-cli "Suggest improvements" --ref code --token suggestions
```

**Context File Passing:**

When you use `--ref` flags, the AI CLI receives context files:
```bash
# This command:
open-tasks ai-cli "Explain this" --ref code

# Executes (approximately):
gh copilot suggest "Explain this" -t /path/to/code-file.txt
```

**Error Handling:**
- **Missing Configuration:** If `.open-tasks/ai-config.json` doesn't exist, command fails
- **Timeout:** If AI CLI doesn't respond within timeout, command fails
- **Non-zero Exit Code:** If AI CLI returns error, it's captured and displayed

---

## Global Options

These options work with all commands:

### Verbosity Flags

- `--quiet` or `-q` - Minimal single-line output
- `--summary` or `-s` - Default, brief formatted summary (default)
- `--verbose` or `-v` - Detailed sections and metadata

**Examples:**
```bash
open-tasks store "data" --quiet
open-tasks store "data" --summary
open-tasks store "data" --verbose
```

### Reference Flags

- `--ref <token>` - Load a reference by token or UUID
- `--token <name>` - Assign a token name to the output

**Examples:**
```bash
# Store with token
open-tasks store "value" --token mydata

# Use reference in another command
open-tasks replace "{{mydata}}" --ref mydata
```

### Output Directory

- `--dir <path>` - Custom output directory path

**Example:**
```bash
open-tasks store "data" --dir ./custom-output
```

---

## Reference Management

### Reference Types

1. **UUID References** - Automatically generated unique identifiers
2. **Token References** - User-defined named references

### Reference Format

In templates and scripts, use:
- `{{token}}` - Reference by token name
- Token names are case-sensitive

### Reference Lifetime

- References exist in memory during CLI execution
- Output files persist in `.open-tasks/outputs/{timestamp}-{command}/`
- References are NOT preserved across CLI invocations
- Use files for persistent storage between runs

### Output Directory Structure

Each command execution creates an isolated timestamped directory:

```
.open-tasks/
  outputs/
    20250118T143052-store/
      20250118T143052-greeting.txt
    20250118T143105-replace/
      20250118T143105-result.txt
    20250118T143120-extract/
      20250118T143120-emails.txt
```

**Benefits:**
- No file naming conflicts between executions
- Easy to track command history
- Clean separation of outputs
- Simplifies debugging

---

## Next Steps

- **[Example Tasks](./Example-Tasks.md)** - See commands in action
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Chain commands into workflows
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Create your own commands
- **[Architecture](./Architecture.md)** - Understand the system design
