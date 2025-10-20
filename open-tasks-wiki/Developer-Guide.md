# Developer Guide

This guide helps you get started developing Open Tasks CLI, whether you're fixing bugs, adding features, or creating extensions.

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- Code editor (VS Code recommended)

### Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd open-tasks

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

### Verify Installation

```bash
# Check version
ot --version

# Run a test command
ot init
```

## Project Structure

```
open-tasks/
├── src/                          # Source code
│   ├── index.ts                 # CLI entry point
│   ├── router.ts                # Command routing
│   ├── command-loader.ts        # Command discovery
│   ├── types.ts                 # Core interfaces
│   ├── cards/                   # Card builders
│   ├── tasks/                   # Built-in tasks
│   └── commands/                # Built-in commands
│
├── dist/                         # Built output (generated)
├── node_modules/                 # Dependencies (generated)
│
├── package.json                  # Project manifest
├── tsconfig.json                # TypeScript config
├── tsup.config.ts               # Build config
├── vitest.config.ts             # Test config
│
├── README.md                     # Project README
└── LICENSE                       # License file
```

## Development Workflow

### 1. Make Changes

Edit source files in `src/`:

```typescript
// src/tasks/my-feature.ts
export default class MyFeature extends TaskHandler {
  name = 'my-feature';
  description = 'My new feature';
  examples = ['ot my-feature'];
  
  async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: IFlow,
    synk: IOutputSynk
  ): Promise<ReferenceHandle> {
    // Implementation
    return { id: 'result', content: 'done', timestamp: new Date() };
  }
}
```

### 2. Build

```bash
# Build once
npm run build

# Build and watch for changes
npm run dev
```

The build process:
1. TypeScript compilation
2. Bundle creation with tsup
3. Type definitions generation

### 3. Test Locally

```bash
# Link your local build
npm link

# Test your changes
ot my-feature

# Or use npx
npx ot my-feature
```

### 4. Hot Reload Development

For rapid iteration:

```bash
# Terminal 1: Watch and rebuild
npm run dev

# Terminal 2: Deploy locally on each build
npm run dev-deploy

# Terminal 3: Test
ot my-feature
```

## Building Features

### Adding a New Command

1. **Create Command File**

   ```bash
   # Create in src/tasks/ for built-in commands
   touch src/tasks/my-command.ts
   ```

2. **Implement Command**

   ```typescript
   import { TaskHandler } from '../task-handler.js';
   import { ExecutionContext, ReferenceHandle, IOutputSynk } from '../types.js';
   import { IFlow } from '../types.js';
   import { MessageCard } from '../cards/MessageCard.js';

   export default class MyCommand extends TaskHandler {
     name = 'my-command';
     description = 'Does something useful';
     examples = [
       'ot my-command arg1',
       'ot my-command arg1 --token result',
     ];

     protected override async executeCommand(
       config: Record<string, any>,
       args: string[],
       workflowContext: IFlow,
       outputBuilder: IOutputSynk
     ): Promise<ReferenceHandle> {
       // Validate input
       if (args.length === 0) {
         throw new Error('Argument required');
       }

       // Show progress
       outputBuilder.write('Processing...');

       // Do work
       const result = processData(args[0]);

       // Store result
       const ref = await workflowContext.set(result, []);

       // Show success
       outputBuilder.write(
         new MessageCard('✓ Success', 'Command completed', 'success')
       );

       return {
         id: ref.id,
         content: result,
         timestamp: new Date(),
       };
     }
   }
   ```

3. **Build and Test**

   ```bash
   npm run build
   npm link
   ot my-command test-arg
   ```

### Adding a New Card Type

1. **Create Card File**

   ```bash
   touch src/cards/MyCard.ts
   ```

2. **Implement Card Builder**

   ```typescript
   import boxen from 'boxen';
   import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';

   export class MyCard implements ICardBuilder {
     name: string;
     type: string = 'MyCard';
     verbosity?: VerbosityLevel;

     constructor(
       private title: string,
       private data: any,
       private style: CardStyle = 'default',
       verbosity?: VerbosityLevel
     ) {
       this.name = `MyCard:${title}`;
       this.verbosity = verbosity;
     }

     build(): string {
       const content = this.formatContent(this.data);
       return boxen(content, {
         title: this.title,
         padding: 1,
         borderStyle: 'round',
         borderColor: this.getBorderColor(this.style),
       });
     }

     private formatContent(data: any): string {
       // Custom formatting logic
       return JSON.stringify(data, null, 2);
     }

     private getBorderColor(style: CardStyle): string {
       const colors = {
         success: 'green',
         error: 'red',
         warning: 'yellow',
         info: 'blue',
         dim: 'gray',
         default: 'white',
       };
       return colors[style] || 'white';
     }
   }
   ```

3. **Export from Index**

   ```typescript
   // src/cards/index.ts
   export { MyCard } from './MyCard.js';
   ```

4. **Use in Commands**

   ```typescript
   import { MyCard } from '../cards/MyCard.js';

   outputBuilder.write(new MyCard('Title', { data: 'value' }, 'info'));
   ```

### Adding a New Decorator

1. **Create Decorator File**

   ```bash
   # Add to src/decorators.ts or create new file
   ```

2. **Implement Decorator**

   ```typescript
   import { IRefDecorator, StringRef } from './types.js';

   export class MyDecorator implements IRefDecorator {
     constructor(private value: string) {}

     decorate(ref: StringRef): StringRef {
       return {
         ...ref,
         // Modify ref properties
         fileName: `${this.value}-${ref.fileName}`,
       };
     }
   }
   ```

