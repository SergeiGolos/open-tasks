# PromptCommand Quick Reference

## CLI Task

The easiest way to use prompts is via the CLI task with Claude Code CLI:

```bash
# Basic usage
ot prompt <prompt-name> [arguments] [options]

# Examples
ot prompt code-review "Review this function..."
ot prompt generate-docs "class User { ... }" --model sonnet
ot prompt openspec-proposal "Add authentication" --temperature 0.7
ot prompt security-audit --allow-all-tools
```

### CLI Options

| Option | Description | Example |
|--------|-------------|---------|
| `--model <name>` | Specify Claude model | `--model sonnet`, `--model opus` |
| `--temperature <n>` | Set creativity (0.0-1.0) | `--temperature 0.3` |
| `--allow-all-tools` | Allow Claude to use all tools | `--allow-all-tools` |

### Available Claude Models

- `sonnet` - Smartest model for complex tasks (default)
- `haiku` - Fastest model with near-frontier intelligence
- `opus` - Exceptional reasoning for specialized tasks

## Installation

Requires Claude Code CLI:
```bash
npm install -g @anthropic-ai/claude-code
```

Configure API key:
```bash
export ANTHROPIC_API_KEY=your-api-key
# or on Windows:
$env:ANTHROPIC_API_KEY="your-api-key"
```

## Programmatic API

For use in custom tasks and workflows:

## Basic Syntax

```typescript
new PromptCommand(promptName, arguments?, options?)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `promptName` | string | ✅ | Name of prompt file (without `.prompt.md`) |
| `arguments` | string | ❌ | Text to replace `$ARGUMENTS` placeholder |
| `options` | object | ❌ | LLM configuration (see below) |

### Options Object

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `model` | string | Claude model to use | `'sonnet'`, `'opus'`, `'haiku'` |
| `temperature` | number | Creativity level (0.0-1.0) | `0.3` (precise), `0.7` (creative) |
| `allowAllTools` | boolean | Allow Claude to use all tools | `true` |

## Usage Examples

### 1. Simple Execution

```typescript
import { PromptCommand } from '@bitcobblers/open-tasks';

// Execute prompt with arguments
await flow.run(
  new PromptCommand('code-review', 'Review auth.ts for security issues')
);
```

### 2. No Arguments

```typescript
// Execute prompt without arguments
await flow.run(
  new PromptCommand('project-status')
);
```

### 3. With Options

```typescript
// Precise code review with Sonnet
await flow.run(
  new PromptCommand(
    'code-review',
    'Review payment processing',
    { model: 'sonnet', temperature: 0.2 }
  )
);

// Creative brainstorming with higher temperature
await flow.run(
  new PromptCommand(
    'feature-ideas',
    'Mobile app improvements',
    { temperature: 0.9 }
  )
);

// Allow Claude to use all tools with Opus
await flow.run(
  new PromptCommand(
    'refactor-code',
    'Refactor this module',
    { model: 'opus', allowAllTools: true }
  )
);
```

## Prompt File Structure

Create prompts in `.github/prompts/{name}.prompt.md`:

```markdown
---
description: What this prompt does
---

$ARGUMENTS

Your instructions here...
```

### Example: code-review.prompt.md

```markdown
---
description: Perform thorough code review
---

$ARGUMENTS

Please review the code above for:
1. Security vulnerabilities
2. Performance issues
3. Code quality
4. Best practices

Provide specific, actionable feedback.
```

## CLI Integration

### From Custom Task

```javascript
// .open-tasks/review-pr.js
export default class ReviewPRCommand {
  async execute(args, context) {
    const flow = context.workflowContext;
    
    // Read PR diff
    const diffRef = await flow.run(
      new ReadCommand('pr-diff.txt')
    );
    
    const diff = await flow.get(diffRef[0]);
    
    // Review with prompt
    const result = await flow.run(
      new PromptCommand('pr-review', diff, { temperature: 0.3 })
    );
    
    return result;
  }
}
```

### Chaining Commands

```typescript
// Read code
const codeRef = await flow.run(new ReadCommand('src/auth.ts'));
const code = await flow.get(codeRef[0]);

// Review
const reviewRef = await flow.run(
  new PromptCommand('security-review', code)
);

// Get the result content
const review = await flow.get(reviewRef[0]);

// Save result
await flow.run(
  new WriteCommand('review-output.md', review)
);
```

## Common Patterns

### 1. Multi-File Review

```typescript
const files = ['auth.ts', 'user.ts', 'session.ts'];
const reviews = [];

for (const file of files) {
  const codeRef = await flow.run(new ReadCommand(`src/${file}`));
  const code = await flow.get(codeRef[0]);
  
  const review = await flow.run(
    new PromptCommand('code-review', `File: ${file}\n\n${code}`)
  );
  
  reviews.push(review);
}
```

### 2. Template + Prompt

```typescript
// Build context with template
await flow.run(new SetCommand('ProjectX', 'project'));
await flow.run(new SetCommand('authentication', 'feature'));

const contextRef = await flow.run(
  new TemplateCommand('Project: {{project}}, Feature: {{feature}}')
);

const context = await flow.get(contextRef[0]);

// Use in prompt
const result = await flow.run(
  new PromptCommand('feature-design', context)
);
```

### 3. Interactive Workflow

```typescript
// Ask for input
const userInput = await flow.run(
  new QuestionCommand('What would you like to review?')
);

const input = await flow.get(userInput[0]);

// Execute prompt
const result = await flow.run(
  new PromptCommand('general-review', input)
);
```

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Could not find .github directory` | Not in Git repo | Run from repo root with `.github/` folder |
| `Prompt file not found: X.prompt.md` | Prompt doesn't exist | Check `.github/prompts/` directory |
| `Command 'claude' not found` | Claude CLI not installed | Run `npm install -g @anthropic-ai/claude-code` |
| `API key not configured` | Missing API credentials | Set `ANTHROPIC_API_KEY` environment variable |

## Best Practices

✅ **DO:**
- Use descriptive prompt names
- Set temperature appropriately (low for precision, high for creativity)
- Version control your prompts
- Document what `$ARGUMENTS` should contain
- Test prompts with various inputs

❌ **DON'T:**
- Hardcode sensitive data in prompts
- Use very high temperature for code review
- Mix multiple concerns in one prompt
- Forget to handle missing arguments

## See Also

- [Full Documentation](./PROMPT_COMMAND.md)
- [Core Commands](../open-tasks-wiki/Core-Commands.md)
- [Demo Example](../examples/prompt-command-demo.ts)
- [Claude Code CLI](https://github.com/anthropics/claude-code)
- [Anthropic API Docs](https://docs.anthropic.com/)
