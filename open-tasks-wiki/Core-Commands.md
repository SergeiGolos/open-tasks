# Core Commands

Core commands are the building blocks for creating workflows in Open Tasks CLI. They are composable, single-responsibility units that can be chained together to build complex automation tasks.

## Command Execution Model

### How Commands Work

Commands in Open Tasks follow a **workflow context pattern**:

1. **Execute** - Commands run within a workflow context (`IFlow`)
2. **Store** - Results are stored with unique IDs and optional tokens
3. **Reference** - Other commands can reference stored values by ID or token
4. **Chain** - Commands pass outputs as inputs to subsequent commands

### The ICommand Interface

All commands implement the `ICommand` interface:

```typescript
interface ICommand {
  execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]>;
}
```

**Returns:** Array of tuples `[value, decorators[]]`
- `value` - The command result
- `decorators` - Metadata like tokens, timestamps, file paths

---

## Built-in Commands

Open Tasks includes these core commands for workflow composition:

### Data Storage Commands

#### SetCommand
Store a value in the workflow context.

```javascript
import { SetCommand } from '../src/commands/set.js';

// Store with automatic ID
const ref = await flow.run(new SetCommand('Hello World'));

// Store with token for later reference
const ref = await flow.run(new SetCommand('data', 'mytoken'));
```

#### ReadCommand
Read content from a file.

```javascript
import { ReadCommand } from '../src/commands/read.js';

const ref = await flow.run(new ReadCommand('data.txt'));
const content = await flow.get(ref[0]);
```

#### WriteCommand
Write content to a file.

```javascript
import { WriteCommand } from '../src/commands/write.js';

const dataRef = await flow.run(new SetCommand('file content'));
await flow.run(new WriteCommand('output.txt', dataRef[0]));
```

#### PromptCommand
Load and execute GitHub Copilot prompts from `.github/prompts/*.prompt.md`.

This command integrates with your repository's prompt library, automatically processing frontmatter and argument placeholders, then sending the prompt to your default LLM CLI.

```javascript
import { PromptCommand } from '../src/commands/prompt.js';

// Execute a prompt with arguments
const result = await flow.run(
  new PromptCommand('openspec-proposal', 'Add user authentication')
);

// Execute a prompt without arguments
const result = await flow.run(
  new PromptCommand('openspec-apply')
);

// Execute with custom LLM options
const result = await flow.run(
  new PromptCommand(
    'openspec-proposal',
    'Implement notifications',
    {
      model: 'gpt-4',
      temperature: 0.7,
      system: 'You are an expert architect.'
    }
  )
);
```

**Prompt File Format:**
```markdown
---
description: Brief description of the prompt
---

$ARGUMENTS

Rest of the prompt content...
```

The `$ARGUMENTS` placeholder is replaced with the arguments you provide, or removed if no arguments are given.

### Transformation Commands

#### TemplateCommand
Process templates with token replacement.

```javascript
import { TemplateCommand } from '../src/commands/template.js';

// Store tokens
await flow.run(new SetCommand('Alice', 'name'));
await flow.run(new SetCommand('alice@example.com', 'email'));

// Process template
const template = 'Hello {{name}}, your email is {{email}}';
const result = await flow.run(new TemplateCommand(template));
```

#### ReplaceCommand
Replace placeholders in a template string.

```javascript
import { ReplaceCommand } from '../src/commands/replace.js';

const templateRef = await flow.run(new SetCommand('Hello {{name}}!'));
const result = await flow.run(
  new ReplaceCommand(templateRef[0], { name: 'World' })
);
```

#### TextTransformCommand
Apply custom transformations to text.

```javascript
import { TextTransformCommand } from '../src/commands/text-transform.js';

const textRef = await flow.run(new SetCommand('hello world'));
const upper = await flow.run(
  new TextTransformCommand(textRef[0], (s) => s.toUpperCase())
);
```

#### JsonTransformCommand
Extract and transform JSON data.

```javascript
import { JsonTransformCommand } from '../src/commands/json-transform.js';

const jsonRef = await flow.run(
  new SetCommand('{"user": {"name": "Alice", "age": 25}}')
);

const name = await flow.run(
  new JsonTransformCommand(jsonRef[0], (obj) => obj.user.name)
);
```

### Pattern Matching Commands

#### MatchCommand
Extract data using regular expressions.

```javascript
import { MatchCommand } from '../src/commands/match.js';

const textRef = await flow.run(
  new SetCommand('Email: alice@example.com, Phone: 555-1234')
);

const matches = await flow.run(
  new MatchCommand(
    textRef[0],
    /Email: ([^,]+), Phone: (.+)/,
    ['email', 'phone']
  )
);

const email = await flow.get(matches[0]); // alice@example.com
const phone = await flow.get(matches[1]); // 555-1234
```

### Utility Commands

#### JoinCommand
Concatenate multiple strings or references.

```javascript
import { JoinCommand } from '../src/commands/join.js';

const hello = await flow.run(new SetCommand('Hello'));
const world = await flow.run(new SetCommand('World'));

const result = await flow.run(
  new JoinCommand([hello[0], ', ', world[0], '!'])
);
// Result: "Hello, World!"
```

#### QuestionCommand
Prompt the user for input.

