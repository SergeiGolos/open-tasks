# PromptCommand - GitHub Copilot Prompt Integration

The `PromptCommand` allows you to load and execute GitHub Copilot prompts from your repository's `.github/prompts/` directory using Claude Code CLI.

## Overview

This feature provides both **CLI task** and **programmatic API** access to your prompt library, powered by Claude's advanced AI models.

### CLI Task (Easiest)

Execute prompts directly from the command line:

```bash
ot prompt code-review "Review this authentication module"
ot prompt generate-docs "class User { ... }" --model sonnet
```

### Programmatic API

Use prompts in custom workflows:

1. **Loads prompts** from `.github/prompts/{name}.prompt.md`
2. **Processes frontmatter** (YAML metadata)
3. **Replaces argument placeholders** with your provided text
4. **Executes the prompt** using Claude Code CLI

## Prompt File Format

Prompts follow GitHub Copilot's standard format:

```markdown
---
description: Brief description of what this prompt does
---

$ARGUMENTS

Your prompt content here...

This can include instructions, examples, and context.
```

### Key Elements:

- **Frontmatter** (optional): YAML metadata between `---` markers
- **$ARGUMENTS**: Placeholder that gets replaced with your provided arguments
- **Prompt content**: The actual instructions for the LLM

## Usage

### Basic Usage

```typescript
import { PromptCommand } from '../src/commands/prompt.js';
import { WorkflowContext } from '../src/context-builder.js';

const context = new WorkflowContext(process.cwd());

// Execute a prompt with arguments
const result = await context.run(
  new PromptCommand('openspec-proposal', 'Add user authentication')
);
```

### Without Arguments

```typescript
// Execute a prompt that doesn't need arguments
const result = await context.run(
  new PromptCommand('openspec-apply')
);
```

### With Custom LLM Options

```typescript
// Execute with specific model, temperature, and system prompt
const result = await context.run(
  new PromptCommand(
    'openspec-proposal',
    'Implement real-time notifications',
    {
      model: 'gpt-4',
      temperature: 0.7,
      system: 'You are an expert software architect.'
    }
  )
);
```

## Configuration Options

The third parameter accepts an options object:

```typescript
interface PromptOptions {
  model?: string;        // LLM model to use (e.g., 'gpt-4', 'claude-3')
  temperature?: number;  // Temperature setting (0.0 - 1.0)
  system?: string;       // System prompt to prepend
}
```

## Example Prompts

### Example: openspec-proposal.prompt.md

```markdown
---
description: Scaffold a new OpenSpec change and validate strictly.
---

$ARGUMENTS

**Guardrails**
- Favor straightforward, minimal implementations first
- Keep changes tightly scoped to the requested outcome
- Identify any vague or ambiguous details and ask follow-up questions

**Steps**
1. Review existing project structure
2. Choose a unique change-id
3. Draft spec deltas with clear requirements
4. Validate with strict checks
```

### Example: code-review.prompt.md

```markdown
---
description: Perform a thorough code review with best practices
---

$ARGUMENTS

Please review the code above for:
1. Code quality and readability
2. Potential bugs or edge cases
3. Performance considerations
4. Security vulnerabilities
5. Best practices adherence

Provide specific, actionable feedback.
```

## How It Works

1. **Find workspace root**: Searches up the directory tree for `.github` directory
2. **Load prompt file**: Reads `.github/prompts/{name}.prompt.md`
3. **Process content**:
   - Strips frontmatter (YAML between `---` markers)
   - Replaces `$ARGUMENTS` with provided text (or removes it)
4. **Execute with LLM**: Uses the `llm` CLI tool with your configuration

## Error Handling

The command provides clear error messages:

```
❌ Prompt file not found: my-prompt.prompt.md
Expected location: /path/to/repo/.github/prompts/my-prompt.prompt.md
Available prompts can be found in .github/prompts/
```

```
❌ Could not find .github directory in workspace.
Please ensure you are running this command from within a Git repository 
with a .github/prompts/ directory.
```

## Integration with Claude Code CLI

This command uses the [Claude Code CLI](https://github.com/anthropics/claude-code) by Anthropic, which provides:

- **Latest Claude models**: Sonnet 4.5, Haiku 4.5, Opus 4.1
- **Advanced reasoning**: Extended thinking mode for complex problems
- **Tool integration**: Allow Claude to use system tools
- **High quality output**: Industry-leading code generation

### Installing Claude Code CLI

```bash
# Using npm (recommended)
npm install -g @anthropic-ai/claude-code

# Configure with your API key
export ANTHROPIC_API_KEY=your-api-key
# or on Windows:
$env:ANTHROPIC_API_KEY="your-api-key"
```

### Available Models

- `sonnet` / `claude-sonnet-4-5` - Smartest model for complex tasks (default)
- `haiku` / `claude-haiku-4-5` - Fastest model with near-frontier intelligence
- `opus` / `claude-opus-4-1` - Exceptional reasoning for specialized tasks

## Use Cases

### 1. OpenSpec Workflow Integration

```typescript
// Create a proposal from workflow
const proposalResult = await context.run(
  new PromptCommand(
    'openspec-proposal',
    'Add WebSocket support for real-time updates'
  )
);
```

### 2. Automated Code Review

```typescript
// Read code file
const codeRef = await context.run(new ReadCommand('src/auth.ts'));

// Get the code content
const code = await context.get(codeRef[0]);

// Review with prompt
const review = await context.run(
  new PromptCommand('code-review', code)
);
```

### 3. Documentation Generation

```typescript
// Generate docs from code
const result = await context.run(
  new PromptCommand(
    'generate-docs',
    'Create comprehensive API documentation',
    { model: 'gpt-4', temperature: 0.3 }
  )
);
```

## Best Practices

1. **Organize prompts by purpose**: Group related prompts in subdirectories
2. **Use descriptive names**: `code-review.prompt.md` vs `cr.prompt.md`
3. **Document arguments**: Clearly explain what `$ARGUMENTS` should contain
4. **Version control**: Commit prompts to track changes over time
5. **Test prompts**: Verify they work with different inputs
6. **Set appropriate temperature**: Lower for deterministic tasks, higher for creative ones

## Limitations

- Requires `llm` CLI to be installed and configured
- Prompts must be in `.github/prompts/` directory
- Currently only supports single `$ARGUMENTS` placeholder
- Frontmatter is stripped (not passed to LLM)

## Future Enhancements

Potential improvements for future versions:

- Support for multiple argument placeholders: `$ARG1`, `$ARG2`, etc.
- Parse and use frontmatter metadata (tags, categories, etc.)
- Support for other LLM CLIs (Claude, Gemini, etc.)
- Prompt versioning and history
- Interactive prompt selection
- Prompt composition (including other prompts)

## See Also

- [Core Commands Documentation](./Core-Commands.md)
- [Building Custom Commands](./Building-Custom-Commands.md)
- [LLM CLI Documentation](https://llm.datasette.io/)
- [Example: prompt-command-demo.ts](../examples/prompt-command-demo.ts)
