## ADDED Requirements

### Requirement: Agent Command Integration

The `@bitcobblers/open-tasks` MUST provide a mechanism to invoke external agentic CLI tools, allowing users to seamlessly pipe context and execute commands against agents like Claude, Codex, and Gemini.

#### Scenario: Invoking a generic agent
Given a configured agent command (e.g., `claude`).
When the user executes `open-tasks claude "some prompt"`.
Then the `@bitcobblers/open-tasks` SHOULD execute the underlying `claude` CLI with the provided prompt and return the result.

### Requirement: Agent-Specific Command Handlers

The system MUST include distinct command handlers for `claude`, `codex`, and `gemini` to manage their unique arguments, context files, and behaviors.

#### Scenario: Claude Command with specific arguments
Given the `claude` command handler.
When the user executes `open-tasks claude -p "a prompt" --model opus`.
Then the handler MUST translate these arguments into a valid `claude-code` CLI invocation, including the prompt, print flag, and model selection.

#### Scenario: Codex Command with specific arguments
Given the `codex` command handler.
When the user executes `open-tasks codex exec "a task" --approval-mode auto-edit`.
Then the handler MUST translate these arguments into a valid `codex` CLI invocation, including the `exec` subcommand and the approval mode.

#### Scenario: Gemini Command with specific arguments
Given the `gemini` command handler.
When the user executes `open-tasks gemini -p "a prompt" --yolo`.
Then the handler MUST translate these arguments into a valid `gemini-cli` invocation, including the prompt and the auto-approval flag.

### Requirement: Hierarchical Context File Handling

Agent command handlers MUST locate and utilize the appropriate project-specific context files (e.g., `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) according to the hierarchical loading rules described in the CLI Agent Tool Arguments Guide.

#### Scenario: Loading a project-specific context file
Given a project with a `CLAUDE.md` file in its root directory.
When a user runs `open-tasks claude "a prompt"` from within that project.
Then the underlying `claude` CLI process MUST be invoked in a way that it correctly loads and utilizes the `CLAUDE.md` file, ensuring the agent's behavior is aligned with the project's conventions.
