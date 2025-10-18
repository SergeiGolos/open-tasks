

# **A Comprehensive Guide to CLI-Based Agentic Coding Tools**

## **Section 1: Foundational Concepts of CLI Agent Control**

The emergence of powerful, command-line interface (CLI) based artificial intelligence (AI) agents represents a significant paradigm shift in software development. Moving beyond simple in-editor code completion, tools such as Anthropic's Claude Code, OpenAI's Codex CLI, and Google's Gemini CLI function as autonomous or semi-autonomous partners that operate directly within the developer's native terminal environment.1 To effectively master these tools, it is essential to first understand the common architectural patterns, interaction models, and safety mechanisms that form their foundation. These core concepts are not unique to any single tool but represent a convergent evolution in the design of agentic systems for software engineering.

### **1.1. Interaction Paradigms: Interactive vs. Non-Interactive Modes**

At the most fundamental level, CLI-based agents offer two distinct modes of operation, each tailored to a different set of development tasks and workflows: an interactive, conversational mode for collaborative problem-solving, and a non-interactive, headless mode for automation and scripting.

**Interactive Mode (REPL/Chat)**

The primary and most common way to engage with these agents is through an interactive mode, often referred to as a Read-Eval-Print Loop (REPL) or chat session. This mode is initiated by invoking the tool's main command (e.g., claude, codex, or gemini) within a project directory.3 The agent starts a conversational session, allowing the developer to issue instructions in natural language, review the agent's plans and proposed changes, and provide iterative feedback.

This paradigm is exceptionally well-suited for complex, exploratory, or multi-step tasks such as:

* Developing new features from a high-level specification.  
* Debugging complex issues that require investigation across multiple files.  
* Refactoring significant portions of a codebase.  
* Learning a new repository by asking architectural questions.

The user interface for these interactive sessions is typically more advanced than a standard command prompt, often utilizing frameworks like React Ink to create a rich, app-like experience within the terminal. This allows for features like multi-line input, command history navigation, and dynamic status updates as the agent "thinks" or executes tasks.6 The conversational nature of this mode allows the agent to maintain context throughout the session, building upon previous interactions to tackle sophisticated problems.

**Non-Interactive Mode (Headless/Scripting)**

In contrast to the open-ended nature of interactive sessions, non-interactive mode is designed for discrete, automated tasks. In this paradigm, the user provides a complete prompt as a command-line argument, the agent executes the request, prints the final output to standard output, and then exits. This "headless" operation is critical for integrating AI agents into larger, automated workflows, such as Continuous Integration/Continuous Deployment (CI/CD) pipelines, Git hooks, or custom shell scripts.8

This mode is typically invoked using a specific flag, such as \-p or \--print in Claude Code, \-p or \--prompt in Gemini CLI, or via a distinct command like codex exec.5 A common and powerful pattern is to pipe the contents of a file or the output of another command directly into the agent, enabling composable, Unix-style workflows. For example, a log file could be piped to an agent with instructions to analyze it for anomalies.8

To facilitate programmatic use, non-interactive mode often supports structured output formats, most commonly JSON. By specifying an output format flag (e.g., \--output-format json), the developer can ensure the agent's response is a machine-readable object containing not only the generated text but also metadata about the operation, such as token usage, cost, and session IDs. This is indispensable for building reliable automated systems on top of the CLI agents.5

### **1.2. Context and Memory: The Role of Project-Specific Instruction Files**

One of the most significant innovations shared across these agentic tools is the mechanism for providing persistent, project-specific context. While interactive sessions maintain short-term conversational memory, a more permanent form of "memory" is required to align the agent's behavior with a project's unique architecture, coding standards, and conventions. This is achieved through dedicated Markdown files placed within the project's repository.

In a clear case of convergent evolution, all three major providers have independently developed this feature, differing only in the designated filename:

* **Anthropic Claude Code:** CLAUDE.md 6  
* **OpenAI Codex CLI:** AGENTS.md (though some sources also reference codex.md) 12  
* **Google Gemini CLI:** GEMINI.md 5

These files act as a "system prompt" for the repository, containing high-level instructions that guide the agent's behavior whenever it is run within that project. Common use cases for these context files include:

* Documenting common build, test, and lint commands.6  
* Specifying code style guidelines, naming conventions, and preferred libraries.6  
* Providing an overview of the project's architecture and the purpose of key directories.16  
* Defining repository etiquette, such as branch naming conventions or commit message formats.8

A crucial feature of this system is its support for hierarchical loading. The agents search for and combine these context files from multiple locations, with more specific files overriding more general ones. The typical order of precedence is:

1. **Global/User Level:** A file in the user's home directory (e.g., \~/.claude/CLAUDE.md or \~/.codex/AGENTS.md) contains personal preferences and instructions that apply to all projects.15  
2. **Project Root Level:** A file at the root of the Git repository provides project-wide standards and context shared by the entire team.17  
3. **Subdirectory Level:** Files placed within specific subdirectories offer fine-grained instructions relevant only to that component or module of the codebase.15

This layered approach provides a powerful and flexible method for configuring the agent's behavior, ensuring that it produces code and follows workflows that are consistent with both individual preferences and established team standards.

### **1.3. Agentic Permissions and Sandboxing: Architectures for Safe Execution**

Granting an AI agent the ability to read files, write code, and execute shell commands on a local development machine introduces significant security considerations. Acknowledging this, the architects of these tools have implemented robust permission models and sandboxing mechanisms to mitigate risk and ensure the developer remains in control.

The foundational principle of this safety architecture is an explicit approval workflow. By default, all of these agents will pause and prompt the user for explicit confirmation before executing any action that could modify the filesystem or run a command.20 This "human-in-the-loop" approach serves as the primary safeguard against unintended or malicious behavior.

However, for developers to achieve higher levels of productivity and automation, these tools provide mechanisms to grant the agent greater autonomy. The implementation of these autonomous modes varies, reflecting different philosophies on safety and control:

* **OpenAI's Codex CLI** provides the most granular and explicitly defined permission framework via its \--approval-mode flag. It offers three distinct levels of autonomy:  
  1. suggest (Default): The agent can read files but must request approval for all file modifications and shell commands.21  
  2. auto-edit: The agent is permitted to write to files without confirmation but must still ask for permission before executing any shell commands.21 This provides a useful middle ground for rapid code generation and refactoring tasks.  
  3. full-auto: The agent can perform any action—reading, writing, and executing—without user prompts. To ensure safety, this mode operates within a sandboxed, network-disabled environment scoped to the current directory.13  
