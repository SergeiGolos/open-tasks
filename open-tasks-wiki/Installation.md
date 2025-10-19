---
title: "Installation"
---

# Installation

This guide covers installing Open Tasks CLI on your system.

## Prerequisites

Before installing, ensure you have:

- **Node.js**: Version 18.x or later
- **npm**: Version 8.x or later (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux

Verify your installation:

```bash
node --version  # Should show v18.x or higher
npm --version   # Should show 8.x or higher
```

## Global Installation (Recommended)

Install Open Tasks CLI globally to use it from any directory:

```bash
npm install -g open-tasks-cli
```

Verify the installation:

```bash
open-tasks --version
```

You should see the version number displayed. Now you can use `open-tasks` from any directory.

## Local Project Installation

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

**Result:**
```
.open-tasks/
├── tasks/        # Your custom task files go here
├── outputs/      # Command output files
└── config.json   # Configuration (optional customization)
```

## Troubleshooting

### Command Not Found

If you get "command not found" after global installation:

**Windows PowerShell:**
```powershell
# Check npm global path
npm config get prefix

# Add to PATH if needed (replace with your actual path)
$env:Path += ";C:\Users\YourUser\AppData\Roaming\npm"
```

**macOS/Linux:**
```bash
# Check npm global path
npm config get prefix

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Permission Errors (macOS/Linux)

If you get permission errors:

```bash
# Fix npm permissions (recommended method)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile

# Then install globally
npm install -g open-tasks-cli
```

### Version Conflicts

If you have issues with Node.js versions:

```bash
# Use nvm to manage Node.js versions
nvm install 18
nvm use 18
npm install -g open-tasks-cli
```

## Getting Started

After installation, here's what to do next:

### 1. Initialize Your Project

```bash
cd your-project
open-tasks init
```

### 2. Try Built-in Commands

```bash
# Store a value
open-tasks store "Hello World" --token greeting

# Load a file
open-tasks load ./README.md --token readme

# Extract data
open-tasks extract "version.*" --ref readme
```

### 3. Learn More

- **[[Commands]]** - Complete command reference
- **[[Example-Tasks]]** - Real-world examples
- **[[Building-Custom-Tasks]]** - Create your own workflows
- **[[Architecture]]** - Understanding the system

## Updating

To update to the latest version:

```bash
# Global installation
npm update -g open-tasks-cli

# Local installation
npm update open-tasks-cli
```

Check the installed version:

```bash
open-tasks --version
```

## Uninstalling

To remove Open Tasks CLI:

```bash
# Global installation
npm uninstall -g open-tasks-cli

# Local installation
npm uninstall open-tasks-cli
```
