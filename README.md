# Open Tasks CLI

**Build Context for AI Agents in Real-Time**

A powerful workflow orchestration CLI that helps you quickly build scripts for executing AI agent tools like Claude Code, GitHub Copilot, and Gemini CLI with explicit, real-time context.

[![npm version](https://img.shields.io/npm/v/@bitcobblers/open-tasks.svg)](https://www.npmjs.com/package/@bitcobblers/open-tasks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Open Tasks?

When working with AI coding assistants, you need rich context from multiple sources: file contents, API responses, logs, documentation. Traditional approaches are either:
- **Manual** (tedious copy-paste)
- **Unreliable** (letting AI figure out what to read)
- **Time-consuming** (writing custom scripts for each workflow)

**Open Tasks solves this** by providing a command chaining framework where you explicitly define context-building workflows and execute dependencies in real-time.

## Quick Start

### Installation

```bash
npm install -g @bitcobblers/open-tasks
```

### Initialize Project

```bash
ot init
```

### Create Your First Task

```bash
ot create hello-world
ot hello-world
```

## Key Features

✨ **Command Chaining** - Execute multiple commands in sequence, passing outputs as inputs

🎯 **Explicit Context Building** - Define exactly what context your AI needs

⚡ **Real-Time Execution** - Run data fetching, extraction, and transformation on-demand

🔗 **Reference Management** - Store command outputs and reference them by name or UUID

🤖 **AI Agent Integration** - Built-in support for Claude, Gemini, Copilot, Aider, llm, and more

🎨 **Visual Output** - Formatted, boxed output showing exactly what's happening

📁 **File Persistence** - All outputs saved to timestamped directories

## Supported AI Agents

- **Claude** (Anthropic) - claude-3.5-sonnet, claude-3-opus, claude-3-haiku
- **Gemini** (Google) - gemini-2.5-pro, gemini-2.5-flash
- **GitHub Copilot** - gpt-4, gpt-4-turbo
- **Aider** - AI pair programming with git integration
- **llm** - Simon Willison's multi-provider tool
- **Qwen** - Alibaba's coding assistant

## Quick Example

Create a code review task:

```javascript
// .open-tasks/code-review.js
export default class CodeReviewCommand {
  name = 'code-review';
  description = 'Review code with Claude';
  
  async execute(args, context) {
    const flow = context.workflowContext;
    
    // Build context from file
    const codeRef = await flow.run(new ReadCommand(args[0]));
    const promptRef = await flow.run(
      new SetCommand('Review this code for bugs and improvements:')
    );
    
    // Execute AI agent
    const config = new ClaudeConfigBuilder()
      .withModel('claude-3.5-sonnet')
      .allowingAllTools()
      .build();
    
    const result = await flow.run(
      new AgentCommand(config, [promptRef[0], codeRef[0]])
    );
    
    return result;
  }
}
```

Run it:

```bash
ot code-review src/app.js
```

## Documentation

- **[Installation](https://sergeigolos.github.io/open-tasks/Installation)** - Setup and configuration
- **[Core Tasks](https://sergeigolos.github.io/open-tasks/Core-Tasks)** - Built-in tasks (init, create, promote, clean)
- **[Core Commands](https://sergeigolos.github.io/open-tasks/Core-Commands)** - Command execution model
- **[Core Agents Command Builder](https://sergeigolos.github.io/open-tasks/Core-Agents-Command-Builder)** - AI agent configurations
- **[Example Tasks](https://sergeigolos.github.io/open-tasks/Example-Tasks)** - Code review, news summary, and more
- **[Building Custom Tasks](https://sergeigolos.github.io/open-tasks/Building-Custom-Tasks)** - Create your own workflows
- **[Building Custom Commands](https://sergeigolos.github.io/open-tasks/Building-Custom-Commands)** - Build reusable commands
- **[Architecture](https://sergeigolos.github.io/open-tasks/Architecture)** - System design overview

## Core Concepts

### Commands
Executable units that perform specific operations (load, extract, transform, execute PowerShell, call AI CLI, etc.)

### Tasks
Compositions of multiple commands chained together to accomplish complex workflows

### References
Named or UUID-based handles to command outputs that can be passed between commands

### Workflow Context
The execution environment that manages state, file I/O, and command orchestration

## Available Commands

**Data Storage:**
- `SetCommand` - Store values in memory
- `ReadCommand` - Read file contents
- `WriteCommand` - Write to files
- `LoadCommand` - Load files with metadata

**Transformation:**
- `TemplateCommand` - Process templates with token replacement
- `ReplaceCommand` - Replace placeholders
- `TextTransformCommand` - Apply custom text transformations
- `JsonTransformCommand` - Extract and transform JSON data

**Pattern Matching:**
- `MatchCommand` - Extract data with regex

**Utilities:**
- `JoinCommand` - Concatenate strings
- `QuestionCommand` - Prompt for user input

**Execution:**
- `PowerShellCommand` - Run PowerShell scripts
- `AgentCommand` - Execute AI agents

## Built-in Tasks

- `ot init` - Initialize Open Tasks project
- `ot create <name>` - Create custom task from template
- `ot create-agent <name>` - Create AI agent configuration
- `ot promote <task>` - Convert task to reusable module
- `ot clean` - Clean up output files

## Requirements

- Node.js >= 18.0.0
- npm or yarn
- PowerShell (optional, for `powershell` command)

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/SergeiGolos/open-tasks/blob/main/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Development

```bash
# Clone repository
git clone https://github.com/SergeiGolos/open-tasks.git
cd open-tasks

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Install locally for testing
npm run dev-deploy
```

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Documentation**: [Open Tasks Wiki](https://sergeigolos.github.io/open-tasks/)
- **Issues**: [GitHub Issues](https://github.com/SergeiGolos/open-tasks/issues)
- **Discussions**: [GitHub Discussions](https://github.com/SergeiGolos/open-tasks/discussions)

## Roadmap

- [ ] Shell integration (bash, zsh completion)
- [ ] Plugin system for third-party extensions
- [ ] Web UI for workflow visualization
- [ ] Docker integration commands
- [ ] Git workflow commands
- [ ] Database backend option
- [ ] Remote execution support

## Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [Boxen](https://github.com/sindresorhus/boxen) - Terminal boxes
- [Ora](https://github.com/sindresorhus/ora) - Progress indicators
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vitest](https://vitest.dev/) - Testing framework

---

**Ready to get started?** Head to the [Installation Guide](https://sergeigolos.github.io/open-tasks/Installation) to set up Open Tasks CLI.
