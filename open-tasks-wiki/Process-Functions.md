# Pre-built Commands in Open Tasks CLI

## Overview

Open Tasks CLI provides a rich library of **pre-built commands** that you can use to build custom tasks. These commands implement the `ICommand` interface and can be composed together within your task files.

**Architecture**:
- **Tasks** = Files in `.open-tasks/tasks/` that extend TaskHandler
- **Commands** = ICommand implementations that consume and produce MemoryRef[]
- **Pre-built Commands** = Library of commands provided by the framework
- **Custom Commands** = Commands you create within your task files

**How to Use**: You compose pre-built commands within your task files using `context.run(command)`. Commands work together by passing MemoryRef[] between them.

**Important Note**: The IWorkflowContext API (`context.store()`, `context.token()`, `context.run()`) is used internally within tasks to execute commands and manage memory. It is not directly exposed as CLI commands.

## Working Directory Context

Open Tasks CLI operates in the current working directory (CWD) where you invoke it. All relative paths are resolved from this directory, and the `.open-tasks/` directory is created here.

### Directory Structure

```
your-working-directory/
├── .open-tasks/
│   ├── outputs/              # Command outputs (auto-created)
│   ├── tasks/                # Custom task files (optional)
│   ├── config.json           # Configuration (optional)
│   └── ai-config.json        # AI configuration (optional)
├── [your files]
└── [your data]
```

## Pre-built Command Library

Open Tasks CLI provides a comprehensive library of pre-built commands that cover common operations. Use these commands within your tasks by importing and running them with `context.run()`.

### PowershellCommand - Execute Shell Commands

Execute PowerShell commands and capture output.

**Constructor:**
```typescript
new PowershellCommand(command: string)
```

**Usage in Tasks:**

```typescript
import { PowershellCommand } from 'open-tasks-cli';

// In your task's execute() method:
const cmd = new PowershellCommand('Get-Content ./data.txt');
const [outputRef] = await context.run(cmd);
```

**Examples:**

```typescript
// Read file content
const readCmd = new PowershellCommand('Get-Content ./README.md');
const [readmeRef] = await context.run(readCmd);

// List directory
const lsCmd = new PowershellCommand('Get-ChildItem');
const [listRef] = await context.run(lsCmd);

// Execute git command
const gitCmd = new PowershellCommand('git log --oneline -5');
const [logRef] = await context.run(gitCmd);
```

**Use Cases:**
- File system operations
- Execute git commands
- Run build scripts
- Query system information

---

### ClaudeCommand - AI Processing

Process inputs using Claude AI.

**Constructor:**
```typescript
new ClaudeCommand(prompt: string, inputs: MemoryRef[])
```

**Usage in Tasks:**

```typescript
import { ClaudeCommand } from 'open-tasks-cli';

// In your task's execute() method:
const codeRef = await context.store(code, [new TokenDecorator('code')]);
const aiCmd = new ClaudeCommand(
  "Review this code for bugs",
  [codeRef]
);
const [reviewRef] = await context.run(aiCmd);
```

**Examples:**

```typescript
// Analyze code
const codeRef = await context.store(sourceCode, [new TokenDecorator('code')]);
const analyzeCmd = new ClaudeCommand(
  "Analyze this code for security issues",
  [codeRef]
);
const [analysisRef] = await context.run(analyzeCmd);

// Generate documentation
const apiRef = await context.store(apiSpec, [new TokenDecorator('api')]);
const docCmd = new ClaudeCommand(
  "Generate API documentation in Markdown",
  [apiRef]
);
const [docsRef] = await context.run(docCmd);

// Summarize multiple files
const file1Ref = await context.store(content1, [new TokenDecorator('f1')]);
const file2Ref = await context.store(content2, [new TokenDecorator('f2')]);
const summaryCmd = new ClaudeCommand(
  "Summarize these files",
  [file1Ref, file2Ref]
);
const [summaryRef] = await context.run(summaryCmd);
```

**Use Cases:**
- Code review and analysis
- Generate documentation
- Transform data formats
- Summarize content

---

