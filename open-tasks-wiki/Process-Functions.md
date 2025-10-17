# Process Functions in Working Directory

## Overview

Process functions (commands) are the core building blocks of Open Tasks CLI. Each command performs a specific operation and can be chained together to build complex workflows. This guide explains how to use commands effectively in your working directory.

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

## Built-in Commands

Open Tasks CLI provides six built-in commands that cover common operations:

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

## Next Steps

- Learn [Building Custom Commands](Building-Custom-Commands.md) to extend functionality
- Review [Architecture Overview](Architecture.md) for deeper understanding
- See [API Reference](API-Reference.md) for complete command documentation
