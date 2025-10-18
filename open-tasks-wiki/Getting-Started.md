# Getting Started with Open Tasks CLI

## Welcome!

This guide will walk you through your first steps with Open Tasks CLI, from installation to creating your first workflow.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18.x or later installed
- npm 8.x or later
- Basic familiarity with command-line tools

## Step 1: Installation

Install Open Tasks CLI globally:

```bash
npm install -g open-tasks-cli
```

Verify the installation:

```bash
open-tasks --version
```

You should see the version number displayed.

## Step 2: Initialize Your Project

Navigate to your project directory and initialize Open Tasks:

```bash
cd your-project-directory
open-tasks init
```

This creates the `.open-tasks/` directory structure:
```
.open-tasks/
├── commands/     # Your custom process commands
├── outputs/      # Command output files
└── config.json   # Configuration (optional)
```

**Note**: The `init` command is a **system command** that sets up your project. It's not a process command and is distinct from the built-in CLI commands you'll use for operations.

## Step 3: Your First CLI Command

Let's start with the simplest command - storing a value:

```bash
open-tasks store "Hello, World!" --token greeting
```

You should see output like:

```
✓ Stored reference: greeting
  File: .open-tasks/outputs/20251017-143022-456-greeting.txt
```

**What happened?**
1. The CLI stored "Hello, World!" in memory
2. Created a reference with token "greeting"
3. Wrote the value to a timestamped file
4. Displayed the reference ID and file path

Check the output file:

```bash
# Windows PowerShell
Get-Content .open-tasks/outputs/*-greeting.txt

# macOS/Linux
cat .open-tasks/outputs/*-greeting.txt
```

## Step 4: Loading Files

Load content from a file:

```bash
# Create a sample file
echo "This is a test file" > sample.txt

# Load it with Open Tasks
open-tasks load ./sample.txt --token sample
```

The file content is now stored in a reference called "sample".

## Step 5: Chaining Commands

Now let's chain commands together:

```bash
# Store two values
open-tasks store "Alice" --token name
open-tasks store "Developer" --token role

# Combine them using replace
open-tasks replace "{{name}} is a {{role}}" --ref name --ref role
```

Output:
```
✓ Reference created: a3f2c9d1-...
  File: .open-tasks/outputs/20251017-143100-789-a3f2c9d1-....txt
  Content: Alice is a Developer
```

**What happened?**
1. First two commands stored "Alice" and "Developer"
2. Replace command used `{{name}}` and `{{role}}` as placeholders
3. Substituted the references into the template
4. Created a new reference with the result

## Step 5: Working with Files

Create a more complex workflow:

```bash
# Load your README
open-tasks load ./README.md --token readme

# Load package.json
open-tasks load ./package.json --token config

# Extract version from package.json
open-tasks extract '"version": "([^"]+)"' --ref config --token version
```

## Step 6: PowerShell Integration

Execute PowerShell commands:

```bash
# Get current directory listing
open-tasks powershell "Get-ChildItem -Name" --token files

# Get git status
open-tasks powershell "git status --short" --token gitstatus

# With reference substitution
open-tasks store "*.txt" --token pattern
open-tasks powershell "Get-ChildItem -Filter {{pattern}}" --ref pattern
```

## Step 7: Setting Up AI Integration (Optional)

If you want to use the AI CLI integration:

### 1. Create AI Configuration

Create `.open-tasks/ai-config.json`:

```json
{
  "command": "copilot",
  "args": ["chat"],
  "contextFlag": "--context",
  "promptFlag": null,
  "timeout": 60
}
```

### 2. Use AI Commands

```bash
# Load some code
open-tasks load ./src/app.ts --token code

# Ask AI to review it
open-tasks ai-cli "Review this code for potential bugs" --ref code --token review

# View the review
cat .open-tasks/outputs/*-review.txt
```

## Step 8: Building a Complete Workflow

Let's put it all together with a real-world example:

### Scenario: Generate a Project Summary

```bash
# 1. Gather project information
open-tasks load ./README.md --token readme
open-tasks load ./package.json --token package
open-tasks powershell "git log --oneline -10" --token commits
open-tasks powershell "Get-ChildItem -Recurse -File | Measure-Object -Line -Sum | Select-Object -ExpandProperty Lines" --token linecount

# 2. Create a summary template
open-tasks store "Project has {{linecount}} lines of code across {{commits}} recent commits." --token summary-template

# 3. Fill in the template
open-tasks replace "{{summary-template}}" --ref summary-template --ref linecount --ref commits --token summary

# 4. Send to AI for analysis (if configured)
open-tasks ai-cli "Provide insights about this project" --ref readme --ref package --ref summary --token insights

# 5. View the insights
cat .open-tasks/outputs/*-insights.txt
```