### RegexCommand - Pattern Matching

Apply regex patterns to extract or transform text.

**Constructor:**
```typescript
new RegexCommand(pattern: string, replacement: string, input: MemoryRef)
```

**Usage in Tasks:**

```typescript
import { RegexCommand } from 'open-tasks-cli';

// In your task's execute() method:
const textRef = await context.store(text, [new TokenDecorator('text')]);
const regexCmd = new RegexCommand(
  '/\\d{3}-\\d{4}/',
  '***-****',
  textRef
);
const [maskedRef] = await context.run(regexCmd);
```

**Examples:**

```typescript
// Extract email addresses
const emailRegex = new RegexCommand(
  '/[\\w.-]+@[\\w.-]+\\.\\w+/g',
  '',
  contentRef
);
const [emailsRef] = await context.run(emailRegex);

// Mask sensitive data
const maskCmd = new RegexCommand(
  '/\\b\\d{4}-\\d{4}-\\d{4}-\\d{4}\\b/g',
  'XXXX-XXXX-XXXX-XXXX',
  dataRef
);
const [maskedRef] = await context.run(maskCmd);

// Replace URLs
const urlCmd = new RegexCommand(
  '/https?:\\/\\/[^\\s]+/g',
  '[LINK]',
  htmlRef
);
const [cleanRef] = await context.run(urlCmd);
```

**Use Cases:**
- Extract data patterns
- Mask sensitive information
- Clean up text
- Parse structured content

---

### TemplateCommand - Text Substitution

Perform template variable substitution.

**Constructor:**
```typescript
new TemplateCommand(template: string, variables: Map<string, MemoryRef>)
```

**Usage in Tasks:**

```typescript
import { TemplateCommand } from 'open-tasks-cli';

// In your task's execute() method:
const nameRef = await context.store("Alice", [new TokenDecorator('name')]);
const roleRef = await context.store("Developer", [new TokenDecorator('role')]);

const variables = new Map([
  ['name', nameRef],
  ['role', roleRef]
]);

const templateCmd = new TemplateCommand(
  "{{name}} is a {{role}}",
  variables
);
const [resultRef] = await context.run(templateCmd);
```

**Examples:**

```typescript
// Generate configuration
const domainRef = await context.store("example.com", [new TokenDecorator('domain')]);
const portRef = await context.store("8080", [new TokenDecorator('port')]);

const vars = new Map([
  ['domain', domainRef],
  ['port', portRef]
]);

const configCmd = new TemplateCommand(
  "server: https://{{domain}}:{{port}}/api",
  vars
);
const [configRef] = await context.run(configCmd);

// Build deployment script
const envRef = await context.store("production", [new TokenDecorator('env')]);
const versionRef = await context.store("v1.2.3", [new TokenDecorator('version')]);

const deployVars = new Map([
  ['env', envRef],
  ['version', versionRef]
]);

const deployCmd = new TemplateCommand(
  "deploy --env={{env}} --version={{version}}",
  deployVars
);
const [deployRef] = await context.run(deployCmd);
```

**Use Cases:**
- Generate configuration files
- Build dynamic commands
- Create parameterized scripts
- Interpolate variables

---

### FileCommand - File Operations

Read and write files with various operations.

**Constructor:**
```typescript
new FileCommand(operation: 'read' | 'write' | 'append', filePath: string, content?: MemoryRef)
```

**Usage in Tasks:**

```typescript
import { FileCommand } from 'open-tasks-cli';

// Read file
const readCmd = new FileCommand('read', './data.txt');
const [contentRef] = await context.run(readCmd);

// Write file
const dataRef = await context.store("new content", [new TokenDecorator('data')]);
const writeCmd = new FileCommand('write', './output.txt', dataRef);
await context.run(writeCmd);

// Append to file
const appendCmd = new FileCommand('append', './log.txt', logRef);
await context.run(appendCmd);
```

**Use Cases:**
- Read configuration files
- Write generated output
- Append to logs
- Manage file content

---

## Composing Commands in Tasks