* **Anthropic's Claude Code** manages permissions through the interactive /permissions command, which allows users to whitelist specific tools or command patterns (e.g., Bash(git diff:\*)).10 For complete autonomy, it offers a single, explicit flag: \--dangerously-skip-permissions, whose name intentionally signals the associated risk.10  
* **Google's Gemini CLI** similarly provides an all-or-nothing flag for full autonomy: \--yolo ("You Only Look Once"). Like Claude Code's flag, its colloquial name suggests it should be used with caution and is not recommended for typical workflows.15

This spectrum of permission models—from Codex's tiered, safety-oriented framework to the more binary "all-or-nothing" flags of Claude and Gemini—highlights the different design priorities of each tool and provides developers with varying degrees of control over agent autonomy.

### **1.4. Generation Parameter Theory: Temperature, Top-P, and Top-K**

In the context of Large Language Models (LLMs), generation parameters are crucial knobs that control the characteristics of the text output. A foundational understanding of these parameters is important, particularly for appreciating the design choices made in agentic CLI tools. The three most significant parameters are Temperature, Top-P, and Top-K.

* **Temperature:** This parameter controls the randomness of the model's output. It is a floating-point value, typically between 0.0 and 2.0. A lower temperature (e.g., 0.2) makes the model more deterministic; it will consistently choose the tokens with the highest probability, resulting in more focused and predictable text. This is highly desirable for tasks like code generation, where correctness and adherence to syntax are paramount. A higher temperature (e.g., 1.0 or above) increases randomness, encouraging the model to select less likely tokens. This can lead to more creative, diverse, or novel outputs but also increases the risk of factual errors, nonsensical statements, or "hallucinations".26  
* **Top-P (Nucleus Sampling):** This parameter controls diversity by defining a cumulative probability threshold for token selection. It is a float value between 0.0 and 1.0. The model considers the most probable tokens in descending order of likelihood and sums their probabilities until that sum reaches the top\_p value. The model then samples only from this smaller set (the "nucleus") of tokens. For example, a top\_p of 0.9 means the model will only consider the smallest set of tokens whose cumulative probability is 90% or greater. This allows for a dynamic vocabulary size, adapting to the context; in predictable situations, the nucleus might be small, while in more ambiguous contexts, it might be larger.28  
* **Top-K:** This parameter provides a simpler method for controlling the token pool. It is an integer that instructs the model to sample only from the k most likely tokens at each step. For example, with top\_k=50, the model will disregard all but the 50 most probable next tokens before sampling. This provides a hard cutoff, preventing very unlikely tokens from ever being chosen.27

While a user might expect these parameters to be exposed as command-line flags, a thorough examination of the documentation and usage patterns for claude-code, codex, and gemini-cli reveals that they are conspicuously absent.5 This is not an oversight but a deliberate and significant design choice. These tools are not simple wrappers around a text generation API; they are complex agentic systems. An agent's workflow involves a multi-step "chain of thought" that includes planning, tool selection, code execution, and result analysis. A single user prompt can trigger dozens of internal model calls, each with a different purpose.

The developers of these tools have therefore abstracted away low-level generation parameters. Instead of asking the user to tune temperature for each individual step, they provide higher-level controls that influence the agent's overall behavior. For instance, Claude Code introduces keywords like "think harder" or "ultrathink," which map to an increased computational budget for the agent's reasoning process, allowing it to explore more possibilities and produce a more thorough plan.6 Similarly, the Codex CLI offers a model\_reasoning\_effort configuration option to tune the depth of the model's thinking.32 Control is thus shifted from the granular level of *text generation* to the more abstract and powerful level of *agentic reasoning*. This abstraction is a defining characteristic that distinguishes these CLI agents from more basic API clients.

## **Section 2: Technical Reference: Anthropic Claude Code (claude)**

Anthropic's Claude Code (claude-code) is an agentic coding tool designed to live in the terminal and function as an AI pair programmer. It is distinguished by its powerful, unopinionated design that emphasizes flexibility, scriptability, and a deeply extensible architecture, positioning it not merely as a tool but as a platform for building customized developer assistants.4

### **2.1. Installation and Authentication**

Getting started with Claude Code is a straightforward process, requiring a modern Node.js environment and an account with Anthropic.

* **Prerequisites:** The primary requirement is a Node.js installation, version 18 or newer.10  
* **Installation:** Claude Code is distributed as an npm package and is typically installed globally to make the claude command accessible from any directory. The standard installation command is:  
  Bash  
  npm install \-g @anthropic-ai/claude-code

.4 For users who encounter permission issues with global npm installations or prefer to avoid Node.js dependencies, Anthropic also provides native binary installers for macOS, Linux, and Windows.10

* **Authentication:** Authentication is handled on the first run. Upon executing the claude command for the first time, the user is directed to a web browser to log in with their claude.ai account (recommended) or an Anthropic Console account. This process generates and stores authentication tokens locally for subsequent sessions.10 Account management within the CLI is handled by the /login and /logout slash commands, which allow users to switch between different Anthropic accounts without restarting the session.10

### **2.2. Core Invocation Commands and CLI Flags**

The claude command serves as the entry point for all interactions, with a rich set of flags to control its behavior, manage sessions, and enable headless operation.

* **Basic Invocation:**  
  * claude: Starts a new interactive chat session (REPL) in the context of the current working directory.10  
  * claude "explain this project": Starts an interactive session with an initial prompt, allowing the user to immediately begin a conversation.10  
* **Headless and Scripting Invocation:**  
  * claude \-p "query" or claude \--print "query": This is the primary mechanism for non-interactive use. The agent processes the query, prints the final response to standard output, and exits. This is essential for scripting and automation.8  
  * tail \-f app.log | claude \-p "Slack me if you see any anomalies": This example demonstrates the tool's composability, piping a continuous stream of log data into the agent for real-time analysis.8  
* **Session Management:**  
  * claude \-c or claude \--continue: Resumes the most recently active conversation within the current directory, preserving its history and context.10  
  * claude \-r "\<session-id\>" or claude \--resume "\<session-id\>": Allows a user to resume a specific past session by providing its unique ID. Running claude \--resume without an ID presents an interactive list of past sessions to choose from.10

The following table provides a comprehensive reference for all available command-line flags, consolidating information from the official documentation.10