```javascript
import { QuestionCommand } from '../src/commands/question.js';

const answer = await flow.run(
  new QuestionCommand('What is your name?', 'username')
);
```

---

## Execution Commands

### PowerShellCommand
Execute PowerShell scripts (requires PowerShell to be installed).

```javascript
import PowerShellCommand from '../src/commands/powershell.js';

// Simple command
const date = await context.run(['Get-Date'], context);

// Command with token references
const result = await context.run(
  ['Get-Content {{filepath}}', '--ref', 'filepath'],
  context
);
```

**Platform Support:**
- Windows: Uses built-in PowerShell
- macOS/Linux: Requires PowerShell Core (`pwsh`)

---

## Agent Commands

Agent commands integrate with various AI coding assistants. These are covered in detail in the **[Core Agents Command Builder](./Core-Agents-Command-Builder.md)** documentation.

### Generic Agent Execution

All AI agent integrations follow this pattern:

```javascript
import { AgentCommand, AgentConfig } from '../src/commands/agent.js';

// 1. Create configuration
const config = AgentConfig.claude()
  .withModel('claude-3-5-sonnet-20241022')
  .allowingAllTools()
  .build();

// 2. Build context
const promptRef = await flow.run(new SetCommand('Review this code'));
const codeRef = await flow.run(new ReadCommand('app.js'));

// 3. Execute agent
const result = await flow.run(
  new AgentCommand(config, [promptRef[0], codeRef[0]])
);
```

### Supported Agents

- **Claude** (Anthropic)
- **Gemini** (Google)
- **GitHub Copilot**
- **Aider**
- **llm** (Simon Willison)
- **Qwen**

See **[Core Agents Command Builder](./Core-Agents-Command-Builder.md)** for detailed configuration options for each agent.

---

## Task-Level Commands

Commands that are exposed as CLI tasks use the `ITaskHandler` interface:

```typescript
interface ITaskHandler {
  name: string;
  description: string;
  examples: string[];
  
  execute(
    args: string[],
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

### LoadCommand (Task-Level)

The `load` command is a task-level wrapper around `ReadCommand`:

```bash
# Load a file and store with token
ot load ./data.json --token mydata

# Load with verbose output
ot load ./file.txt --verbose
```

---

## Workflow Context (IFlow)

All commands execute within a workflow context that provides:

### Methods

#### run(command)
Execute a command and get its result references.

```javascript
const refs = await flow.run(new SetCommand('value'));
```

#### get(ref)
Retrieve a value by its reference.

```javascript
const value = await flow.get(refs[0]);
```

#### set(value, decorators)
Store a value with optional decorators.

```javascript
const ref = await flow.set('data', [new TokenDecorator('mytoken')]);
```

### Properties

- `cwd` - Current working directory
- `outputDir` - Output directory path
- `Tokens` - Map of token names to references

---

## Reference System

### StringRef

References to stored values:

```typescript
interface StringRef {
  id: string;           // Unique UUID
  token?: string;       // Optional named token
  timestamp?: Date;     // Creation time
  fileName?: string;    // Associated file
}
```

### Decorators

Decorators add metadata to references:

#### TokenDecorator
Adds a named token for easy reference.

```javascript
import { TokenDecorator } from '../src/decorators.js';

const decorators = [new TokenDecorator('mytoken')];
const ref = await flow.set('value', decorators);
```

---

## Command Chaining Pattern

Commands are designed to be chained together:

```javascript
// Step 1: Load template
const template = await flow.run(
  new ReadCommand('template.html')
);

// Step 2: Set tokens
await flow.run(new SetCommand('Alice', 'username'));
await flow.run(new SetCommand('Premium', 'plan'));

// Step 3: Process template
const processed = await flow.run(
  new TemplateCommand(template[0])
);

// Step 4: Write output
await flow.run(
  new WriteCommand('output.html', processed[0])
);
```

---

## Error Handling

Commands throw errors for invalid inputs or failures:

```javascript
try {
  const ref = await flow.run(new ReadCommand('missing.txt'));
} catch (error) {
  console.error('Command failed:', error.message);
  // Error: File not found: missing.txt
}
```

---

## Best Practices

### 1. Single Responsibility
Each command should do one thing well.

```javascript
// Good: Separate commands
const data = await flow.run(new ReadCommand('data.json'));
const parsed = await flow.run(new JsonTransformCommand(data[0], obj => obj));

// Avoid: Combining multiple operations
```

### 2. Use Tokens for Readability
Name important values with tokens.

```javascript
await flow.run(new SetCommand('config.json', 'configFile'));
await flow.run(new SetCommand('v1.0.0', 'version'));
```

### 3. Chain Commands Logically
Build workflows step by step.

```javascript
// 1. Gather inputs
// 2. Transform data
// 3. Generate outputs
// 4. Store or display results
```

### 4. Handle References Properly
Always check if references exist.

```javascript
const value = await flow.get(ref);
if (value === undefined) {
  throw new Error('Reference not found');
}
```

---

## Next Steps

- **[Core Agents Command Builder](./Core-Agents-Command-Builder.md)** - Configure AI agents
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Create your own commands
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Chain commands into workflows
- **[Example Tasks](./Example-Tasks.md)** - See real-world examples

## See Also

- **[Core Tasks](./Core-Tasks.md)** - Built-in CLI tasks
- **[Architecture](./Architecture.md)** - System design overview
