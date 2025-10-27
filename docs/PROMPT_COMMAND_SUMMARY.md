# PromptCommand Implementation Summary

## Overview

Created a new default command (`PromptCommand`) that integrates GitHub Copilot prompts from `.github/prompts/` directory with the Open Tasks workflow system.

## What Was Created

### 1. Core Implementation
**File:** `src/commands/prompt.ts`

A new command that:
- Locates and reads prompt files from `.github/prompts/{name}.prompt.md`
- Processes GitHub Copilot prompt format (frontmatter + content)
- Replaces `$ARGUMENTS` placeholder with user-provided text
- Executes prompts via the `llm` CLI with configurable options
- Provides clear error messages for missing files or directories

**Key Features:**
- Automatic workspace root detection
- Frontmatter stripping (YAML metadata)
- Argument substitution
- Integration with LLM CLI (model, temperature, system prompt options)

### 2. Export Configuration
**File:** `src/commands/index.ts`

Added `PromptCommand` to the main exports for easy importing.

### 3. Tests
**File:** `tests/commands.test.ts`

Added comprehensive tests for:
- Error handling when `.github` directory doesn't exist
- Error handling when prompt file is missing
- Prompt processing with frontmatter and arguments
- Graceful handling when `llm` CLI is not installed

### 4. Documentation

#### a. Core Commands Wiki
**File:** `open-tasks-wiki/Core-Commands.md`

Added documentation section with:
- Basic usage examples
- Advanced options (model, temperature, system prompt)
- Prompt file format explanation
- `$ARGUMENTS` placeholder behavior

#### b. Detailed Guide
**File:** `docs/PROMPT_COMMAND.md`

Comprehensive documentation including:
- Overview and how it works
- Prompt file format specification
- Usage examples (basic, without arguments, with options)
- Configuration options reference
- Integration with LLM CLI
- Multiple use cases (OpenSpec, code review, docs generation)
- Best practices
- Limitations and future enhancements

#### c. README Update
**File:** `README.md`

Added feature highlight:
- 📝 **GitHub Copilot Prompts** - Load and execute prompts from `.github/prompts/` directory

### 5. Demo Example
**File:** `examples/prompt-command-demo.ts`

Interactive demo showing:
- Executing prompt with arguments
- Executing prompt without arguments
- Using custom LLM options
- Discovering available prompts

## Usage Examples

### Basic Usage

```typescript
import { PromptCommand } from '../src/commands/prompt.js';

// Execute a prompt with arguments
const result = await flow.run(
  new PromptCommand('openspec-proposal', 'Add user authentication')
);
```

### With Custom Options

```typescript
// Execute with specific model and temperature
const result = await flow.run(
  new PromptCommand(
    'code-review',
    'Review authentication module',
    {
      model: 'gpt-4',
      temperature: 0.3,
      system: 'You are a security expert.'
    }
  )
);
```

## Prompt File Format

Prompts are stored in `.github/prompts/{name}.prompt.md`:

```markdown
---
description: Brief description of the prompt
---

$ARGUMENTS

Your prompt content here...
Additional instructions and context.
```

## Integration Flow

1. **User calls** `new PromptCommand('my-prompt', 'arguments')`
2. **Command finds** `.github/prompts/my-prompt.prompt.md`
3. **Parses content:**
   - Strips YAML frontmatter
   - Replaces `$ARGUMENTS` with provided text
4. **Stores prompt** in workflow context
5. **Creates AgentCommand** with LlmConfig
6. **Executes** via `llm` CLI
7. **Returns result** as StringRef

## Benefits

✅ **Reusable Prompts** - Store prompts in version control
✅ **Parameterized** - Use `$ARGUMENTS` for dynamic content
✅ **Composable** - Integrate with other workflow commands
✅ **Flexible** - Configure model, temperature, and system prompts
✅ **Error-Friendly** - Clear error messages guide users
✅ **Standard Format** - Compatible with GitHub Copilot prompt format

## Testing

All tests pass:
- ✅ Error handling for missing .github directory
- ✅ Error handling for missing prompt files
- ✅ Prompt processing with frontmatter and arguments
- ✅ Graceful handling of missing llm CLI

## Dependencies

- Requires `llm` CLI to be installed: `pip install llm` or `pipx install llm`
- Prompts must be in `.github/prompts/` directory
- Repository must have `.github` directory (standard for Git repos)

## Next Steps

This command can be extended to:
1. Support multiple argument placeholders: `$ARG1`, `$ARG2`
2. Parse and use frontmatter metadata
3. Support prompt composition (including other prompts)
4. Add interactive prompt selection
5. Implement prompt versioning and history
6. Support for additional LLM CLIs (Claude, Gemini native)

## Files Changed

```
✨ Created:
  - src/commands/prompt.ts (180 lines)
  - docs/PROMPT_COMMAND.md (290 lines)
  - examples/prompt-command-demo.ts (80 lines)

📝 Modified:
  - src/commands/index.ts (+1 line)
  - open-tasks-wiki/Core-Commands.md (+47 lines)
  - tests/commands.test.ts (+47 lines)
  - README.md (+2 lines)

✅ All tests passing
✅ All builds successful
```
