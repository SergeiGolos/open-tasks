# Open Tasks CLI

**Build Context for AI Agents in Real-Time**

Open Tasks CLI is a powerful workflow orchestration tool designed to help you quickly write scripts that build context for executing agent CLI tools like Claude Code, GitHub Copilot, or Gemini CLI. Unlike traditional approaches where LLMs must figure out their own context-building tools, Open Tasks lets you explicitly define and execute dependencies for building context in real-time.

## The Problem

When working with AI coding assistants, you often need to provide rich context from multiple sources:
- File contents from different parts of your codebase
- API responses or external data
- Extracted information from logs or documentation
- Transformed data from various sources

Traditional approaches either:
1. Manually copy-paste everything (tedious and error-prone)
2. Let the AI figure out what files to read (inconsistent and unreliable)
3. Write custom scripts for each workflow (time-consuming)

## The Solution

Open Tasks CLI provides a **command chaining framework** where you can:

✨ **Chain Commands Together** - Execute multiple commands in sequence, passing outputs as inputs

🎯 **Build Context Explicitly** - Define exactly what context your AI needs, when it needs it

⚡ **Execute Dependencies in Real-Time** - Run data fetching, extraction, and transformation on-demand

🔗 **Reference Management** - Store command outputs and reference them by name or UUID

🎨 **Visual Output** - See formatted, boxed output showing exactly what's happening

📁 **File Persistence** - All outputs saved to timestamped directories for debugging and reuse

## Quick Example

```bash
# Load source code
open-tasks load ./app.ts --token source

# Extract function names
open-tasks extract "export function ([a-zA-Z]+)" --ref source --all --token functions

# Ask AI to review with context
open-tasks ai-cli "Review these functions for best practices" --ref functions
```

This builds rich, structured context for your AI agent by:
1. Loading the source file
2. Extracting specific patterns (function names)
3. Passing that extracted context to the AI CLI tool

## Key Concepts

### Commands
Executable units that perform specific operations (load, extract, transform, execute PowerShell, call AI CLI, etc.)

### Tasks
Compositions of multiple commands chained together to accomplish complex workflows

### References
Named or UUID-based handles to command outputs that can be passed between commands

### Workflow Context
The execution environment that manages state, file I/O, and command orchestration

## Get Started

- **[Installation](./Installation.md)** - Install and configure Open Tasks CLI
- **[Commands](./Commands.md)** - Reference guide for all built-in commands
- **[Example Tasks](./Example-Tasks.md)** - Ready-to-use examples for code review, news summarization, and more
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Chain commands together for complex workflows
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Create your own commands with the box format
- **[Architecture](./Architecture.md)** - High-level overview of the system design
- **[Developer Guide](./Developer-Guide.md)** - Contributing and developing new features

## Why Open Tasks?

**For AI-Assisted Development**
- Provide consistent, repeatable context to your AI coding assistant
- Reduce hallucinations by giving precise, verified input
- Speed up code reviews, documentation generation, and refactoring

**For Workflow Automation**
- Chain CLI tools together without writing shell scripts
- Built-in reference management eliminates temp file juggling
- Visual feedback shows exactly what each step produces

**For Team Collaboration**
- Share custom tasks as simple command definitions
- Consistent execution across different environments
- Debugging made easy with isolated, timestamped outputs

## Philosophy

Open Tasks follows these principles:

1. **Explicit Over Implicit** - You define the workflow, not the AI
2. **Composability** - Small, focused commands that combine powerfully
3. **Transparency** - Visual output shows what's happening at each step
4. **Persistence** - All outputs saved for debugging and audit trails
5. **Extensibility** - Easy to add custom commands for your specific needs

---

Ready to get started? Head to **[Installation](./Installation.md)** to set up Open Tasks CLI.
