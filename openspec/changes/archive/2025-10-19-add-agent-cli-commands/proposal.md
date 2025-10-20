This proposal introduces a new set of commands to the `@bitcobblers/open-tasks` to integrate with external, agentic CLI tools like Claude Code, OpenAI Codex, and Google Gemini CLI. This will allow `open-tasks` to act as a unified interface for invoking these agents, managing their context, and piping data into them.

The core of this change is a new `AgentCommandHandler` base class and specific implementations for each supported agent, enabling users to leverage the power of these tools from a single, consistent command-line environment.
