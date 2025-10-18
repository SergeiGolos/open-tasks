# Installation

## Prerequisites

Before installing Open Tasks CLI, ensure you have:

- **Node.js**: Version 18.x or later
- **npm**: Version 8.x or later (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux

Verify your installation:

```bash
node --version  # Should show v18.x or higher
npm --version   # Should show 8.x or higher
```

## Installation Methods

### Global Installation (Recommended)

Install Open Tasks CLI globally to use it from any directory:

```bash
npm install -g open-tasks-cli
```

Verify the installation:

```bash
open-tasks --version
```

You should see the version number displayed. Now you can use `open-tasks` from any directory.

### Local Project Installation

Install as a development dependency in your project:

```bash
npm install --save-dev open-tasks-cli
```

Use it via npx:

```bash
npx open-tasks --version
```

Or add it to your package.json scripts:

```json
{
  "scripts": {
    "tasks": "open-tasks"
  }
}
```

Then run:

```bash
npm run tasks -- --version
```

## Initial Setup

### Using the `init` System Command (Recommended)

After installation, initialize your project:

```bash
cd your-project-directory
open-tasks init
```

**What `init` does:**
- Creates `.open-tasks/` directory structure
- Creates `.open-tasks/tasks/` for custom task files
- Creates `.open-tasks/outputs/` for command outputs
- Generates default `config.json` with sensible defaults
- Ensures `package.json` exists (creates if missing)
- Sets up npm dependencies

**Result:**
```
.open-tasks/
├── tasks/        # Your custom task files go here
├── outputs/      # Command output files
└── config.json   # Configuration (optional customization)
```

### Manual Setup (Alternative)

If you prefer manual setup or need custom configuration:

### 1. Create Output Directory

Open Tasks CLI automatically creates the output directory when needed, but you can create it manually:

```bash
mkdir -p .open-tasks/outputs
```

### 2. Create Configuration (Optional)

Create a configuration file at `.open-tasks/config.json`:

```json
{
  "outputDir": ".open-tasks/outputs",
  "customTasksDir": ".open-tasks/tasks",
  "timestampFormat": "YYYYMMDD-HHmmss-SSS",
  "defaultFileExtension": "txt",
  "colors": true
}
```

**Configuration is optional** - the CLI works with zero configuration using sensible defaults.

### 3. Set Up AI CLI Integration (Optional)

If you plan to use the `ai-cli` command, create `.open-tasks/ai-config.json`:

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

Adjust the configuration based on your AI CLI tool:

**For GitHub Copilot CLI:**
```json
{
  "command": "copilot",
  "args": ["chat"],
  "contextFlag": "--context",
  "promptFlag": null,
  "timeout": 60
}
```

**For Custom AI Tool:**
```json
{
  "command": "ai-assistant",
  "args": ["query"],
  "contextFlag": "-f",
  "promptFlag": "-p",
  "timeout": 120
}
```

## Verify Installation

Run a simple test:

```bash
# Test the CLI
open-tasks --version

# Initialize a project (creates .open-tasks/ structure)
open-tasks init

# Store a value
open-tasks store "Hello World" --token test

# Check the output directory
ls .open-tasks/outputs
```

You should see a file like `20251017-143022-456-test.txt` containing "Hello World".

## Next Steps

### 1. Create Your First Task

Use the `create` system command to scaffold a custom task:

```bash
open-tasks create my-first-task
```

This creates `.open-tasks/tasks/my-first-task.js` with a complete template.

Edit the file and implement your logic, then use it:

```bash
open-tasks my-first-task "test input"
```

### 2. Explore Built-in Commands

Try composing tasks using pre-built commands like PowershellCommand, RegexCommand, etc.:

```bash
# Your tasks can use these commands internally
# See Building Custom Tasks guide for examples
```

### 3. Learn More

- Read [Getting Started](Getting-Started.md) for complete workflows
- See [Building Custom Tasks](Building-Custom-Tasks.md) for task development
- Review [Architecture Overview](Architecture.md) for system design

---

## Directory Structure

After installation and first use, your workspace will have:

```
your-project/
├── .open-tasks/
│   ├── outputs/              # Command output files (auto-created)
│   ├── tasks/                # Custom task files (create with 'create' command)
│   ├── config.json           # Configuration (optional)
│   └── ai-config.json        # AI CLI config (optional)
└── [your project files]
```

## Configuration Hierarchy

Open Tasks CLI looks for configuration in this order:

1. **Project-level**: `.open-tasks/config.json` (current working directory)
2. **User-level**: `~/.open-tasks/config.json` (home directory)
3. **Built-in defaults**: Embedded in the CLI

Project-level configuration overrides user-level, which overrides defaults.

## Default Configuration Values

If no configuration file is found, these defaults are used:

| Setting | Default Value | Description |
|---------|---------------|-------------|
| `outputDir` | `.open-tasks/outputs` | Where command outputs are saved |
| `customTasksDir` | `.open-tasks/tasks` | Where custom commands are loaded from |
| `timestampFormat` | `YYYYMMDD-HHmmss-SSS` | Format for output file timestamps |
| `defaultFileExtension` | `txt` | Default extension for output files |
| `colors` | `true` | Enable terminal colors |

## Environment Variables

### NO_COLOR

Disable all color output:

```bash
NO_COLOR=1 open-tasks store "test"
```

### NODE_OPTIONS

If you need to increase memory for large operations:

```bash
NODE_OPTIONS="--max-old-space-size=4096" open-tasks [command]
```

## Updating

### Update Global Installation

```bash
npm update -g open-tasks-cli
```

### Update Local Installation

```bash
npm update open-tasks-cli
```

Check your current version:

```bash
open-tasks --version
```

## Uninstallation

### Remove Global Installation

```bash
npm uninstall -g open-tasks-cli
```

### Remove Local Installation

```bash
npm uninstall open-tasks-cli
```

### Clean Up Workspace

Optionally remove the `.open-tasks` directory:

```bash
# Windows PowerShell
Remove-Item -Recurse -Force .open-tasks

# macOS/Linux
rm -rf .open-tasks
```

## Troubleshooting

### Command Not Found

**Issue**: `open-tasks: command not found`

**Solutions**:
1. Verify installation: `npm list -g open-tasks-cli`
2. Check npm global bin path: `npm bin -g`
3. Ensure the path is in your PATH environment variable
4. Try reinstalling: `npm uninstall -g open-tasks-cli && npm install -g open-tasks-cli`

### Permission Errors

**Issue**: Permission denied during installation

**Solution (Linux/macOS)**:
```bash
sudo npm install -g open-tasks-cli
```

**Better solution**: Configure npm to install globally without sudo:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g open-tasks-cli
```

### Version Mismatch

**Issue**: Different versions showing

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm uninstall -g open-tasks-cli
npm install -g open-tasks-cli

# Verify
open-tasks --version
```

## Next Steps

- Read [Getting Started](Getting-Started.md) for basic usage
- Learn about [Process Functions](Process-Functions.md)
- Explore [Building Custom Commands](Building-Custom-Commands.md)
- Review [Architecture Overview](Architecture.md) for deeper understanding
