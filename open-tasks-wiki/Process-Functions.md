# Commands in Open Tasks CLI

## Overview

Open Tasks CLI provides three types of commands that work together:

1. **System Commands** (`init`, `create`) - Manage project setup and scaffolding
2. **Built-in CLI Commands** (6 commands) - Core operations packaged with the CLI
3. **Process Commands** - Custom user-defined commands in `.open-tasks/commands/`

This guide focuses on the **built-in CLI commands** that perform specific operations and can be chained together to build complex workflows.

**Important Note**: The Context API functions (`context.store()`, `context.load()`, `context.transform()`, `context.run()`) mentioned in other documentation are internal programmatic APIs used by command implementations. They are NOT exposed as CLI commands and users never invoke them directly. This guide documents the user-facing CLI commands only.

## Working Directory Context

Open Tasks CLI operates in the current working directory (CWD) where you invoke it. All relative paths are resolved from this directory, and the `.open-tasks/` directory is created here.

### Directory Structure

```
your-working-directory/
├── .open-tasks/
│   ├── outputs/              # Command outputs (auto-created)
│   ├── commands/             # Custom commands (optional)
│   ├── config.json           # Configuration (optional)
│   └── ai-config.json        # AI configuration (optional)
├── [your files]
└── [your data]
```

## Built-in CLI Commands

Open Tasks CLI provides six built-in CLI commands that cover common operations. These are different from process commands (custom commands you create) and from the internal Context API:

### 1. store - Save Values

Store a value in memory and create a reference for later use.

**Syntax:**
```bash
open-tasks store <value> [--token <name>]
```

**Examples:**

```bash
# Store with auto-generated UUID
open-tasks store "Hello World"
# Output: ✓ Stored reference: a3f2c9d1-9b8e-4f6a-8b9c-1d2e3f4a5b6c
# File: .open-tasks/outputs/20251017-143000-001-a3f2c9d1-9b8e-4f6a-8b9c-1d2e3f4a5b6c.txt

# Store with memorable token
open-tasks store "Hello World" --token greeting
# Output: ✓ Stored reference: greeting
# File: .open-tasks/outputs/20251017-143000-001-greeting.txt

# Store multiline text
open-tasks store "Line 1
Line 2
Line 3" --token multiline
```

**Use Cases:**
- Save configuration values
- Store intermediate results
- Create reusable constants
- Build up context for AI prompts

---

### 2. load - Load Files

Read content from a file and create a reference.

**Syntax:**
```bash
open-tasks load <filepath> [--token <name>]
```

**Examples:**

```bash
# Load file with auto-generated UUID
open-tasks load ./data.txt

# Load file with token
open-tasks load ./README.md --token readme
open-tasks load ./package.json --token config

# Load from parent directory
open-tasks load ../shared/template.txt --token template

# Load binary file
open-tasks load ./image.png --token logo
```

**Use Cases:**
- Load source code for AI review
- Read configuration files
- Import templates
- Load data files for processing

---

### 3. replace - Template Substitution

Perform string replacement using `{{token}}` template syntax.

**Syntax:**
```bash
open-tasks replace <template> --ref <token> [--ref <token>...] [--token <name>]
```

**Examples:**

```bash
# Simple replacement
open-tasks store "Production" --token env
open-tasks replace "Environment: {{env}}" --ref env

# Multiple replacements
open-tasks store "Alice" --token name
open-tasks store "Developer" --token role
open-tasks replace "{{name}} is a {{role}}" --ref name --ref role

# Complex template
open-tasks store "myapp.com" --token domain
open-tasks store "8080" --token port
open-tasks replace "https://{{domain}}:{{port}}/api" --ref domain --ref port --token url
```

**Template Syntax:**
- Use `{{tokenName}}` as placeholders
- Token names must match reference tokens exactly
- Multiple references are supported
- Nested templates are not supported in v1

**Use Cases:**
- Generate configuration files
- Build URLs dynamically
- Create deployment scripts
- Parameterize commands

---

### 4. powershell - Execute Scripts

Execute PowerShell commands and capture output.

**Syntax:**
```bash
open-tasks powershell <script> [--ref <token>...] [--token <name>]
```

**Examples:**

```bash
# Simple command
open-tasks powershell "Get-Date"

# Get file listing
open-tasks powershell "Get-ChildItem -Path . -Name" --token files

# With reference substitution
open-tasks store "C:\Projects" --token path
open-tasks powershell "Get-ChildItem {{path}}" --ref path

# Multi-line script
open-tasks powershell "$files = Get-ChildItem; $files.Count" --token filecount

# Capture output for later use
open-tasks powershell "git log --oneline -10" --token gitlog
```

**Features:**
- Executes in PowerShell context
- Captures stdout and stderr
- Supports reference substitution in script
- Returns exit code information

**Use Cases:**
- Execute system commands
- Query system information
- Run deployment scripts
- Gather context for AI analysis

---

### 5. ai-cli - AI Integration

Execute AI CLI tools with context from references.