Commands are designed to be composed together within tasks. Each command consumes MemoryRef[] and produces MemoryRef[], allowing you to chain operations:

```typescript
export default class AnalyzeAndDocumentTask extends TaskHandler {
  static name = 'analyze-docs';
  
  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    const outcome: TaskOutcome = {
      id: generateId(),
      name: 'analyze-docs',
      logs: [],
      errors: []
    };
    
    try {
      // 1. Read file with PowershellCommand
      const readCmd = new PowershellCommand(`Get-Content ${args[0]}`);
      const [codeRef] = await context.run(readCmd);
      
      // 2. Analyze with ClaudeCommand
      const analyzeCmd = new ClaudeCommand(
        "Analyze this code and identify issues",
        [codeRef]
      );
      const [analysisRef] = await context.run(analyzeCmd);
      
      // 3. Generate docs with ClaudeCommand
      const docCmd = new ClaudeCommand(
        "Generate documentation based on this analysis",
        [codeRef, analysisRef]
      );
      const [docsRef] = await context.run(docCmd);
      
      // 4. Write to file
      const writeCmd = new FileCommand('write', './docs/analysis.md', docsRef);
      await context.run(writeCmd);
      
      // Track all operations
      outcome.logs.push(
        { ...codeRef, command: 'PowershellCommand', args: [args[0]], start: new Date(), end: new Date() },
        { ...analysisRef, command: 'ClaudeCommand', args: [], start: new Date(), end: new Date() },
        { ...docsRef, command: 'ClaudeCommand', args: [], start: new Date(), end: new Date() }
      );
    } catch (error) {
      outcome.errors.push(error.message);
    }
    
    return outcome;
  }
}
```

## Memory Decorators

Decorators enhance MemoryRef storage with additional metadata:

### TokenDecorator

Add a named token to a MemoryRef:

```typescript
const ref = await context.store(
  value,
  [new TokenDecorator('mytoken')]
);
```

### TimestampDecorator

Add timestamp metadata:

```typescript
const ref = await context.store(
  value,
  [new TimestampDecorator()]
);
```

### MetadataDecorator

Add custom metadata:

```typescript
const ref = await context.store(
  value,
  [new MetadataDecorator({ author: 'Alice', version: '1.0' })]
);
```

## Best Practices

### 1. Use Pre-built Commands First

Before creating custom commands, check if a pre-built command meets your needs:

```typescript
// Good - use pre-built command
const cmd = new PowershellCommand('Get-Content ./file.txt');
const [contentRef] = await context.run(cmd);

// Less ideal - custom file reading (unless you need special handling)
class CustomFileReader implements ICommand {
  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    // Custom file reading logic...
  }
}
```

### 2. Chain Commands for Complex Workflows

Break complex tasks into command chains:

```typescript
// 1. Read
const readCmd = new PowershellCommand('Get-Content ./data.txt');
const [dataRef] = await context.run(readCmd);

// 2. Transform
const transformCmd = new RegexCommand('/old/g', 'new', dataRef);
const [transformedRef] = await context.run(transformCmd);

// 3. Process with AI
const aiCmd = new ClaudeCommand("Improve this", [transformedRef]);
const [improvedRef] = await context.run(aiCmd);

// 4. Write
const writeCmd = new FileCommand('write', './output.txt', improvedRef);
await context.run(writeCmd);
```

### 3. Track All Operations

Add TaskLog entries for transparency:

```typescript
outcome.logs.push({
  ...resultRef,
  command: 'PowershellCommand',
  args: commandArgs,
  start: startTime,
  end: new Date()
});
```

### 4. Handle Errors Properly

Add errors to TaskOutcome:

```typescript
try {
  const cmd = new PowershellCommand(script);
  const [resultRef] = await context.run(cmd);
  // ... success logic
} catch (error) {
  outcome.errors.push(`Command failed: ${error.message}`);
}
```

## Next Steps

- Read [Building Custom Tasks](Building-Custom-Tasks.md) to learn how to create custom commands
- Review [Architecture Overview](Architecture.md) for deeper understanding
- See OpenSpec specifications for complete API reference
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
