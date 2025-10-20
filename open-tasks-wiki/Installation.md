# Installation & Getting Started

This guide will help you install Open Tasks CLI and get started with your first workflow.

## Requirements

- **Node.js** >= 18.0.0
- **PowerShell** (for `powershell` command, if needed)
- **AI CLI tool** (for `ai-cli` command, e.g., GitHub Copilot CLI - optional)

## Installation

### Option 1: Global Installation (Recommended)

Install globally to use `open-tasks` from anywhere:

```bash
npm install -g open-tasks-cli
```

Verify installation:

```bash
open-tasks --version
```

### Option 2: Local Installation

Install in your project:

```bash
npm install open-tasks-cli
```

Use with npx:

```bash
npx open-tasks --help
```

### Option 3: From Source

Clone and build from source:

```bash
git clone <repository-url>
cd open-tasks-cli
npm install
npm run build
npm link
```

## Project Initialization

Initialize Open Tasks in your project directory:

```bash
cd /path/to/your/project
open-tasks init
```

This creates:
```
.open-tasks/
├── config.json           # Project configuration
├── tasks/               # Custom tasks (JavaScript/TypeScript)
└── outputs/             # Command output files (auto-generated)
```

### Configuration

The `config.json` file controls project settings:

```json
{
  "outputDir": ".open-tasks/outputs",
  "customCommandsDir": ".open-tasks/tasks"
}
```

**Configuration Options:**
- `outputDir` - Where command outputs are saved (default: `.open-tasks/outputs`)
- `customCommandsDir` - Where custom tasks are loaded from (default: `.open-tasks/tasks`)

### User-Level Configuration

Create `~/.open-tasks/config.json` for global defaults:

```json
{
  "outputDir": ".open-tasks/outputs",
  "defaultVerbosity": "summary"
}
```

**Configuration Precedence:**
1. Project config (`.open-tasks/config.json`)
2. User config (`~/.open-tasks/config.json`)
3. Built-in defaults

## First Steps

### 1. Store Your First Value

```bash
open-tasks store "Hello, World!" --token greeting
```

**Output:**
```
✓ store completed in 12ms
📁 Saved to: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference: @greeting
```

### 2. Load a File

```bash
open-tasks load ./README.md --token readme
```

**Output:**
```
✓ load completed in 8ms
📁 Saved to: .open-tasks/outputs/20241018-130152-load/readme.txt
🔗 Reference: @readme
```

### 3. Extract Data with Regex

```bash
open-tasks store "Contact: support@example.com" --token contact
open-tasks extract "[a-z]+@[a-z.]+" --ref contact --token email
```

**Output:**
```
✓ extract completed in 15ms
📁 Saved to: .open-tasks/outputs/20241018-130205-extract/email.txt
🔗 Reference: @email
```

### 4. Chain Commands Together

```bash
# Load a template
open-tasks load ./template.html --token template

# Store a variable
open-tasks store "John Doe" --token name

# Replace in template
open-tasks replace "{{template}}" --ref template --ref name
```

## Output Control

### Verbosity Levels

Control how much detail commands output:

```bash
# Quiet mode - minimal output
open-tasks store "data" --quiet
✓ store completed in 45ms

# Summary mode - default, clean output (default)
open-tasks store "data"
✓ store completed in 45ms
📁 Saved to: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference: @mytoken

# Verbose mode - detailed information
open-tasks store "data" --verbose
(shows processing details, file info, metadata)
```

**Flags:**
- `--quiet` or `-q` - Minimal single-line output
- `--summary` or `-s` - Default, brief formatted summary
- `--verbose` or `-v` - Detailed sections and metadata

## AI CLI Integration

To use the `ai-cli` command, create `.open-tasks/ai-config.json`:

### GitHub Copilot CLI

```json
{
  "command": "gh copilot suggest",
  "contextFlag": "-t",
  "timeout": 30000
}
```

**Usage:**
```bash
open-tasks ai-cli "How do I parse JSON in PowerShell?"
```

### Custom AI Tool

```json
{
  "command": "python /path/to/ai-tool.py",
  "contextFlag": "--file",
  "timeout": 45000
}
```

**Configuration Options:**
- `command` (required) - The AI CLI command to execute
- `contextFlag` (optional) - Flag used to pass context files (default: `-t`)
- `timeout` (optional) - Command timeout in milliseconds (default: 30000)

## Troubleshooting

### Command Not Found

If `open-tasks` isn't recognized:

```bash
# Verify installation
npm list -g open-tasks-cli

# Re-link if needed
npm link
```

### Custom Commands Not Loading

Ensure your custom tasks are:
1. In the correct directory (`.open-tasks/tasks/`)
2. Exported as default: `export default class MyCommand extends TaskHandler`
3. Have a `.ts` or `.js` extension

### AI CLI Not Working

1. **Verify configuration exists:**
   ```bash
   cat .open-tasks/ai-config.json
   ```

2. **Test AI CLI directly:**
   ```bash
   gh copilot suggest "test prompt"
   ```

3. **Check timeout setting if slow:**
   ```json
   { "timeout": 60000 }
   ```

## Next Steps

Now that you're set up:

- **[Commands](./Commands.md)** - Learn about all available commands
- **[Example Tasks](./Example-Tasks.md)** - See real-world workflow examples
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Create your own workflows
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Extend with custom commands

---

**Need Help?** Check the [Commands](./Commands.md) reference or see [Example Tasks](./Example-Tasks.md) for ready-to-use workflows.