**Syntax:**
```bash
open-tasks ai-cli <prompt> [--ref <token>...] [--token <name>] [--timeout <seconds>]
```

**Setup Required:**
First, create `.open-tasks/ai-config.json`:

```json
{
  "command": "copilot",
  "args": ["chat"],
  "contextFlag": "--context",
  "promptFlag": null,
  "timeout": 60
}
```

**Examples:**

```bash
# Simple AI query
open-tasks ai-cli "What is TypeScript?"

# With context file
open-tasks load ./src/app.ts --token code
open-tasks ai-cli "Review this code for bugs" --ref code

# Multiple context files
open-tasks load ./README.md --token readme
open-tasks load ./package.json --token pkg
open-tasks ai-cli "Summarize this project" --ref readme --ref pkg --token summary

# Custom timeout
open-tasks ai-cli "Complex analysis..." --ref data --timeout 120
```

**Configuration Options:**

| Field | Description | Example |
|-------|-------------|---------|
| `command` | CLI executable name or path | `"copilot"`, `"aichat"` |
| `args` | Default arguments | `["chat"]` |
| `contextFlag` | Flag for context files | `"--context"`, `"-f"` |
| `promptFlag` | Flag for prompt (null if positional) | `"-p"`, `null` |
| `timeout` | Max execution time (seconds) | `60`, `120` |

**Use Cases:**
- Code review and analysis
- Documentation generation
- Bug detection
- Project summarization
- Technical writing assistance

---

### 6. extract - Regex Extraction

Extract data using regular expressions.

**Syntax:**
```bash
open-tasks extract <pattern> --ref <token> [--all] [--token <name>]
```

**Examples:**

```bash
# Extract first match
open-tasks store "Error on line 42" --token log
open-tasks extract "line (\d+)" --ref log
# Output: 42

# Extract all matches
open-tasks store "Email: alice@example.com, bob@example.com" --token text
open-tasks extract "[a-z]+@[a-z]+\.[a-z]+" --ref text --all
# Output: alice@example.com
#         bob@example.com

# Extract with capture groups
open-tasks store "Version: 1.2.3" --token ver
open-tasks extract "Version: (\d+)\.(\d+)\.(\d+)" --ref ver --token version

# Extract from file
open-tasks load ./app.log --token log
open-tasks extract "ERROR: (.*)" --ref log --all --token errors
```

**Pattern Syntax:**
- Standard JavaScript RegExp syntax
- Use capture groups `()` to extract specific parts
- Use `--all` flag to extract all matches (default: first match only)

**Use Cases:**
- Parse log files
- Extract version numbers
- Find email addresses or URLs
- Parse structured text
- Filter specific patterns

---

## Command Chaining

Commands can be chained by passing references between them.

### Basic Chain

```bash
# Load, transform, use
open-tasks load ./template.txt --token tmpl
open-tasks store "Production" --token env
open-tasks replace "{{content}} in {{env}}" --ref tmpl --ref env --token message
open-tasks ai-cli "Is this message correct?" --ref message
```

### Data Pipeline

```bash
# Gather → Process → Analyze
open-tasks powershell "Get-Content app.log" --token log
open-tasks extract "ERROR: (.*)" --ref log --all --token errors
open-tasks ai-cli "Categorize these errors" --ref errors --token analysis
```

### Multi-Source Context

```bash
# Combine multiple sources
open-tasks load ./README.md --token readme
open-tasks load ./src/main.ts --token code
open-tasks powershell "git log --oneline -5" --token commits
open-tasks ai-cli "Create release notes" --ref readme --ref code --ref commits
```

## Reference Management

### Tokens vs UUIDs

**Tokens** (user-provided):
- Human-readable names
- Use `--token <name>` when creating references
- Reference with `--ref <name>`
- Good for memorable references

**UUIDs** (auto-generated):
- Automatically created if no token provided
- Guaranteed unique
- Good for temporary references

### Reference Lifecycle

1. **Creation**: Command executes and creates a reference
2. **Storage**: Reference stored in memory and file written
3. **Usage**: Reference passed to other commands via `--ref`
4. **Persistence**: Files remain after CLI exits
5. **Session**: In-memory references cleared when CLI exits

### Output Files

All command outputs are written to `.open-tasks/outputs/` with this naming:

```
YYYYMMDD-HHmmss-SSS-{token|uuid}.txt
```

**Examples:**
- `20251017-143022-456-greeting.txt` (with token)
- `20251017-143022-456-a3f2c9d1-9b8e-4f6a-8b9c-1d2e3f4a5b6c.txt` (UUID)

**Benefits:**
- Chronological ordering (timestamp first)
- Unique identification (token or UUID)
- Easy traceability
- Persistent across sessions

## Common Patterns

### Pattern 1: Context Building

Build up context from multiple sources:

```bash
open-tasks load ./docs/requirements.md --token reqs
open-tasks load ./src/main.ts --token impl
open-tasks powershell "git diff HEAD~1" --token changes
open-tasks ai-cli "Does the implementation match requirements?" --ref reqs --ref impl --ref changes
```

### Pattern 2: Template Processing