3. **Use in Commands**

   ```typescript
   import { MyDecorator } from '../decorators.js';

   const ref = await flow.set(data, [new MyDecorator('prefix')]);
   ```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.spec.ts
```

### Writing Tests

Create test files with `.test.ts` or `.spec.ts` extension:

```typescript
import { describe, it, expect } from 'vitest';
import MyCommand from '../src/tasks/my-command.js';

describe('MyCommand', () => {
  it('should process input correctly', async () => {
    const command = new MyCommand();
    const result = await command.execute(
      ['test-input'],
      mockContext
    );
    
    expect(result.content).toBe('expected-output');
  });

  it('should throw error on invalid input', async () => {
    const command = new MyCommand();
    
    await expect(
      command.execute([], mockContext)
    ).rejects.toThrow('Argument required');
  });
});
```

### Test Utilities

Create mock contexts for testing:

```typescript
const mockContext = {
  cwd: '/test',
  outputDir: '/test/output',
  outputSynk: {
    write: (msg: any) => { /* mock */ },
  },
  workflowContext: {
    cwd: '/test',
    set: async (val: any) => ({ id: 'test', fileName: 'test.txt', timestamp: new Date() }),
    get: async (ref: any) => 'test data',
    run: async (cmd: any) => [],
  },
  config: {},
  verbosity: 'summary',
};
```

## Linting and Formatting

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Formatting

```bash
# Format code with Prettier
npm run format

# Check formatting
npm run format -- --check
```

### Configuration

- **ESLint:** `.eslintrc.json` or `eslint.config.js`
- **Prettier:** `.prettierrc` or `prettier.config.js`
- **TypeScript:** `tsconfig.json`

## Debugging

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Command",
      "program": "${workspaceFolder}/dist/index.js",
      "args": ["my-command", "arg1"],
      "skipFiles": ["<node_internals>/**"],
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Console Debugging

Add debug logging:

```typescript
console.log('Debug:', value);
console.error('Error:', error);

// Or use the output synk
outputBuilder.write(`Debug: ${JSON.stringify(data, null, 2)}`);
```

### Verbose Mode

Run commands with verbose flag:

```bash
ot my-command --verbose
```

## Build Configuration

### TypeScript Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Build Config (`tsup.config.ts`)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/tasks/**/*.ts'],
  format: ['esm'],
  target: 'es2022',
  dts: true,
  clean: true,
  sourcemap: true,
});
```

## Publishing

### Pre-publish Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run all tests: `npm test`
4. Build: `npm run build`
5. Verify build artifacts in `dist/`

### Publishing to npm

```bash
# Login to npm
npm login

# Publish (runs prepublishOnly script)
npm publish

# Or publish with tag
npm publish --tag beta
```

### Version Management

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major
```

## Contributing Guidelines

### Code Style

1. **TypeScript** - All new code in TypeScript
2. **Strict Mode** - Enable strict type checking
3. **Async/Await** - Prefer over callbacks or promises
4. **ESM** - Use ES modules, not CommonJS
5. **Naming** - Use descriptive, clear names

### Commit Messages

Follow conventional commits:

```
feat: add new command for validation
fix: correct reference handling
docs: update architecture guide
test: add tests for card builders
refactor: simplify command loading
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and commit: `git commit -m "feat: add my feature"`
4. Push to fork: `git push origin feature/my-feature`
5. Open pull request with description
6. Address review feedback
7. Squash and merge when approved

## Common Tasks

### Add a Built-in Command

```bash
# 1. Create file
touch src/tasks/new-command.ts

# 2. Implement (see "Adding a New Command" above)

# 3. Build
npm run build

# 4. Test
npm link
ot new-command
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all
npm update

# Update specific package
npm install package@latest

# Update and save to package.json
npm install package@latest --save
```

### Debug Build Issues

```bash
# Clean build
rm -rf dist/
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Verify imports
node --experimental-modules dist/index.js
```

## Troubleshooting

### Build Fails

**Issue:** TypeScript compilation errors

**Solution:**
```bash
# Check TypeScript version
npx tsc --version

# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

### Tests Fail

**Issue:** Tests not finding modules

**Solution:**
```bash
# Ensure test dependencies installed
npm install --include=dev

# Check vitest config
cat vitest.config.ts
```

### Command Not Found After npm link

**Issue:** `open-tasks` command not recognized

**Solution:**
```bash
# Check npm global bin
npm bin -g

# Ensure it's in PATH
echo $PATH

# Re-link
npm unlink
npm link
```

## Advanced Topics

### Custom TypeScript Paths

Add path aliases to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/cards/*": ["src/cards/*"],
      "@/types": ["src/types.ts"]
    }
  }
}
```

### Extending the Type System

Add new types in `src/types.ts`:

```typescript
export interface MyNewType {
  field: string;
  data: any;
}
```

### Performance Profiling

```bash
# Profile command execution
node --prof dist/index.js my-command

# Generate readable output
node --prof-process isolate-*.log > profile.txt
```

## Resources

### Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Commander.js Guide](https://github.com/tj/commander.js/)
- [Boxen Documentation](https://github.com/sindresorhus/boxen)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

## Next Steps

- **[Architecture](./Architecture.md)** - Understand system design
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Create commands
- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Compose workflows

---

**Questions?** Open an issue on GitHub or check existing documentation.
