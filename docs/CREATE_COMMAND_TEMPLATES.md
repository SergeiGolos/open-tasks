# Create Command Templates

## Overview

The `create` command now supports two template types:
1. **Minimal Template** (default) - A bare-bones starter with just the essentials
2. **Example Template** (with `--example` flag) - A full hello-world demonstration

## TypeScript Parameter Property Fix

**Issue**: TypeScript parameter properties (e.g., `constructor(private value: any)`) are not supported by Node.js in strip-only mode when running `.ts` files directly.

**Solution**: All templates now use explicit property declarations:

```typescript
// ❌ Old (doesn't work in strip-only mode)
class MyClass {
  constructor(private value: string) {}
}

// ✅ New (works everywhere)
class MyClass {
  value: string;
  
  constructor(value: string) {
    this.value = value;
  }
}
```

## Template Types

### 1. Minimal Template (Default)

Created when running: `ot create my-command`

**Features**:
- Bare-bones command class with required structure
- Access to `context.workflowContext` and `context.outputSynk`
- TODO comment for implementation guidance
- Simple return reference handle
- ~30 lines of code

**Example**:
```bash
ot create my-command --description "My custom command"
```

**Generated Code**:
```typescript
export default class MyCommandCommand {
  name = 'my-command';
  description = 'My custom command';
  examples = [
    'ot my-command',
    'ot my-command [args]',
  ];

  async execute(args: string[], context: any): Promise<any> {
    const flow = context.workflowContext;
    const output = context.outputSynk;

    // TODO: Implement your command logic here
    output.writeInfo('Executing my-command command...');

    return {
      id: 'my-command-result',
      content: 'Command executed successfully',
      token: 'my-command',
      timestamp: new Date(),
    };
  }
}
```

### 2. Example Template (with --example)

Created when running: `ot create my-command --example`

**Features**:
- Full hello-world workflow demonstration
- Shows IFlow command composition pattern
- Four example command classes:
  - `TokenDecorator` - Adds metadata to references
  - `SetCommand` - Stores values in workflow context
  - `ReplaceCommand` - Template replacement logic
  - `DisplayCardCommand` - Formatted output display
- Complete working example ready to run
- ~140 lines of code with extensive comments

**Example**:
```bash
ot create hello-world --example --description "Hello world demo"
ot hello-world Alice
```

**Use Cases**:
- Learning the IFlow command pattern
- Understanding workflow composition
- Reference implementation for custom commands
- Quick prototyping starting point

## Usage Examples

```bash
# Create minimal command (TypeScript, default)
ot create my-task

# Create minimal command with description
ot create my-task --description "Does something useful"

# Create example hello-world command
ot create demo --example

# Create JavaScript version
ot create my-task --javascript

# Create example in JavaScript
ot create demo --example --javascript
```

## Command Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--example` | Creates full hello-world example template | `false` (minimal) |
| `--javascript` | Creates JavaScript instead of TypeScript | `false` (TypeScript) |
| `--description "text"` | Sets command description | `"Custom command"` |

## Best Practices

### Starting with Minimal Template

Use the minimal template when you:
- Know exactly what you want to build
- Don't need a reference implementation
- Want a clean slate with minimal boilerplate
- Are building a simple command

### Starting with Example Template

Use the example template when you:
- Are new to the open-tasks command pattern
- Need to understand workflow composition
- Want a working reference implementation
- Are prototyping and want to modify existing logic

### From Example to Custom Command

1. Start with example: `ot create my-command --example`
2. Run it to see how it works: `ot my-command`
3. Modify the workflow steps to match your needs
4. Replace/remove example classes with your logic
5. Update the `execute()` method

## Migration Guide

### Fixing Existing Commands

If you have existing custom commands with TypeScript parameter properties:

```typescript
// ❌ Old syntax (will fail in strip-only mode)
class MyCommand {
  constructor(private value: string, private token?: string) {}
}

// ✅ New syntax (works in all modes)
class MyCommand {
  value: string;
  token?: string;

  constructor(value: string, token?: string) {
    this.value = value;
    this.token = token;
  }
}
```

### Automated Fix

Run the create command to generate new templates with fixed syntax:
```bash
# Remove old command
rm .open-tasks/my-command.ts

# Recreate with fixed template
ot create my-command --example  # or without --example for minimal
```

## Technical Details

### Why Strip-Only Mode?

Node.js 22+ supports running TypeScript files directly using the `--experimental-strip-types` flag. This mode:
- Strips type annotations without type checking
- Runs significantly faster than transpilation
- Doesn't support advanced TypeScript features like parameter properties
- Requires explicit property declarations

### Template Location

All custom commands are created in: `.open-tasks/[command-name].ts|js`

### Auto-Loading

Custom commands are automatically discovered and loaded by the CLI at runtime. No registration or configuration needed.