Generate files from templates:

```bash
open-tasks load ./templates/config.template --token tmpl
open-tasks store "production" --token env
open-tasks store "api.myapp.com" --token host
open-tasks replace "{{tmpl}}" --ref tmpl --ref env --ref host > config.json
```

### Pattern 3: Log Analysis

Analyze and summarize logs:

```bash
open-tasks load ./app.log --token log
open-tasks extract "ERROR|WARN" --ref log --all --token issues
open-tasks ai-cli "Summarize the main issues" --ref issues --token summary
open-tasks store "{{summary}}" --ref summary > report.md
```

### Pattern 4: Code Review Workflow

```bash
# Get the code
open-tasks powershell "git diff main..feature" --token diff

# Analyze with AI
open-tasks ai-cli "Review this code change" --ref diff --token review

# Extract action items
open-tasks extract "TODO: (.*)" --ref review --all --token todos
```

## Best Practices

### 1. Use Meaningful Tokens

✅ **Good:**
```bash
open-tasks load ./config.json --token appconfig
open-tasks store "Production" --token environment
```

❌ **Avoid:**
```bash
open-tasks load ./config.json --token c1
open-tasks store "Production" --token x
```

### 2. Chain Related Operations

✅ **Good:**
```bash
open-tasks load ./data.csv --token data
open-tasks extract "\d+,\d+" --ref data --all --token numbers
open-tasks ai-cli "Analyze these numbers" --ref numbers
```

❌ **Avoid:**
```bash
open-tasks load ./data.csv
# Later, in a different session...
open-tasks ai-cli "Analyze numbers" # Reference is gone!
```

### 3. Keep Output Directory Clean

Periodically clean old outputs:

```bash
# PowerShell
Get-ChildItem .open-tasks/outputs -Filter "*.txt" | 
  Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | 
  Remove-Item

# Or manually
Remove-Item .open-tasks/outputs/202510* # Remove October files
```

### 4. Use Configuration

Create `.open-tasks/config.json` for consistent behavior:

```json
{
  "outputDir": ".open-tasks/outputs",
  "colors": true,
  "defaultFileExtension": "txt"
}
```

## Troubleshooting

### Reference Not Found

**Issue**: `Error: Reference 'mytoken' not found`

**Solution**: References only exist during a command chain. Create the reference first:
```bash
open-tasks store "value" --token mytoken
open-tasks replace "{{mytoken}}" --ref mytoken
```

### Command Not Working

**Issue**: Command doesn't execute

**Solutions**:
1. Check command syntax: `open-tasks <command> --help`
2. Verify references exist
3. Check file paths are correct
4. Review `.open-tasks/outputs/*.error` files

### Output Directory Full

**Issue**: Too many output files

**Solution**: Clean old outputs or configure a different directory:
```json
{
  "outputDir": "./task-outputs"
}
```

## System Commands

In addition to the six built-in CLI commands above, Open Tasks provides two **system commands** for project management:

### init - Initialize Project

Set up a new Open Tasks project in the current directory.

**Syntax:**
```bash
open-tasks init [--force]
```

**What it does:**
- Creates `.open-tasks/` directory structure
- Creates `.open-tasks/commands/` for your process commands
- Creates `.open-tasks/outputs/` for command outputs
- Generates default `config.json`
- Ensures `package.json` exists (creates if missing)
- Installs npm dependencies if needed

**Example:**
```bash
cd my-project
open-tasks init
```

### create - Scaffold Process Command

Create a new process command template in `.open-tasks/commands/`.

**Syntax:**
```bash
open-tasks create <command-name> [--typescript] [--description "<text>"]
```

**What it does:**
- Creates `.open-tasks/commands/<command-name>.js` (or `.ts`)
- Scaffolds a CommandHandler class template
- Includes example code and documentation
- Makes the command available immediately

**Examples:**
```bash
# Create JavaScript process command
open-tasks create my-process

# Create TypeScript process command
open-tasks create my-process --typescript

# Create with description
open-tasks create my-process --description "My custom data processor"
```

## Process Commands vs Built-in Commands

**Built-in CLI Commands** (this document):
- Six packaged commands: `store`, `load`, `replace`, `powershell`, `ai-cli`, `extract`
- Part of the CLI installation
- Cannot be modified by users
- General-purpose operations

**Process Commands** (see [Building Custom Commands](Building-Custom-Commands.md)):
- Custom commands you create in `.open-tasks/commands/`
- Extend CLI with your own functionality
- Can use Context API internally
- Project-specific or workflow-specific operations
- Created using `open-tasks create` command

**Context API** (internal - not CLI commands):
- `context.store()`, `context.load()`, `context.transform()`, `context.run()`
- Programmatic functions used inside command implementations
- NOT invoked directly by users
- NOT exposed as CLI commands

## Next Steps

- Learn [Building Custom Commands](Building-Custom-Commands.md) to create your own process commands
- Review [Architecture Overview](Architecture.md) for deeper understanding of the three-layer architecture
- See [Getting Started](Getting-Started.md) for complete workflows and examples
