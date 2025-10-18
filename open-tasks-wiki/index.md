---
title: "Open Tasks CLI"
description: "Flexible command-line tool for composable workflow automation"
---

# Open Tasks CLI

**Open Tasks CLI** is a flexible command-line tool designed for composable workflow automation. Build custom tasks that compose commands together, making it ideal for multi-step workflows where operations pass data through memory references.

## 🎯 Key Concepts

### Task-Command Architecture

**Tasks** are workflow orchestration files in `.open-tasks/tasks/` that:
- Extend the `TaskHandler` abstract class
- Compose pre-built and custom commands
- Are auto-discovered and integrated as CLI commands
- Return `TaskOutcome` with logs and errors

**Commands** are `ICommand` implementations that:
- Consume and produce `MemoryRef[]` arrays
- Can be pre-built (library) or custom (user-defined)
- Execute via `context.run()` within tasks
- Chain together to build complex workflows

**IWorkflowContext API** provides internal functions:
- `context.store()` - Store values and get MemoryRef
- `context.token()` - Generate unique tokens
- `context.run()` - Execute commands

### Quick Example

```typescript
// .open-tasks/tasks/analyze-repo.ts
export default class AnalyzeRepoTask extends TaskHandler {
  static name = 'analyze-repo';
  
  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    // 1. Use PowershellCommand to get git log
    const gitLogCmd = new PowershellCommand("git log --oneline -10");
    const [logRef] = await context.run(gitLogCmd);
    
    // 2. Use ClaudeCommand with context
    const analyzeCmd = new ClaudeCommand("Analyze this repository", [logRef]);
    const [analysisRef] = await context.run(analyzeCmd);
    
    return { id, name: 'analyze-repo', logs: [...], errors: [] };
  }
}
```

Then invoke: `open-tasks analyze-repo`

## 📚 Documentation

### Getting Started
- **[[Installation]]** - Install and set up Open Tasks CLI
- **[[Quick Start]]** - Your first workflow in 5 minutes
- **[[Core Concepts]]** - Understanding tasks, commands, and context

### User Guides
- **[[Building Tasks]]** - Create custom workflow tasks
- **[[Using Commands]]** - Work with pre-built command library
- **[[Managing Context]]** - Store and pass data between operations
- **[[System Commands]]** - Init and create commands

### Developer Guides  
- **[[Architecture]]** - Understanding the three-layer design
- **[[Creating Commands]]** - Build custom ICommand implementations
- **[[Workflow API]]** - Deep dive into IWorkflowContext
- **[[Contributing]]** - Development setup and guidelines

### Reference
- **[[Command Library]]** - Pre-built commands (PowershellCommand, ClaudeCommand, etc.)
- **[[API Reference]]** - TypeScript interfaces and types
- **[[Configuration]]** - Config file options
- **[[Troubleshooting]]** - Common issues and solutions

## 🚀 Quick Start

### Installation

```bash
npm install -g open-tasks-cli
```

### Initialize Project

```bash
cd your-project-directory
open-tasks init
```

This creates:
```
.open-tasks/
├── tasks/        # Your custom task files
├── outputs/      # Command output files
└── config.json   # Configuration
```

### Create Your First Task

```bash
open-tasks create analyze-code
```

Edit `.open-tasks/tasks/analyze-code.ts` to compose commands, then run:

```bash
open-tasks analyze-code ./src/app.ts
```

## 🏗️ Architecture

**Three-Layer Design:**

1. **IWorkflowContext (Internal API)** - Programmatic functions used within tasks
2. **Tasks (CLI Commands)** - User-facing commands (system + custom)
3. **Commands (ICommand)** - Composable operations with MemoryRef I/O

**Key Components:**
- **TaskHandler** - Abstract class for CLI-invokable tasks
- **ICommand** - Interface for executable operations  
- **MemoryRef** - Reference objects tracking stored values
- **TaskOutcome** - Structured results with logs and errors

## � Use Cases

**Code Analysis Workflow**
```bash
# Create task that reads code, analyzes with AI, generates report
open-tasks create analyze-code
# Compose: PowershellCommand → ClaudeCommand → FileCommand
open-tasks analyze-code ./src/
```

**Multi-File Processing**
```bash
# Process multiple files with AI
# Compose: FileCommand → ClaudeCommand → TemplateCommand
open-tasks process-project ./src/
```

**Template Generation**
```bash
# Generate config from templates
# Compose: FileCommand → TemplateCommand → FileCommand
open-tasks generate-config production
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 18.x+
- **Language**: TypeScript
- **Build**: tsup (fast TypeScript bundler)
- **Testing**: Vitest
- **CLI**: Commander.js
- **Output**: chalk, ora

## 🤝 Contributing

We welcome contributions! See **[[Contributing]]** for:
- Development environment setup
- Building and testing
- Code style and conventions
- Submitting changes

---

**Built by [bitcobblers](https://github.com/bitcobblers)**  
[GitHub](https://github.com/bitcobblers/open-tasks) • [Issues](https://github.com/bitcobblers/open-tasks/issues) • [NPM](https://www.npmjs.com/package/open-tasks-cli)