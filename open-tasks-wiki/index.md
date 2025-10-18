---
title: "Open Tasks CLI"
description: "Flexible command-line tool for composable workflow automation by bitcobblers"
---

# Open Tasks CLI

<div class="hero-section" style="text-align: center; margin: 2rem 0; padding: 2rem 0; background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 12px; color: white;">

## 🚀 Workflow Automation Made Simple

**Open Tasks CLI** is a flexible command-line tool designed for composable workflow automation. Chain asynchronous command operations with explicit context passing, making it ideal for building multi-step workflows.

</div>

<div class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 2rem 0;">

### 🎯 **Three-Layer Architecture**
Clear separation between Context API (internal), CLI Commands (user-facing), and Process Commands (extensible)

### 🔗 **Composable Commands**
Chain operations together with explicit reference passing. Each command's output becomes input for subsequent commands.

### 📦 **Context Management**
Store and reuse command outputs using tokens or UUIDs across your workflow sessions.

### 🔧 **Extensibility**
Add custom process commands specific to your workflow needs.

### 🤖 **AI Integration**
Seamlessly integrate AI CLI tools with pre-defined context for intelligent automation.

### 📊 **Observable Execution**
Color-coded terminal feedback and persistent file outputs for debugging and monitoring.

</div>

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/bitcobblers/open-tasks.git
cd open-tasks

# Install dependencies
npm install

# Build the CLI
npm run build

# Install globally
npm install -g .
```

### Your First Workflow

```bash
# Store a value for reuse
open-tasks store "Hello World" --token greeting

# Load a file and process it
open-tasks load ./source-code.ts --token code

# Process with AI using stored context
open-tasks ai-cli "Review this code for bugs" --ref code --token review

# Extract specific information
open-tasks extract "Bug: (.*)" --ref review --all > bugs.txt
```

## 🏗️ Architecture Overview

### Three-Layer Design

**Layer 1: Context API (Internal)**
- Programmatic workflow processing functions
- Used by command implementations
- NOT exposed to end users

**Layer 2: CLI Commands (User-Facing)**
- System commands (`init`, `create`)
- Built-in CLI commands (`store`, `load`, `replace`, etc.)
- Process commands (user-defined in `.open-tasks/commands/`)

**Layer 3: Implementation Layer**
- CommandHandler base class
- Execution context and services
- Framework internals

### Built-in Commands

| Category | Commands | Description |
|----------|----------|-------------|
| **System** | `init`, `create` | Project management and scaffolding |
| **Core** | `store`, `load`, `replace` | Data management and transformation |
| **Execution** | `powershell`, `ai-cli` | Command execution and AI integration |
| **Processing** | `extract` | Data extraction and parsing |

## 📚 Use Cases

### Workflow Automation
```bash
# Multi-step processing pipeline
open-tasks load ./source-code.ts --token code
open-tasks ai-cli "Review this code for bugs" --ref code --token review
open-tasks extract "Bug: (.*)" --ref review --all > bugs.txt
```

### Context Building
```bash
# Gather context from multiple sources
open-tasks powershell "Get-Content README.md" --token readme
open-tasks load ./package.json --token config
open-tasks ai-cli "Summarize this project" --ref readme --ref config
```

### Template Processing
```bash
# Dynamic template substitution
open-tasks store "Production" --token env
open-tasks store "myapp.azurewebsites.net" --token domain
open-tasks replace "Deploy to {{env}} at {{domain}}" --ref env --ref domain
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 18.x+
- **Language**: TypeScript
- **CLI Framework**: Commander.js
- **Output**: chalk (colors), ora (spinners)
- **Testing**: Vitest
- **Build**: tsup

<div class="cta-section" style="background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 12px; padding: 2rem; margin: 2rem 0; color: white; text-align: center;">

### 🎯 Ready to Get Started?

[**Installation Guide**](./Installation) • [**Getting Started**](./Getting-Started) • [**API Reference**](./API-Reference)

</div>

## 🤝 Contributing

Custom commands and extensions are encouraged! Check out the [Building Custom Commands](./Building-Custom-Commands) guide to learn how to extend the CLI for your specific needs.

---

<div style="text-align: center; opacity: 0.8; margin-top: 2rem;">

**Built with ❤️ by [bitcobblers](https://github.com/bitcobblers)**

[View on GitHub](https://github.com/bitcobblers/open-tasks) • [Report Issues](https://github.com/bitcobblers/open-tasks/issues)

</div>