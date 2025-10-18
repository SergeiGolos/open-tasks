---
title: "Contributing"
---

# Contributing to Open Tasks CLI

Help make Open Tasks CLI better!

## Development Setup

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- Git
- TypeScript knowledge

### Clone Repository

```bash
git clone https://github.com/bitcobblers/open-tasks.git
cd open-tasks/open-tasks-cli
```

### Install Dependencies

```bash
npm install
```

### Build Project

```bash
npm run build
```

### Link Globally (Optional)

For local testing:

```bash
npm link
```

Now `open-tasks` command uses your local development version.

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

Edit source files in `src/`:

```
src/
├── index.ts              # CLI entry point
├── router.ts             # Command routing
├── types.ts              # Type definitions
├── commands/             # Built-in commands
│   ├── init.ts
│   ├── create.ts
│   └── ...
└── workflow/             # Workflow processing
    ├── types.ts
    ├── in-memory-context.ts
    └── directory-output-context.ts
```

### 3. Build

```bash
npm run build
```

Or watch mode for development:

```bash
npm run dev
```

### 4. Test

```bash
npm test
```

With coverage:

```bash
npm run test:coverage
```

### 5. Lint

```bash
npm run lint
```

### 6. Format

```bash
npm run format
```

### 7. Commit

```bash
git add .
git commit -m "feat: add new feature"
```

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `chore:` - Build/tooling

### 8. Push and PR

```bash
git push origin feature/my-feature
```

Create pull request on GitHub.

## Project Structure

```
open-tasks-cli/
├── src/                   # Source code
│   ├── index.ts          # Entry point
│   ├── router.ts         # Command routing
│   ├── types.ts          # Type definitions
│   ├── commands/         # Built-in commands
│   └── workflow/         # Workflow processing
├── test/                 # Test files
│   ├── core.test.ts
│   ├── commands.test.ts
│   └── workflow.test.ts
├── dist/                 # Build output (gitignored)
├── templates/            # Task templates
├── docs/                 # Documentation (being migrated)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tsup.config.ts        # Build config
└── vitest.config.ts      # Test config
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:e2e
```

### Coverage

```bash
npm run test:coverage
```

Target: >80% coverage

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { MyClass } from '../src/my-module';

describe('MyClass', () => {
  it('should do something', () => {
    const instance = new MyClass();
    expect(instance.doSomething()).toBe(expected);
  });
});
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Explicit return types
- Avoid `any` type
- Use interfaces for contracts

### Naming

- **Classes**: PascalCase (`TaskHandler`)
- **Files**: kebab-case (`task-handler.ts`)
- **Functions**: camelCase (`executeTask`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_OUTPUT_DIR`)

### Formatting

```bash
npm run format
```

Uses Prettier with project configuration.

### Linting

```bash
npm run lint
```

Uses ESLint with TypeScript rules.

## Adding Features

### New Built-in Command

1. Create file in `src/commands/my-command.ts`
2. Implement command logic
3. Export default class
4. Add tests in `test/commands.test.ts`
5. Update documentation

Example:

```typescript
// src/commands/my-command.ts
import { ICommand, IWorkflowContext, MemoryRef } from '../workflow/types';

export default class MyCommand implements ICommand {
  constructor(private arg: string) {}

  async execute(context: IWorkflowContext): Promise<MemoryRef[]> {
    // Implementation
    const result = `Processed: ${this.arg}`;
    const ref = await context.store(result, []);
    return [ref];
  }
}
```

### New Pre-built Command

1. Add to command library exports
2. Document in Command Library wiki page
3. Add examples
4. Include in tests

### New IWorkflowContext Implementation

1. Create in `src/workflow/`
2. Implement IWorkflowContext interface
3. Add tests
4. Document usage

## Documentation

### Update Wiki

All user-facing documentation goes in `open-tasks-wiki/`:

- Architecture changes → `Architecture.md`
- New commands → `Command-Library.md`
- Usage examples → `Building-Tasks.md`
- Configuration → `Configuration.md`

### Code Comments

```typescript
/**
 * Brief description
 * 
 * Detailed explanation of what this does
 * 
 * @param arg - Description of parameter
 * @returns Description of return value
 * 
 * @example
 * ```typescript
 * const result = myFunction('value');
 * ```
 */
function myFunction(arg: string): string {
  // Implementation
}
```

## Pull Request Process

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Documentation updated
- [ ] Changelog updated (if applicable)
- [ ] Conventional commit messages

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
How have these changes been tested?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Submit PR
2. Automated checks run (CI/CD)
3. Code review by maintainers
4. Address feedback
5. Approval and merge

## Release Process

### Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Steps

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Commit: `chore: release v1.2.3`
4. Tag: `git tag v1.2.3`
5. Push: `git push && git push --tags`
6. Publish: `npm publish`

## Communication

### Issues

Report bugs or request features:
- **Bug Reports**: Include reproduction steps, error messages, environment
- **Feature Requests**: Describe use case, expected behavior, examples

### Discussions

For questions and ideas:
- GitHub Discussions
- Architecture decisions
- API design

### Code of Conduct

Be respectful, inclusive, and constructive. See CODE_OF_CONDUCT.md.

## Getting Help

- **Documentation**: Check wiki pages
- **Issues**: Search existing issues
- **Discussions**: Ask questions
- **Email**: maintainers@example.com

## Common Tasks

### Add Dependency

```bash
npm install package-name
npm install -D dev-package-name
```

### Update Dependencies

```bash
npm update
npm outdated  # Check for outdated packages
```

### Debug Tests

```bash
npm run test:debug
```

### Build for Production

```bash
npm run build
```

### Local End-to-End Test

```bash
npm run build
npm link
cd ../test-project
open-tasks init
open-tasks create test-task
```

## Thank You!

Your contributions make Open Tasks CLI better for everyone. Thank you for helping improve the project!

## Next Steps

- **[[Architecture]]** - Understand the design
- **[[Building Tasks]]** - Learn task development
- **[[System Commands]]** - Explore system commands
- **[[Quick Start]]** - Get started quickly