| Flag | Description | Example |
| :---- | :---- | :---- |
| \--add-dir | Adds additional working directories for Claude to access, enabling cross-directory operations. | claude \--add-dir../shared-lib../docs |
| \--agents | Defines custom subagents dynamically for the session via a JSON string. | claude \--agents '{"reviewer":{"prompt":"You are a code reviewer"}}' |
| \--allowedTools | Whitelists specific tools to be used without prompting for permission. | claude \--allowedTools "Bash(git log:\*)" "Read" |
| \--disallowedTools | Blacklists specific tools, preventing their use. | claude \--disallowedTools "Bash(rm\*)" |
| \--print, \-p | Enables non-interactive (headless) mode. Prints the response and exits. | claude \-p "Write a commit message for my staged changes" |
| \--append-system-prompt | Appends additional instructions to the system prompt in headless mode. | claude \-p "query" \--append-system-prompt "Respond in JSON." |
| \--output-format | Specifies the output format in headless mode. Options: text, json, stream-json. | claude \-p "query" \--output-format json |
| \--input-format | Specifies the input format for piped data in headless mode. Options: text, stream-json. | \`cat data.jsonl |
| \--include-partial-messages | Includes partial streaming events in stream-json output. | claude \-p "query" \--output-format stream-json \--include-partial-messages |
| \--verbose | Enables verbose logging, showing detailed agent turn-by-turn output for debugging. | claude \--verbose |
| \--max-turns | Limits the number of agentic turns (model calls) in non-interactive mode. | claude \-p "Fix all lint errors" \--max-turns 10 |
| \--model | Sets the model for the session (e.g., sonnet, opus, or a full model name). | claude \--model opus |
| \--permission-mode | Starts the session in a specified permission mode (e.g., plan). | claude \--permission-mode plan |
| \--permission-prompt-tool | Specifies an MCP tool to handle permission prompts in non-interactive mode. | claude \-p \--permission-prompt-tool mcp\_auth\_tool "query" |
| \--resume, \-r | Resumes a specific session by ID or opens an interactive picker. | claude \--resume abc123 |
| \--continue, \-c | Resumes the most recent conversation in the current directory. | claude \--continue |
| \--dangerously-skip-permissions | Skips all permission prompts, granting the agent full autonomy. Use with caution. | claude \--dangerously-skip-permissions |

### **2.3. Interactive Session Control: A Compendium of Slash Commands**

Within an interactive session, slash commands are the primary interface for controlling the agent, managing context, and accessing advanced features. These commands provide a structured way to issue meta-instructions that are distinct from the natural language prompts directed at the model.

The following table provides a complete reference of the built-in slash commands available in Claude Code, derived from the official documentation.10

| Command | Purpose |
| :---- | :---- |
| /help | Displays a list of all available slash commands and their descriptions. |
| /clear | Clears the current conversation history and context, starting a fresh slate. |
| /compact \[instructions\] | Summarizes the conversation to reduce token usage, with optional instructions to focus the summary. |
| /model | Allows switching between available Claude models (e.g., Sonnet, Opus) during a session. |
| /review | Instructs Claude to perform a code review on a pull request, file, or block of code. |
| /init | Initializes the project by creating a CLAUDE.md file to serve as the project's memory. |
| /memory | Opens an editor to view or modify the project's CLAUDE.md context files. |
| /config | Opens the settings interface to configure the tool. |
| /permissions | View or update the permission rules for tool usage. |
| /cost | Shows token usage and cost statistics for the current session. |
| /usage | Displays plan usage limits and rate limit status for subscription plans. |
| /bug | Facilitates reporting a bug, sending the current conversation to Anthropic for analysis. |
| /agents | Manages custom AI subagents for specialized tasks. |
| /plugin | Manages plugins, including adding marketplaces and installing/enabling plugins. |
| /mcp | Manages Model Context Protocol (MCP) server connections. |
| /rewind | Rewinds the conversation and associated code changes to a previous state. |
| /vim | Toggles Vim-style editing mode for the input prompt. |
| /terminal-setup | Installs a Shift+Enter key binding for multiline input in compatible terminals. |
| /doctor | Runs a diagnostic check on the Claude Code installation. |
| /login | Initiates the login process to switch Anthropic accounts. |
| /logout | Signs out of the current Anthropic account. |
| /status | Displays the current status, including version, model, account, and connectivity. |
| /pr\_comments | Fetches and displays comments from a pull request. |

### **2.4. Advanced Extensibility: A Deep Dive into Plugins, Hooks, and MCP**

Claude Code's architecture is fundamentally designed for extensibility, setting it apart from its competitors. It is not just a self-contained tool but a comprehensive platform and SDK for creating highly customized and automated agentic workflows. This is achieved through a powerful combination of plugins, custom commands, hooks, and the Model Context Protocol (MCP).

* **Plugins:** Plugins are the primary mechanism for packaging and distributing Claude Code customizations. A plugin is a lightweight bundle that can contain any combination of custom slash commands, specialized subagents, MCP server configurations, and hooks. This allows developers to create powerful, domain-specific toolsets that can be easily shared with teammates or the broader community through "plugin marketplaces." These marketplaces are simple Git repositories containing a manifest file, and plugins can be added and managed directly from the CLI using the /plugin command.34 This ecosystem approach fosters community-driven development and allows teams to standardize their AI-assisted workflows.  
* **Custom Slash Commands:** The platform offers a remarkably simple yet powerful way for users to create their own slash commands. By simply creating a Markdown (.md) file in a .claude/commands/ directory (either within a project or in the user's home directory), a new command becomes available. The content of the Markdown file serves as the prompt for the command. These custom commands can accept dynamic arguments using placeholders like $1, $2, and $ARGUMENTS, similar to shell scripting. Furthermore, they support YAML frontmatter for advanced configuration, such as defining a command-specific description, specifying which tools it is allowed to use, or even which model it should invoke.10  
* **Hooks:** Hooks provide a mechanism for deterministic automation by allowing users to execute scripts at key lifecycle events within the agent's execution loop. For example, a PreToolUse hook can run before any tool is executed, allowing for validation, logging, or even blocking the action. A PostToolUse hook can run after a tool succeeds, which is ideal for automatically running a code formatter like Prettier after Claude edits a file, or running a linter to ensure code quality.17 These hooks provide a level of integration and process enforcement that is critical for maintaining consistency in a professional development environment.  
* **Model Context Protocol (MCP):** MCP is a standardized protocol for AI models to interact with external tools and data sources. Claude Code functions as both an MCP client and server, enabling it to connect to any number of MCP-compliant services. This is a more structured and powerful alternative to simple API calls. For example, by connecting to a Playwright MCP server, a developer can instruct Claude to control a web browser, perform actions like logging into a website, taking screenshots, or running end-to-end tests, all through natural language commands in the terminal.8

Together, these features transform Claude Code from a conversational coding assistant into a fully programmable framework for agentic development, enabling teams to build bespoke AI-powered tools tailored precisely to their internal workflows and systems.

## **Section 3: Technical Reference: OpenAI Codex CLI (codex)**

The OpenAI Codex CLI (codex) is an open-source, terminal-native coding agent designed to run locally on a developer's machine. It integrates the power of OpenAI's models (including GPT-5) into the command line, functioning as an AI teammate for tasks ranging from bug fixing and feature implementation to codebase exploration.3 Its design places a strong emphasis on security and user control through a granular permission system and sandboxed execution, and it is deeply integrated with the broader ChatGPT ecosystem.

### **3.1. Installation and Authentication**

The Codex CLI is distributed as a Node.js package, making it accessible across all major operating systems.

* **Prerequisites:** A current version of Node.js (version 22 or newer is recommended) is required. While optional, Git is highly recommended for full functionality, as the tool is repository-aware.3  
* **Installation:** The tool can be installed globally using either npm or Homebrew:  
  * npm install \-g @openai/codex  
  * brew install codex  
    .12 Alternatively, pre-compiled binaries for various platforms can be downloaded directly from the project's GitHub releases page.12  
* **Authentication:** The primary and recommended authentication method is to link the CLI to an existing ChatGPT account. By running codex and selecting "Sign in with ChatGPT," the tool is authorized to use the models available under the user's Plus, Pro, Team, or Enterprise plan.12 This streamlines the setup process significantly. For automated workflows or users without a ChatGPT subscription, authentication via a traditional OpenAI API key is also supported, though it requires additional configuration, typically by setting the OPENAI\_API\_KEY environment variable.12

### **3.2. Core Invocation Commands and CLI Flags**

The codex command is the single entry point, with flags and arguments controlling its mode of operation.

* **Basic Invocation:**  
  * codex: Launches the tool in its interactive, conversational mode (REPL), ready to accept natural language prompts.3  
  * codex "refactor the auth module to use JWT": Launches the interactive mode with an initial prompt, immediately starting the task.3  
* **Non-Interactive Mode:**  
  * codex exec "prompt": This is the designated command for non-interactive use in automated environments like GitHub Actions. It executes the task and exits.9  
  * codex \-q "prompt" or codex \--quiet "prompt": An alternative non-interactive mode that outputs only the assistant's final response, making it well-suited for scripting where the output might be piped to another process.38

The official documentation for Codex CLI's flags was not directly accessible, making a consolidated reference compiled from community guides, tutorials, and cached materials particularly valuable. The following table provides a comprehensive overview of the key command-line flags.

| Flag | Alias | Description | Default Value | Example |
| :---- | :---- | :---- | :---- | :---- |
| \--model | \-m | Specifies the OpenAI model to use for the session. | gpt-5 or o4-mini | codex \-m gpt-4.1 |
| \--approval-mode | \-a | Sets the automation level and permission policy. Options: suggest, auto-edit, full-auto. | suggest | codex \-a auto-edit |
| \--image | \-i | Provides a path to an image file to be included as multimodal input. | N/A | codex \-i "./mockup.png" |
| \--quiet | \-q | Enables non-interactive mode, printing only the final output. | N/A | codex \-q "summarize this file" |
| \--provider | \-p | Specifies the model provider (e.g., openai, groq, ollama). Requires config.toml setup. | openai | codex \-p ollama \-m llama3 |
| \--config |  | Overrides a setting from the config.toml file for the current session. | N/A | codex \--config model\_reasoning\_effort="high" |
| \--help | \-h | Displays usage information and a list of available options. | N/A | codex \--help |
| \--full-context | \-f | An experimental mode that loads the entire repository into context for batch edits. | N/A | codex \-f "prompt" |

### **3.3. Configuration and Context: Mastering config.toml and AGENTS.md**

Codex CLI's behavior is customized through a combination of a global configuration file and project-specific context files.

* **Configuration File (config.toml):** All persistent preferences for the Codex CLI are stored in the \~/.codex/config.toml file.12 This TOML-formatted file allows users to define default settings that apply to all sessions, such as:  
  * The default model and provider (model \= "gpt-5").33  
  * The default approval policy (approval\_policy \= "auto-edit").33  
  * Sandbox settings and environment variable policies.33  
  * Configuration for connecting to external MCP servers.42  
  * Model-specific parameters like model\_reasoning\_effort.32  
* **Context Files (AGENTS.md):** For project-specific instructions, Codex CLI uses files named AGENTS.md.12 This system follows the same hierarchical loading logic seen in other agentic tools, merging instructions from global, project-root, and subdirectory locations to build a comprehensive context for the agent.19 These files are used to inform the agent about coding standards, testing procedures, pull request formats, and other project-specific conventions, ensuring its output aligns with the team's established workflows.14

### **3.4. Agent Control: A Detailed Analysis of Approval Modes**

The approval-mode system is the cornerstone of the Codex CLI's design, reflecting a deep consideration for the safety and security implications of running an AI agent with local file system access. Instead of a simple on/off switch for autonomy, OpenAI has implemented a tiered permission model that provides developers with granular control over the agent's capabilities. This structured approach to managing agent autonomy is a key differentiator for the tool, particularly in enterprise or security-conscious environments.

The decision to create this multi-level policy, rather than a single "skip permissions" flag, indicates a design philosophy that prioritizes user trust and deliberate delegation of authority. The intermediate auto-edit mode, in particular, represents a practical compromise between the safety of full manual approval and the speed of full automation, addressing a common developer workflow where code generation is automated but command execution requires oversight.

The three approval modes are:

1. **suggest (Default Mode):** In this mode, the agent operates in a read-only capacity by default. It can analyze the codebase and propose changes in the form of patch files or suggest shell commands to be run, but it must receive explicit user approval for every single modification or execution.21 This is the safest mode and is ideal for sensitive operations, exploring an unfamiliar codebase, or when the user wants to maintain maximum control.  
2. **auto-edit:** This mode grants the agent the ability to automatically read and write to files within the project directory. It will apply code changes without prompting for approval. However, it still requires explicit user confirmation before executing any shell commands.21 This mode significantly speeds up workflows that are heavily focused on code refactoring or generation, while still providing a critical safety check before the agent interacts with the broader system via the shell.  
3. **full-auto:** This is the most autonomous mode. The agent is empowered to read files, write changes, and execute shell commands without any user intervention. To mitigate the inherent risks of this level of autonomy, full-auto mode operates within a strictly controlled sandbox. This environment is scoped to the current project directory and, crucially, has network access disabled by default, preventing the agent from exfiltrating data or interacting with external services unexpectedly.21

## **Section 4: Technical Reference: Google Gemini CLI (gemini)**

Google's Gemini CLI (gemini-cli) is an open-source AI agent that brings the power of the Gemini family of models directly into the terminal.5 It is strategically positioned to democratize access to high-end agentic capabilities through a generous free tier and open-source model, while also providing a clear pathway for enterprise adoption via integration with Google Cloud and Vertex AI. Its feature set is notable for including built-in Google Search grounding and advanced interactive shell capabilities.

### **4.1. Installation and Authentication Tiers**

Gemini CLI is built with Node.js and is designed for easy installation across all major platforms.

* **Prerequisites:** The tool requires Node.js version 20 or higher to run.5  
* **Installation:** Gemini CLI offers multiple installation methods for flexibility:  
  * **Instant Execution (npx):** For trial or occasional use without a permanent installation: npx https://github.com/google-gemini/gemini-cli.5  
  * **Global Installation (npm/brew):** For regular use, it can be installed globally via npm install \-g @google/gemini-cli or brew install gemini-cli.5  
* **Authentication Tiers:** A key strategic feature of Gemini CLI is its multi-tiered authentication system, which caters to a wide spectrum of users from individual hobbyists to large enterprises.  
  1. **Login with Google (OAuth):** This is the default and most accessible option. By signing in with a personal Google account, users gain access to a very generous free tier, which includes 60 requests per minute and 1,000 requests per day using the powerful Gemini 2.5 Pro model with its massive 1 million token context window.5 This effectively removes the cost barrier for individual developers.  
  2. **Gemini API Key:** For developers using Google AI Studio or requiring more specific model control, the CLI can be authenticated by setting a GEMINI\_API\_KEY environment variable obtained from AI Studio.5  
  3. **Vertex AI:** This option is tailored for enterprise and production workloads. It integrates the CLI with a Google Cloud project, enabling access to enterprise-grade security, compliance features, and higher, scalable rate limits tied to a billing account. This requires setting the GOOGLE\_API\_KEY and GOOGLE\_GENAI\_USE\_VERTEXAI=true environment variables.5

### **4.2. Core Invocation Commands and CLI Flags**

The gemini command provides a simple entry point, with flags to control its behavior for both interactive and scripted use.

* **Basic Invocation:** Simply running gemini in a project directory starts a new interactive chat session.5  
* **Non-Interactive Mode:** The \-p or \--prompt flag is used for headless execution. For example, gemini \-p "Explain the architecture of this codebase" will process the prompt, output the result, and exit.5 This mode is essential for scripting and automation.

The following table provides a reference for the most important command-line arguments for the Gemini CLI, compiled from official and community documentation.5

| Argument | Alias | Description | Example |
| :---- | :---- | :---- | :---- |
| \--prompt | \-p | Runs the CLI in non-interactive mode with the provided prompt. | gemini \-p "Refactor this function" |
| \--model | \-m | Specifies a particular Gemini model to use for the session. | gemini \-m gemini-2.5-flash |
| \--include-directories |  | Includes additional directories in the agent's context. | gemini \--include-directories../lib,../docs |
| \--output-format |  | Sets the output format for non-interactive mode (e.g., json, stream-json). | gemini \-p "query" \--output-format json |
| \--yolo |  | Auto-approves all tool calls, enabling full autonomy. Use with caution. | gemini \--yolo |
| \--debug | \-d | Enables verbose debug output for troubleshooting. | gemini \-d |
| \--prompt-interactive | \-i | Starts an interactive session with an initial prompt. | gemini \-i "Let's build a new feature" |
| \--checkpointing |  | Saves a project snapshot before file modifications, allowing for restoration. | gemini \--checkpointing |

### **4.3. Interactive Session Control and Built-in Tools**

The interactive experience in Gemini CLI is rich with features for session management and tool utilization.

* **Slash Commands:** The primary method for controlling the session includes commands such as:  
  * /help: Lists available commands.  
  * /chat: Manages conversations, with subcommands like save \<tag\> and resume \<tag\> for session checkpointing.44  
  * /model: Allows the user to switch between different Gemini models on the fly.44  
  * /clear: Resets the conversation history and context.44  
  * /compress: Summarizes the current conversation to free up context window space, similar to Claude Code's command.15  
* **Built-in Tools:** Gemini CLI is equipped with a powerful suite of pre-integrated tools that enhance its capabilities out-of-the-box. These include standard tools for file system operations (ReadFile, WriteFile) and shell command execution (Shell), but also, critically, tools for GoogleSearch and WebFetch. The native integration of Google Search allows the agent to ground its responses with real-time information from the web, a significant advantage for tasks requiring up-to-date knowledge.5  
* **Advanced Interactive Shell:** A standout feature of Gemini CLI is its support for a fully interactive pseudo-terminal (PTY).46 This capability, powered by the node-pty library, allows the agent to run and interact with complex, full-screen terminal applications directly within its own session. This means a user can ask Gemini to vim a file, and a fully interactive Vim editor will appear within the chat interface. Similarly, it can run interactive processes like git rebase \-i or htop. This deep integration with the shell environment is a major step forward, as it keeps all operations, including interactive ones, within the agent's context, eliminating the need to switch to a separate terminal.46

### **4.4. Configuration and Extensibility via GEMINI.md and MCP**

Customization and extensibility in Gemini CLI are handled through a familiar pattern of context files, configuration files, and support for the Model Context Protocol.

* **Configuration Files (settings.json):** The tool's behavior can be customized using settings.json files. These are loaded hierarchically, allowing for system-wide (/etc/gemini-cli/), user-wide (\~/.gemini/), and project-specific (./.gemini/) configurations. This file is used to define settings like themes and, most importantly, to configure connections to MCP servers.15  
* **Context File (GEMINI.md):** Following the established industry pattern, Gemini CLI uses GEMINI.md files to provide persistent, project-specific instructions to the model. It supports the same hierarchical loading system as its counterparts, combining guidance from global, project, and local files to form the complete context.5 The /memory show command provides a useful utility for inspecting the final, merged context that is being sent to the model.15  
* **Extensibility (MCP):** The primary mechanism for extending Gemini CLI's capabilities is through the Model Context Protocol (MCP). By defining MCP server connections in the settings.json file, developers can grant the agent access to a vast array of external tools and services. This allows the agent to perform actions like interacting with a GitHub repository (@github List my open pull requests) or sending messages via Slack (@slack Send a summary...).5 This standards-based approach to tool integration makes the agent highly extensible and capable of being integrated into complex, multi-service workflows.

## **Section 5: Synthesis and Strategic Recommendations**

A detailed technical examination of Anthropic's Claude Code, OpenAI's Codex CLI, and Google's Gemini CLI reveals that while they share a common purpose and many architectural patterns, they are products of distinct design philosophies and strategic market positions. For developers and engineering leaders, selecting the right tool depends not just on a feature-by-feature comparison, but on an understanding of which tool's core philosophy best aligns with their team's priorities, be it ultimate customizability, stringent security, or accessible power.

### **5.1. Comparative Analysis of Command-Line Interfaces**

The following table provides a master comparison of the key features and commands across the three major CLI-based agentic coding tools. This synthesis facilitates at-a-glance evaluation and helps in identifying the most suitable tool for a given use case or environment.

| Feature | Anthropic Claude Code (claude) | OpenAI Codex CLI (codex) | Google Gemini CLI (gemini) |
| :---- | :---- | :---- | :---- |
| **Core Philosophy** | Extensible Power-User Framework | Safety-First Enterprise Tool | Accessible Ecosystem Play |
| **Source Model** | Closed Source | Open Source (Apache 2.0) | Open Source (Apache 2.0) |
| **Installation** | npm, Native Binary | npm, brew, Binary | npx, npm, brew |
| **Primary Auth** | Claude.ai / Console Account | ChatGPT Subscription | Google Account (OAuth) |
| **Free Tier** | Limited (depends on claude.ai plan) | None (requires paid plan) | Generous (1,000 req/day, Gemini 2.5 Pro) |
| **Context File** | CLAUDE.md | AGENTS.md / codex.md | GEMINI.md |
| **Config File** | settings.json | config.toml | settings.json |
| **Non-Interactive** | claude \-p "prompt" | codex exec "prompt" or codex \-q | gemini \-p "prompt" |
| **Autonomous Mode** | \--dangerously-skip-permissions | \--approval-mode full-auto | \--yolo |
| **Permission Model** | Binary (on/off) \+ Whitelisting | Tiered (suggest, auto-edit, full-auto) | Binary (on/off) |
| **Key Extensibility** | Plugins, Hooks, Custom Commands | MCP Configuration | MCP Configuration |
| **Unique Feature** | Deeply programmable agent lifecycle (Hooks) | Granular, tiered approval modes | Built-in Google Search, Interactive PTY Shell |

This comparison illuminates the distinct strategic positioning of each tool. Claude Code's extensive customization options—plugins, hooks, and user-defined slash commands—position it as a high-end framework for professional teams aiming to build a deeply integrated and bespoke AI development environment.17 Its model is akin to providing a powerful engine and a full toolkit for users to build their own custom vehicle.

In contrast, the Codex CLI's most developed and emphasized feature is its granular, three-tiered approval system, backed by sandboxing.21 This demonstrates a primary focus on security, safety, and providing enterprise administrators with fine-grained control over agent autonomy. It is less of a customizable framework and more of a secure, ready-to-deploy appliance.

Gemini CLI's strategy is one of market penetration and ecosystem integration. By offering an open-source tool with access to a state-of-the-art model (Gemini 2.5 Pro) on a remarkably generous free tier, Google is lowering the barrier to entry for agentic coding and aiming to build a large user base.5 The clear integration paths to paid Vertex AI services provide a natural monetization strategy, positioning the free CLI as a powerful on-ramp to the broader Google Cloud ecosystem.5

### **5.2. Recommendations for Workflow-Specific Argument Configuration**

The choice of command-line arguments and operational modes should be tailored to the specific development task at hand to maximize both productivity and safety.

* **For CI/CD and Full Automation:** In automated environments like GitHub Actions or Jenkins pipelines, the goal is unattended execution. For this, non-interactive modes are essential. The recommended configuration would be:  
  * **Claude Code:** claude \-p "task" \--output-format json \--dangerously-skip-permissions  
  * **Codex CLI:** codex exec "task" \--approval-mode full-auto  
  * Gemini CLI: gemini \-p "task" \--output-format json \--yolo  
    The use of JSON output is critical for allowing subsequent steps in the pipeline to programmatically parse the agent's results. The flags granting full autonomy are necessary as there will be no human present to approve actions. These commands should be run in environments with appropriate safeguards and limited permissions.  
* **For Secure Codebase Analysis and Review:** When the primary goal is to understand or review code without making any changes, the safest possible configuration should be used. This prevents accidental modifications to the codebase.  
  * **Claude Code:** Use the default interactive mode and deny any write or execution permissions when prompted.  
  * **Codex CLI:** Explicitly use the safest approval mode: codex \--approval-mode suggest. This guarantees the agent cannot write files or execute commands.  
  * **Gemini CLI:** Use the default interactive mode and deny all permission prompts.  
* **For Rapid Prototyping and Refactoring:** During active development, a balance between speed and control is often desired. The goal is to automate repetitive coding tasks while retaining oversight of potentially system-altering commands.  
  * **Claude Code:** Use the interactive mode and leverage the /permissions command to whitelist safe, frequently used tools (e.g., Read, Write, Bash(npm install)).  
  * **Codex CLI:** The auto-edit mode is perfectly designed for this workflow: codex \--approval-mode auto-edit. It automates the cycle of code generation and file modification while ensuring the developer must still approve shell commands like running tests or installing dependencies.  
  * **Gemini CLI:** Use the default interactive mode, but utilize the "allow always" option for file-writing permissions when prompted for the first time in a session to streamline the coding process.

### **5.3. The Future of Command-Line Agentic Development**

The rapid development and adoption of these sophisticated CLI tools signal a clear trend in AI-assisted software engineering: a shift from passive, in-IDE code completion to active, autonomous agents that function as collaborative partners within the developer's most fundamental environment—the terminal.1 This evolution has several profound implications for the future of software development.

First, the terminal is being reaffirmed as the central hub for development. Rather than pulling developers into new graphical interfaces, these tools integrate powerful AI capabilities directly into the existing, text-based workflows that are prized for their efficiency, scriptability, and composability. The ability to pipe, script, and integrate these agents into the existing universe of command-line utilities makes them exponentially more powerful than siloed applications.

Second, the convergence on standards like the Model Context Protocol (MCP) is crucial for fostering a healthy, interoperable ecosystem.5 As more tools and services expose their functionality via MCP, AI agents will be able to seamlessly orchestrate complex workflows across a wide range of third-party applications, from project management and communication platforms to cloud infrastructure and deployment services. This will move agents from being code-focused assistants to true end-to-end workflow automators.

Finally, the market is witnessing a productive tension between different development and distribution models. The proprietary, platform-centric approach of Claude Code fosters a polished, deeply integrated, and highly extensible system, appealing to professional teams willing to invest in a premium, tailored solution. In parallel, the open-source nature of Codex CLI and Gemini CLI encourages community contribution, transparency, and rapid, democratized access to cutting-edge technology. This dynamic will likely accelerate innovation across the entire field, as features and ideas from the open-source world influence proprietary products and vice-versa, ultimately benefiting the entire developer community.

#### **Works cited**

1. Compare the Top 5 Agentic CLI Coding Tools \- GetStream.io, accessed October 18, 2025, [https://getstream.io/blog/agentic-cli-tools/](https://getstream.io/blog/agentic-cli-tools/)  
2. AI Coding Assistants for Terminal: Claude Code, Gemini CLI & Qodo Compared, accessed October 18, 2025, [https://www.prompt.security/blog/ai-coding-assistants-make-a-cli-comeback](https://www.prompt.security/blog/ai-coding-assistants-make-a-cli-comeback)  
3. How to Use OpenAI Codex CLI: A Comprehensive Guide \- Skywork.ai, accessed October 18, 2025, [https://skywork.ai/blog/how-to-use-openai-codex-cli-a-comprehensive-guide/](https://skywork.ai/blog/how-to-use-openai-codex-cli-a-comprehensive-guide/)  
4. anthropics/claude-code: Claude Code is an agentic coding ... \- GitHub, accessed October 18, 2025, [https://github.com/anthropics/claude-code](https://github.com/anthropics/claude-code)  
5. google-gemini/gemini-cli: An open-source AI agent that brings the power of Gemini directly into your terminal. \- GitHub, accessed October 18, 2025, [https://github.com/google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)  
6. Anthropic Claude Code CLI: Prompts & Tool Definitions \- AI Engineer Guide, accessed October 18, 2025, [https://aiengineerguide.com/blog/claude-code-prompt/](https://aiengineerguide.com/blog/claude-code-prompt/)  
7. OpenAI Codex CLI, how does it work? \- Philschmid, accessed October 18, 2025, [https://www.philschmid.de/openai-codex-cli](https://www.philschmid.de/openai-codex-cli)  
8. Claude Code: Best practices for agentic coding \- Anthropic, accessed October 18, 2025, [https://www.anthropic.com/engineering/claude-code-best-practices](https://www.anthropic.com/engineering/claude-code-best-practices)  
9. Codex is now generally available | OpenAI, accessed October 18, 2025, [https://openai.com/index/codex-now-generally-available/](https://openai.com/index/codex-now-generally-available/)  
10. Claude Code overview \- Claude Docs, accessed October 18, 2025, [https://docs.claude.com/en/docs/claude-code/overview](https://docs.claude.com/en/docs/claude-code/overview)  
11. 20 Claude Code CLI Commands to Make Your 10x Productive \- Apidog, accessed October 18, 2025, [https://apidog.com/blog/claude-code-cli-commands/](https://apidog.com/blog/claude-code-cli-commands/)  
12. openai/codex: Lightweight coding agent that runs in your terminal \- GitHub, accessed October 18, 2025, [https://github.com/openai/codex](https://github.com/openai/codex)  
13. OpenAI releases Codex CLI, an AI coding assistant built into your terminal \- Reddit, accessed October 18, 2025, [https://www.reddit.com/r/singularity/comments/1k0qc67/openai\_releases\_codex\_cli\_an\_ai\_coding\_assistant/](https://www.reddit.com/r/singularity/comments/1k0qc67/openai_releases_codex_cli_an_ai_coding_assistant/)  
14. OpenAI's Codex: A Guide With 3 Practical Examples \- DataCamp, accessed October 18, 2025, [https://www.datacamp.com/tutorial/openai-codex](https://www.datacamp.com/tutorial/openai-codex)  
15. Google Gemini CLI Cheatsheet \- Philschmid, accessed October 18, 2025, [https://www.philschmid.de/gemini-cli-cheatsheet](https://www.philschmid.de/gemini-cli-cheatsheet)  
16. Proactiveness considered harmful? A guide to customise the Gemini CLI to suit your coding style | by Daniela Petruzalek | Google Cloud \- Medium, accessed October 18, 2025, [https://medium.com/google-cloud/proactiveness-considered-harmful-a-guide-to-customise-the-gemini-cli-to-suit-your-coding-style-b23c9b605058](https://medium.com/google-cloud/proactiveness-considered-harmful-a-guide-to-customise-the-gemini-cli-to-suit-your-coding-style-b23c9b605058)  
17. Cooking with Claude Code: The Complete Guide \- Sid Bharath, accessed October 18, 2025, [https://www.siddharthbharath.com/claude-code-the-complete-guide/](https://www.siddharthbharath.com/claude-code-the-complete-guide/)  
18. Claude Code CLI Cheatsheet: config, commands, prompts, \+ best practices \- Shipyard.build, accessed October 18, 2025, [https://shipyard.build/blog/claude-code-cheat-sheet/](https://shipyard.build/blog/claude-code-cheat-sheet/)  
19. Describe It, Codex Builds It — Quick Start with Codex CLI | by Rob Śliwa \- Medium, accessed October 18, 2025, [https://medium.com/@robjsliwa\_71070/describe-it-codex-builds-it-quick-start-with-codex-cli-8493956b9480](https://medium.com/@robjsliwa_71070/describe-it-codex-builds-it-quick-start-with-codex-cli-8493956b9480)  
20. Claude Code, accessed October 18, 2025, [https://www.claude.com/product/claude-code](https://www.claude.com/product/claude-code)  
21. OpenAI Codex CLI Tutorial \- DataCamp, accessed October 18, 2025, [https://www.datacamp.com/tutorial/open-ai-codex-cli-tutorial](https://www.datacamp.com/tutorial/open-ai-codex-cli-tutorial)  
22. Hands-on with Gemini CLI \- Google Codelabs, accessed October 18, 2025, [https://codelabs.developers.google.com/gemini-cli-hands-on](https://codelabs.developers.google.com/gemini-cli-hands-on)  
23. OpenAI Codex CLI: Build Faster Code Right From Your Terminal | Blott, accessed October 18, 2025, [https://www.blott.com/blog/post/openai-codex-cli-build-faster-code-right-from-your-terminal](https://www.blott.com/blog/post/openai-codex-cli-build-faster-code-right-from-your-terminal)  
24. 20 Claude Code CLI Commands That Will Make You a Terminal Wizard \- Rowan Blackwoon, accessed October 18, 2025, [https://rowanblackwoon.medium.com/20-claude-code-cli-commands-that-will-make-you-a-terminal-wizard-e22fd4365496](https://rowanblackwoon.medium.com/20-claude-code-cli-commands-that-will-make-you-a-terminal-wizard-e22fd4365496)  
25. Gemini CLI Tutorial Series — Part 2 : Gemini CLI Command line parameters | by Romin Irani | Google Cloud \- Medium, accessed October 18, 2025, [https://medium.com/google-cloud/gemini-cli-tutorial-series-part-2-gemini-cli-command-line-parameters-e64e21b157be](https://medium.com/google-cloud/gemini-cli-tutorial-series-part-2-gemini-cli-command-line-parameters-e64e21b157be)  
26. Experiment with parameter values | Generative AI on Vertex AI \- Google Cloud, accessed October 18, 2025, [https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/adjust-parameter-values](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/adjust-parameter-values)  
27. Understanding Model Parameters: Temperature, Top-K, and Top-P \- Medium, accessed October 18, 2025, [https://medium.com/@er.nitheeshsudarsanan/understanding-model-parameters-temperature-top-k-and-top-p-235629624920](https://medium.com/@er.nitheeshsudarsanan/understanding-model-parameters-temperature-top-k-and-top-p-235629624920)  
28. Understanding Temperature, Top P, and Maximum Length in LLMs \- Learn Prompting, accessed October 18, 2025, [https://learnprompting.org/docs/intermediate/configuration\_hyperparameters](https://learnprompting.org/docs/intermediate/configuration_hyperparameters)  
29. Cheat Sheet: Mastering Temperature and Top\_p in ChatGPT API, accessed October 18, 2025, [https://community.openai.com/t/cheat-sheet-mastering-temperature-and-top-p-in-chatgpt-api/172683](https://community.openai.com/t/cheat-sheet-mastering-temperature-and-top-p-in-chatgpt-api/172683)  
30. Setting Top-K, Top-P and Temperature in LLMs \- Ruman | MLfast.co \- Medium, accessed October 18, 2025, [https://rumn.medium.com/setting-top-k-top-p-and-temperature-in-llms-3da3a8f74832](https://rumn.medium.com/setting-top-k-top-p-and-temperature-in-llms-3da3a8f74832)  
31. Understanding OpenAI Codex CLI Commands \- MachineLearningMastery.com, accessed October 18, 2025, [https://machinelearningmastery.com/understanding-openai-codex-cli-commands/](https://machinelearningmastery.com/understanding-openai-codex-cli-commands/)  
32. Openai's codex cli with gpt 5 became better than claude code : r/ChatGPTPro \- Reddit, accessed October 18, 2025, [https://www.reddit.com/r/ChatGPTPro/comments/1muifxw/openais\_codex\_cli\_with\_gpt\_5\_became\_better\_than/](https://www.reddit.com/r/ChatGPTPro/comments/1muifxw/openais_codex_cli_with_gpt_5_became_better_than/)  
33. Configuring Codex \- OpenAI Developers, accessed October 18, 2025, [https://developers.openai.com/codex/local-config/](https://developers.openai.com/codex/local-config/)  
34. Customize Claude Code with plugins \- Anthropic, accessed October 18, 2025, [https://www.anthropic.com/news/claude-code-plugins](https://www.anthropic.com/news/claude-code-plugins)  
35. built-in tools \- OpenAI Platform, accessed October 18, 2025, [https://platform.openai.com/docs/guides/tools](https://platform.openai.com/docs/guides/tools)  
36. Codex | OpenAI, accessed October 18, 2025, [https://openai.com/codex/](https://openai.com/codex/)  
37. OpenAI Codex CLI: Codes like a pro | by CyberRaya \- Medium, accessed October 18, 2025, [https://medium.com/@CyberRaya/openai-codex-cli-codes-like-a-pro-c14f2e8c684f](https://medium.com/@CyberRaya/openai-codex-cli-codes-like-a-pro-c14f2e8c684f)  
38. OpenAI Codex CLI: an Open Source Coding Agent in the Terminal \- Apidog, accessed October 18, 2025, [https://apidog.com/blog/openai-codex-cli/](https://apidog.com/blog/openai-codex-cli/)  
39. Codex with API key on Macbook not working \- Stack Overflow, accessed October 18, 2025, [https://stackoverflow.com/questions/79752212/codex-with-api-key-on-macbook-not-working](https://stackoverflow.com/questions/79752212/codex-with-api-key-on-macbook-not-working)  
40. Codex with Azure OpenAI in AI Foundry Models | Microsoft Learn, accessed October 18, 2025, [https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/codex](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/codex)  
41. OpenAI Codex CLI Integration \- AiHubMix Documentation Hub, accessed October 18, 2025, [https://docs.aihubmix.com/en/api/Codex-CLI](https://docs.aihubmix.com/en/api/Codex-CLI)  
42. The guide to OpenAI Codex CLI : r/LocalLLM \- Reddit, accessed October 18, 2025, [https://www.reddit.com/r/LocalLLM/comments/1lvozcq/the\_guide\_to\_openai\_codex\_cli/](https://www.reddit.com/r/LocalLLM/comments/1lvozcq/the_guide_to_openai_codex_cli/)  
43. Google announces Gemini CLI: your open-source AI agent, accessed October 18, 2025, [https://blog.google/technology/developers/introducing-gemini-cli-open-source-ai-agent/](https://blog.google/technology/developers/introducing-gemini-cli-open-source-ai-agent/)  
44. Command Reference \- Gemini CLI, accessed October 18, 2025, [https://www.geminicli.cloud/commands](https://www.geminicli.cloud/commands)  
45. Gemini CLI Tutorial Series — Part 9: Understanding Context, Memory and Conversational Branching | by Romin Irani | Google Cloud \- Medium, accessed October 18, 2025, [https://medium.com/google-cloud/gemini-cli-tutorial-series-part-9-understanding-context-memory-and-conversational-branching-095feb3e5a43](https://medium.com/google-cloud/gemini-cli-tutorial-series-part-9-understanding-context-memory-and-conversational-branching-095feb3e5a43)  
46. Say hello to a new level of interactivity in Gemini CLI \- Google Developers Blog, accessed October 18, 2025, [https://developers.googleblog.com/en/say-hello-to-a-new-level-of-interactivity-in-gemini-cli/](https://developers.googleblog.com/en/say-hello-to-a-new-level-of-interactivity-in-gemini-cli/)