## Common Patterns

### Pattern 1: Quick Value Storage

Store frequently used values:

```bash
open-tasks store "https://api.myapp.com" --token api-url
open-tasks store "production" --token environment
open-tasks store "v1.2.3" --token version
```

### Pattern 2: Template Generation

Generate configuration files:

```bash
# Store template
open-tasks load ./config.template.json --token template

# Store values
open-tasks store "myapp-prod" --token app-name
open-tasks store "eastus" --token region

# Generate config
open-tasks replace "{{template}}" --ref template --ref app-name --ref region > config.prod.json
```

### Pattern 3: Log Analysis

Analyze log files:

```bash
# Load logs
open-tasks load ./app.log --token logs

# Extract errors
open-tasks extract "ERROR: (.*)" --ref logs --all --token errors

# Get AI summary
open-tasks ai-cli "Summarize these errors and suggest fixes" --ref errors
```

### Pattern 4: Code Documentation

Generate documentation:

```bash
# Load source files
open-tasks load ./src/main.ts --token main
open-tasks load ./src/utils.ts --token utils

# Generate docs
open-tasks ai-cli "Create API documentation for these files" --ref main --ref utils --token docs

# Save to file
cat .open-tasks/outputs/*-docs.txt > API.md
```

## Understanding References

### What are References?

References are pointers to command outputs that you can reuse in subsequent commands.

**Two types:**

1. **Tokens** (your choice):
   ```bash
   open-tasks store "data" --token mydata
   ```
   - Human-readable: "mydata"
   - Easy to remember and reference

2. **UUIDs** (automatic):
   ```bash
   open-tasks store "data"
   ```
   - Auto-generated: "a3f2c9d1-b4e5-4f6a-8b9c-1d2e3f4a5b6c"
   - Guaranteed unique

### Using References

```bash
# Create a reference
open-tasks store "Hello" --token greeting

# Use it in another command
open-tasks replace "{{greeting}} World" --ref greeting

# Use multiple references
open-tasks store "Hello" --token greeting
open-tasks store "World" --token target
open-tasks replace "{{greeting}} {{target}}" --ref greeting --ref target
```

### Reference Lifecycle

1. **Creation**: Command executes → reference created
2. **Usage**: Pass `--ref token` to other commands
3. **Persistence**: Files remain in `.open-tasks/outputs/`
4. **Session**: In-memory references cleared on exit

**Important:** References only exist during the CLI session. Files persist across sessions.

## Directory Structure

After your first commands, you'll have:

```
your-project/
├── .open-tasks/
│   └── outputs/
│       ├── 20251017-143022-456-greeting.txt
│       ├── 20251017-143100-789-name.txt
│       └── 20251017-143150-123-role.txt
└── [your project files]
```

## Getting Help

### Command Help

Get help for any command:

```bash
# General help
open-tasks --help

# Command-specific help
open-tasks store --help
open-tasks replace --help
open-tasks ai-cli --help
```

### Viewing Output Files

All outputs are saved to `.open-tasks/outputs/`:

```bash
# Windows PowerShell
Get-ChildItem .open-tasks/outputs | Sort-Object LastWriteTime -Descending | Select-Object -First 5

# macOS/Linux
ls -lt .open-tasks/outputs | head -5
```

### Error Files

If a command fails, check the error file:

```bash
# Find error files
ls .open-tasks/outputs/*.error

# View most recent error
cat .open-tasks/outputs/$(ls -t .open-tasks/outputs/*.error | head -1)
```

## Configuration (Optional)

Create `.open-tasks/config.json` for custom settings:

```json
{
  "outputDir": ".open-tasks/outputs",
  "colors": true,
  "defaultFileExtension": "txt"
}
```

## Best Practices

### 1. Use Meaningful Tokens

✅ **Good:**
```bash
open-tasks store "Production" --token environment
open-tasks load ./config.json --token app-config
```

❌ **Avoid:**
```bash
open-tasks store "Production" --token e
open-tasks load ./config.json --token c
```

### 2. Chain Related Operations

Keep related operations together:

