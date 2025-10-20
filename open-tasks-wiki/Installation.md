# Installation

Get started with Open Tasks CLI in just a few minutes.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn** (comes with Node.js)
- **PowerShell** (optional, only required for `powershell` command)
  - On Windows: Already included
  - On macOS/Linux: Install [PowerShell Core](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell)

## Quick Install

### Global Installation (Recommended)

Install Open Tasks CLI globally to use it anywhere:

```bash
npm install -g @bitcobblers/open-tasks
```

Verify the installation:

```bash
ot --version
```

### Local Installation (Project-Specific)

Install as a development dependency in your project:

```bash
npm install --save-dev @bitcobblers/open-tasks
```

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "ot": "ot"
  }
}
```

Run using npm:

```bash
npm run ot -- init
```

## Getting Started

### 1. Initialize Your Project

Create the Open Tasks directory structure:

```bash
ot init
```

This creates:
- `.open-tasks/` - Directory for custom tasks and configuration
- `.open-tasks/.config.json` - Project configuration
- `.open-tasks/logs/` - Output files directory
- `.open-tasks/package.json` - ES module support

### 2. Create Your First Custom Task

Generate a sample task to understand the workflow:

```bash
ot create hello-world
```

This creates `.open-tasks/hello-world.js` with a complete example demonstrating:
- Storing values with `SetCommand`
- Template replacement with `ReplaceCommand`
- Custom display commands
- Command chaining

### 3. Run Your Task

Execute your newly created task:

```bash
ot hello-world
```

Or with a custom name:

```bash
ot hello-world "Alice"
```

## Configuration

### Project Configuration

Edit `.open-tasks/.config.json` to customize behavior:

```json
{
  "outputDir": ".open-tasks/logs",
  "customCommandsDir": [".open-tasks", "~/.open-tasks"],
  "timestampFormat": "YYYYMMDD-HHmmss-SSS",
  "defaultFileExtension": "txt",
  "colors": true
}
```

**Configuration Options:**

- `outputDir` - Where command outputs are saved
- `customCommandsDir` - Array of directories to search for custom tasks (supports both project-local and user-global)
- `timestampFormat` - Format for timestamps in output filenames
- `defaultFileExtension` - Default file extension for outputs
- `colors` - Enable/disable colored terminal output

### User-Level Configuration

Create a global configuration for all projects:

```bash
mkdir -p ~/.open-tasks
```

Create `~/.open-tasks/.config.json`:

```json
{
  "outputDir": ".open-tasks/logs",
  "customCommandsDir": ["~/.open-tasks"],
  "colors": true
}
```

Project-level configurations override user-level settings.

## Updating

Update to the latest version:

```bash
npm update -g @bitcobblers/open-tasks
```

Or for local installations:

```bash
npm update @bitcobblers/open-tasks
```

## Uninstalling

Remove the global installation:

```bash
npm uninstall -g @bitcobblers/open-tasks
```

Or from a project:

```bash
npm uninstall @bitcobblers/open-tasks
```

## Troubleshooting

### Command not found

If `ot` command is not found after global installation:

1. Check if npm global bin directory is in your PATH:
   ```bash
   npm config get prefix
   ```

2. Add npm global bin to your PATH:
   - **macOS/Linux**: Add to `~/.bashrc` or `~/.zshrc`:
     ```bash
     export PATH="$(npm config get prefix)/bin:$PATH"
     ```
   - **Windows**: Add to System Environment Variables

### Permission errors on macOS/Linux

If you get permission errors during global installation:

```bash
sudo npm install -g @bitcobblers/open-tasks
```

Or configure npm to use a different directory:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### PowerShell not found

If you get "PowerShell not found" errors:

- **Windows**: PowerShell is built-in, check your PATH
- **macOS**: `brew install --cask powershell`
- **Linux**: Follow [PowerShell installation guide](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell)

## Next Steps

- **[Core Tasks](./Core-Tasks.md)** - Learn about built-in tasks
- **[Core Commands](./Core-Commands.md)** - Understand the command execution model
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Create your own workflows
- **[Example Tasks](./Example-Tasks.md)** - See real-world examples

## Support

- **Documentation**: [Open Tasks Wiki](https://sergeigolos.github.io/open-tasks/)
- **Issues**: [GitHub Issues](https://github.com/SergeiGolos/open-tasks/issues)
- **Contributing**: [Contributing Guide](https://github.com/SergeiGolos/open-tasks/blob/main/CONTRIBUTING.md)
