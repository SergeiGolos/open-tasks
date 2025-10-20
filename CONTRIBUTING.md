# Contributing to Open Tasks

Thank you for your interest in contributing to Open Tasks! This guide will help you get started with development, testing, and submitting contributions.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Adding New Features](#adding-new-features)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Contributions](#submitting-contributions)
- [Documentation](#documentation)

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **Git**
- **TypeScript** knowledge (recommended)
- **PowerShell** (optional, for testing PowerShell commands)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/open-tasks.git
   cd open-tasks
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/SergeiGolos/open-tasks.git
   ```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Development Mode

Watch for changes and rebuild automatically:

```bash
npm run dev
```

### Install Locally

Test your changes with the CLI:

```bash
npm run dev-deploy
```

This builds and installs the CLI globally from your local source.

### Run Tests

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Lint Code

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

---

## Project Structure

```
open-tasks/
├── src/                        # Source code
│   ├── index.ts               # CLI entry point
│   ├── types.ts               # Type definitions
│   ├── router.ts              # Command routing
│   ├── command-loader.ts      # Dynamic loading
│   ├── directory-output-context.ts  # Workflow context
│   ├── commands/              # Built-in commands
│   │   ├── set.ts
│   │   ├── read.ts
│   │   ├── write.ts
│   │   ├── agent.ts
│   │   └── agents/            # Agent configurations
│   ├── tasks/                 # Built-in tasks
│   │   ├── init.ts
│   │   ├── create.ts
│   │   └── ...
│   └── cards/                 # Output formatting
├── tests/                     # Test files
├── examples/                  # Example workflows
├── open-tasks-wiki/          # Documentation
├── dist/                      # Compiled output (generated)
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

## Adding New Features

### Adding a New Command

Commands are single-purpose units that implement `ICommand`.

**1. Create command file:**

`src/commands/my-command.ts`

```typescript
import { ICommand, IFlow, IRefDecorator } from '../types.js';

/**
 * MyCommand - Brief description
 * 
 * Detailed explanation of what this command does.
 * 
 * Usage in workflow:
 *   const result = await flow.run(new MyCommand(param));
 */
export class MyCommand implements ICommand {
  private param: string;

  constructor(param: string) {
    this.param = param;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    // Implementation
    const result = `Processed: ${this.param}`;
    return [[result, []]];
  }
}
```

**2. Export from index:**

`src/commands/index.ts`

```typescript
export * from './my-command.js';
```

**3. Add tests:**

`tests/commands/my-command.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { DirectoryOutputContext } from '../../src/directory-output-context.js';
import { MyCommand } from '../../src/commands/my-command.js';

describe('MyCommand', () => {
  it('should process input correctly', async () => {
    const context = new DirectoryOutputContext(
      process.cwd(),
      '/tmp/test-output'
    );
    
    const result = await context.run(new MyCommand('test'));
    const value = await context.get(result[0]);
    
    expect(value).toBe('Processed: test');
  });
});
```

**4. Add documentation:**

Update `open-tasks-wiki/Core-Commands.md` with your new command.

### Adding a New Task

Tasks are workflow orchestrators that implement `ITaskHandler`.

**1. Create task file:**

`src/tasks/my-task.ts`

```typescript
import { ExecutionContext, ReferenceHandle, ITaskHandler } from '../types.js';
import { MessageCard } from '../cards/index.js';

/**
 * MyTask - Brief description
 */
export default class MyTaskCommand implements ITaskHandler {
  name = 'my-task';
  description = 'Brief description';
  examples = [
    'ot my-task',
    'ot my-task --option value',
  ];

  async execute(
    args: string[],
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const flow = context.workflowContext;
    const verbosity = context.verbosity || 'summary';
    
    // Validate arguments
    if (args.length === 0) {
      throw new Error('Missing required argument');
    }
    
    // Workflow implementation
    context.outputSynk.write('Step 1: Processing...');
    
    // ... your workflow steps ...
    
    // Return result
    return {
      id: 'result-id',
      content: 'result content',
      token: 'result-token',
      timestamp: new Date()
    };
  }
}
```

**2. Build configuration:**

Tasks are automatically loaded from `src/tasks/` by the CLI.

**3. Add tests:**

`tests/tasks/my-task.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import MyTaskCommand from '../../src/tasks/my-task.js';
import { ExecutionContext } from '../../src/types.js';

describe('MyTaskCommand', () => {
  it('should execute successfully', async () => {
    const task = new MyTaskCommand();
    // Create mock context
    const context: ExecutionContext = {
      // ... mock properties
    };
    
    const result = await task.execute(['arg'], context);
    expect(result.content).toBeDefined();
  });
});
```

**4. Add documentation:**

Update `open-tasks-wiki/Core-Tasks.md` with your new task.

### Adding an Agent Configuration

Support for new AI agent CLI tools.

**1. Create agent config:**

`src/commands/agents/my-agent.ts`

```typescript
import { IAgentConfig } from './base.js';

export class MyAgentConfig implements IAgentConfig {
  model?: string;
  workingDirectory?: string;
  timeout?: number;
  
  buildCommand(prompt: string): { command: string; args: string[] } {
    const args: string[] = ['-p', prompt];
    
    if (this.model) {
      args.push('--model', this.model);
    }
    
    return { command: 'my-agent', args };
  }
  
  getEnvironment(): Record<string, string> {
    const env: Record<string, string> = {};
    // Add environment variables
    return env;
  }
}

export class MyAgentConfigBuilder {
  private config: MyAgentConfig = new MyAgentConfig();
  
  withModel(model: string): this {
    this.config.model = model;
    return this;
  }
  
  inDirectory(dir: string): this {
    this.config.workingDirectory = dir;
    return this;
  }
  
  withTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }
  
  build(): MyAgentConfig {
    return this.config;
  }
}
```

**2. Update config loader:**

Add to `src/commands/agents/config-loader.ts`

**3. Add to documentation:**

Update `open-tasks-wiki/Core-Agents-Command-Builder.md`

---

## Testing

### Test Structure

```
tests/
├── commands/          # Command tests
│   ├── set.test.ts
│   └── ...
├── tasks/            # Task tests
│   ├── init.test.ts
│   └── ...
└── integration/      # Integration tests
    └── ...
```

### Writing Tests

**Unit Tests** - Test individual components:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

**Integration Tests** - Test workflows:

```typescript
describe('Workflow integration', () => {
  it('should complete workflow', async () => {
    const context = createTestContext();
    // Execute workflow
    const result = await executeWorkflow(context);
    // Verify result
    expect(result).toBeDefined();
  });
});
```

### Running Specific Tests

```bash
# Run specific file
npm test my-command.test.ts

# Run with pattern
npm test -- --grep "MyCommand"

# Watch mode
npm test -- --watch
```

---

## Code Style

### TypeScript Guidelines

**1. Use explicit types:**

```typescript
// Good
const value: string = 'hello';
function process(input: string): Promise<string> { }

// Avoid
const value = 'hello';
function process(input) { }
```

**2. Use interfaces for objects:**

```typescript
interface Config {
  name: string;
  enabled: boolean;
}
```

**3. Document public APIs:**

```typescript
/**
 * Process input data
 * @param input - The input string
 * @returns Processed output
 */
function process(input: string): string { }
```

**4. Use async/await:**

```typescript
// Good
async function load() {
  const data = await readFile('data.txt');
  return data;
}

// Avoid
function load() {
  return readFile('data.txt').then(data => data);
}
```

### Code Organization

**1. One class per file**

**2. Group related functions**

**3. Keep files under 500 lines**

**4. Use barrel exports** (`index.ts`)

### Naming Conventions

- **Classes**: PascalCase (`MyCommand`)
- **Interfaces**: PascalCase with `I` prefix (`ICommand`)
- **Functions**: camelCase (`executeCommand`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Files**: kebab-case (`my-command.ts`)

---

## Submitting Contributions

### Before Submitting

1. **Run tests:**
   ```bash
   npm test
   ```

2. **Lint code:**
   ```bash
   npm run lint
   ```

3. **Format code:**
   ```bash
   npm run format
   ```

4. **Build successfully:**
   ```bash
   npm run build
   ```

5. **Update documentation** if needed

### Pull Request Process

1. **Create a branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "Add my feature"
   ```

3. **Push to your fork:**
   ```bash
   git push origin feature/my-feature
   ```

4. **Open Pull Request:**
   - Go to GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in description

### Commit Message Guidelines

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(commands): add CSV parsing command

Adds new command for parsing CSV files with configurable delimiter.

Closes #123
```

```
fix(tasks): handle missing config file gracefully

Previously threw error, now uses defaults when config file is missing.
```

---

## Documentation

### Documentation Files

All documentation is in `open-tasks-wiki/`:

- `index.md` - Landing page
- `Installation.md` - Setup guide
- `Core-Tasks.md` - Task reference
- `Core-Commands.md` - Command reference
- `Core-Agents-Command-Builder.md` - Agent configurations
- `Example-Tasks.md` - Real-world examples
- `Building-Custom-Tasks.md` - Task development
- `Building-Custom-Commands.md` - Command development
- `Architecture.md` - System design

### Updating Documentation

When adding features:

1. **Update relevant docs** with new information
2. **Add examples** showing usage
3. **Update links** if structure changes
4. **Test examples** to ensure they work

### Documentation Style

- Use clear, concise language
- Include code examples
- Show both simple and advanced usage
- Link to related documentation
- Use proper markdown formatting

---

## Development Workflow

### Typical Development Cycle

```bash
# 1. Sync with upstream
git fetch upstream
git merge upstream/main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes
# ... edit files ...

# 4. Test locally
npm run dev-deploy
ot my-new-command

# 5. Run tests
npm test

# 6. Lint and format
npm run lint
npm run format

# 7. Commit changes
git add .
git commit -m "feat: add my feature"

# 8. Push and create PR
git push origin feature/my-feature
```

### Debugging

**1. Enable verbose output:**
```bash
ot my-command --verbose
```

**2. Check output files:**
```bash
ls -la .open-tasks/logs/
```

**3. Use console.log in development:**
```typescript
console.log('Debug:', value);
```

**4. Use Node debugger:**
```bash
node --inspect-brk dist/index.js my-command
```

---

## Getting Help

- **Documentation**: [Open Tasks Wiki](https://sergeigolos.github.io/open-tasks/)
- **Issues**: [GitHub Issues](https://github.com/SergeiGolos/open-tasks/issues)
- **Discussions**: [GitHub Discussions](https://github.com/SergeiGolos/open-tasks/discussions)

---

## License

By contributing to Open Tasks, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Open Tasks! 🎉