```bash
# Good: Complete workflow
open-tasks load ./data.txt --token data
open-tasks extract "\d+" --ref data --all --token numbers
open-tasks ai-cli "Analyze these numbers" --ref numbers
```

### 3. Name Output Files Descriptively

Use clear tokens so you can find files later:

```bash
open-tasks powershell "git log --oneline -10" --token recent-commits
open-tasks ai-cli "Summarize changes" --ref recent-commits --token commit-summary
```

### 4. Clean Up Old Outputs

Periodically clean the output directory:

```bash
# PowerShell: Remove files older than 7 days
Get-ChildItem .open-tasks/outputs | 
  Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | 
  Remove-Item
```

## Troubleshooting

### "Command not found"

**Solution:**
```bash
# Reinstall
npm install -g open-tasks-cli

# Verify
open-tasks --version
```

### "Reference not found"

**Problem:** You're trying to use a reference that doesn't exist.

**Solution:** Create the reference first:
```bash
open-tasks store "value" --token mytoken
open-tasks replace "{{mytoken}}" --ref mytoken
```

### "Permission denied"

**Solution:** Check file permissions or run with appropriate rights.

## Creating Your First Process Command

**What are Process Commands?**

Process commands are custom user-defined commands you create in `.open-tasks/commands/` to extend the CLI with your own functionality. They're different from:
- **System Commands** (`init`, `create`) - manage project setup
- **Built-in CLI Commands** (`store`, `load`, `replace`, etc.) - packaged operations
- **Context API** (`context.store()`, `context.load()`, etc.) - internal programmatic API (not exposed as CLI commands)

### Step 1: Create a Process Command Template

Use the `create` system command to scaffold a new process command:

```bash
open-tasks create my-process
```

This creates `.open-tasks/commands/my-process.js` with a template:

```javascript
// .open-tasks/commands/my-process.js
export default class MyProcess extends CommandHandler {
  async execute(args, refs, context) {
    // Your custom logic here
    const value = args[0] || "default value";
    
    // Use the Context API internally
    return await context.store(value, "my-process-output");
  }
}
```

### Step 2: Implement Your Logic

Edit the file to add your custom functionality:

```javascript
export default class MyProcess extends CommandHandler {
  async execute(args, refs, context) {
    // Get input from references
    const input = refs.get('input')?.content || args[0];
    
    // Do some processing
    const processed = input.toUpperCase();
    
    // Store the result using Context API
    return await context.store(processed, args.token || 'processed');
  }
}
```

### Step 3: Use Your Process Command

```bash
# Your custom command is now available!
open-tasks my-process "hello world" --token result
# Output: HELLO WORLD

# Or with a reference
open-tasks store "hello world" --token input
open-tasks my-process --ref input --token result
```

### Key Points About Process Commands

- **Location**: Must be in `.open-tasks/commands/` directory
- **Naming**: Filename becomes command name (e.g., `my-process.js` → `my-process`)
- **API Access**: Can use Context API internally (`context.store()`, `context.load()`, etc.)
- **User Interface**: Invoked as CLI commands (`open-tasks my-process`)
- **Auto-discovery**: CLI automatically finds and registers them at startup

## Next Steps

Now that you're familiar with the basics:

1. **Explore Built-in CLI Commands**: Read [Process Functions](Process-Functions.md) for detailed documentation on the six built-in commands

2. **Build Advanced Process Commands**: Learn to create complex custom commands in [Building Custom Commands](Building-Custom-Commands.md)

3. **Understand Architecture**: Deep dive into the system architecture and the distinction between Context API, CLI Commands, and Process Commands in [Architecture Overview](Architecture.md)

4. **Review Examples**: Check out more complex workflows and patterns

## Quick Reference Card

```bash
# Store a value
open-tasks store "value" --token name

# Load a file
open-tasks load ./file.txt --token name

# Template replacement
open-tasks replace "{{token}}" --ref token

# Execute PowerShell
open-tasks powershell "command"

# AI integration (requires setup)
open-tasks ai-cli "prompt" --ref context

# Extract with regex
open-tasks extract "pattern" --ref source --all

# Get help
open-tasks --help
open-tasks <command> --help

# View outputs
ls .open-tasks/outputs
```

## Community and Support

- **Issues**: Report bugs or request features
- **Discussions**: Share workflows and patterns
- **Documentation**: Contribute improvements

Happy automating! 🚀
