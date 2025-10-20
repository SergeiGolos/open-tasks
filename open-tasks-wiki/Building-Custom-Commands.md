# Building Custom Commands

Create reusable, composable commands that integrate seamlessly with Open Tasks workflows.

## Overview

Commands are the fundamental building blocks in Open Tasks. Unlike tasks (which orchestrate workflows), commands are **single-responsibility units** that:

- Perform one specific operation
- Accept inputs through the workflow context
- Return outputs as references
- Can be composed with other commands
- Follow a consistent interface

---

## The ICommand Interface

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

### Parameters

- **context** (`IFlow`) - Workflow execution context
  - `context.get(ref)` - Retrieve a value by reference
  - `context.set(value, decorators)` - Store a value
  - `context.run(command)` - Execute another command
  - `context.cwd` - Current working directory
  - `context.outputDir` - Output directory path
  - `context.Tokens` - Token registry (Map)

- **args** (`any[]`) - Command-specific arguments

- **cardBuilder** (`ICardBuilder`) - Optional UI card builder

### Return Value

Returns an array of tuples: `[value, decorators[]][]`

- **value** - The command result (string, object, etc.)
- **decorators** - Metadata (tokens, timestamps, etc.)

---

## Basic Command Template

### Minimal Command

```javascript
import { ICommand, IFlow, IRefDecorator } from '../types.js';

export class MyCommand implements ICommand {
  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    // Command logic here
    const result = 'command output';
    
    // Return result with no decorators
    return [[result, []]];
  }
}
```

### Command with Parameters

```javascript
export class GreetCommand implements ICommand {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  async execute(
    context: IFlow,
    args: any[]
  ): Promise<[any, IRefDecorator[]][]> {
    const greeting = `Hello, ${this.name}!`;
    return [[greeting, []]];
  }
}
```

Usage:
```javascript
const ref = await flow.run(new GreetCommand('Alice'));
const greeting = await flow.get(ref[0]);
console.log(greeting); // "Hello, Alice!"
```

---

## Working with References

### Accepting References as Input

Commands can accept references to other values:

```javascript
import { StringRef } from '../types.js';

export class UpperCaseCommand implements ICommand {
  private inputRef: StringRef;

  constructor(inputRef: StringRef) {
    this.inputRef = inputRef;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    // Get the value from the reference
    const input = await context.get(this.inputRef);
    
    if (input === undefined) {
      throw new Error(`Input reference not found: ${this.inputRef.id}`);
    }
    
    // Transform it
    const result = input.toUpperCase();
    
    return [[result, []]];
  }
}
```

Usage:
```javascript
const textRef = await flow.run(new SetCommand('hello world'));
const upperRef = await flow.run(new UpperCaseCommand(textRef[0]));
const result = await flow.get(upperRef[0]);
console.log(result); // "HELLO WORLD"
```

### Returning Multiple Values

Commands can return multiple results:

```javascript
export class SplitCommand implements ICommand {
  private inputRef: StringRef;
  private separator: string;

  constructor(inputRef: StringRef, separator: string = ' ') {
    this.inputRef = inputRef;
    this.separator = separator;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    const input = await context.get(this.inputRef);
    const parts = input.split(this.separator);
    
    // Return multiple values
    return parts.map(part => [part, []]);
  }
}
```

Usage:
```javascript
const textRef = await flow.run(new SetCommand('one two three'));
const partsRefs = await flow.run(new SplitCommand(textRef[0]));

const part1 = await flow.get(partsRefs[0]); // "one"
const part2 = await flow.get(partsRefs[1]); // "two"
const part3 = await flow.get(partsRefs[2]); // "three"
```

---

## Using Decorators

Decorators add metadata to command outputs.

### TokenDecorator

Add a named token to a reference:

```javascript
import { TokenDecorator } from '../decorators.js';

export class StoreWithTokenCommand implements ICommand {
  private value: any;
  private token: string;

  constructor(value: any, token: string) {
    this.value = value;
    this.token = token;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    const decorators = [new TokenDecorator(this.token)];
    return [[this.value, decorators]];
  }
}
```

Now the value can be referenced by token in templates:
```javascript
await flow.run(new StoreWithTokenCommand('Alice', 'username'));
// In templates: {{username}} -> "Alice"
```

### Custom Decorators

Create your own decorators:

```typescript
import { IRefDecorator, StringRef } from '../types.js';

class MetadataDecorator implements IRefDecorator {
  constructor(private metadata: Record<string, any>) {}
  
  decorate(ref: StringRef): StringRef {
    return {
      ...ref,
      metadata: this.metadata
    };
  }
}
```

Usage:
```javascript
const metadata = { author: 'Alice', version: '1.0' };
const decorators = [new MetadataDecorator(metadata)];
return [[result, decorators]];
```

---

## File I/O Commands

### Reading Files

```javascript
import { promises as fs } from 'fs';
import path from 'path';

export class LoadFileCommand implements ICommand {
  private fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    const absolutePath = path.isAbsolute(this.fileName)
      ? this.fileName
      : path.join(context.cwd, this.fileName);

    try {
      await fs.access(absolutePath);
    } catch (error) {
      throw new Error(`File not found: ${this.fileName}`);
    }

    const content = await fs.readFile(absolutePath, 'utf-8');
    return [[content, []]];
  }
}
```

### Writing Files

```javascript
export class SaveFileCommand implements ICommand {
  private fileName: string;
  private contentRef: StringRef;

  constructor(fileName: string, contentRef: StringRef) {
    this.fileName = fileName;
    this.contentRef = contentRef;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    const content = await context.get(this.contentRef);
    
    if (content === undefined) {
      throw new Error(`Content reference not found`);
    }

    const absolutePath = path.isAbsolute(this.fileName)
      ? this.fileName
      : path.join(context.outputDir, this.fileName);

    await fs.writeFile(absolutePath, content, 'utf-8');
    
    // Return confirmation
    return [[`File written: ${absolutePath}`, []]];
  }
}
```

---

## Transformation Commands

### Text Transformation

```javascript
export class TransformCommand implements ICommand {
  private inputRef: StringRef;
  private transformer: (input: string) => string;

  constructor(inputRef: StringRef, transformer: (input: string) => string) {
    this.inputRef = inputRef;
    this.transformer = transformer;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    const input = await context.get(this.inputRef);
    
    if (input === undefined) {
      throw new Error('Input reference not found');
    }
    
    const result = this.transformer(input);
    return [[result, []]];
  }
}
```

Usage:
```javascript
// Uppercase transform
const upperRef = await flow.run(
  new TransformCommand(textRef[0], s => s.toUpperCase())
);

// Custom transform
const customRef = await flow.run(
  new TransformCommand(textRef[0], s => s.split('\n').join(', '))
);
```

### JSON Transformation

```javascript
export class JsonSelectCommand implements ICommand {
  private inputRef: StringRef;
  private selector: (obj: any) => any;

  constructor(inputRef: StringRef, selector: (obj: any) => any) {
    this.inputRef = inputRef;
    this.selector = selector;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    const jsonString = await context.get(this.inputRef);
    
    if (jsonString === undefined) {
      throw new Error('JSON reference not found');
    }
    
    const obj = JSON.parse(jsonString);
    const selected = this.selector(obj);
    
    // Return as JSON string
    const result = typeof selected === 'string' 
      ? selected 
      : JSON.stringify(selected);
    
    return [[result, []]];
  }
}
```

Usage:
```javascript
const jsonRef = await flow.run(
  new SetCommand('{"user": {"name": "Alice", "age": 25}}')
);

const nameRef = await flow.run(
  new JsonSelectCommand(jsonRef[0], obj => obj.user.name)
);

const name = await flow.get(nameRef[0]);
console.log(name); // "Alice"
```

---

## External Process Commands

### Running Shell Commands

```javascript
import { spawn } from 'child_process';

export class ShellCommand implements ICommand {
  private command: string;
  private args: string[];

  constructor(command: string, args: string[] = []) {
    this.command = command;
    this.args = args;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.command, this.args, {
        cwd: context.cwd,
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve([[stdout, []]]);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute command: ${error.message}`));
      });
    });
  }
}
```

### HTTP Requests

```javascript
export class HttpGetCommand implements ICommand {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    try {
      const response = await fetch(this.url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.text();
      return [[data, []]];
    } catch (error) {
      throw new Error(`Failed to fetch ${this.url}: ${error.message}`);
    }
  }
}
```

---

## Composing Commands

### Building Higher-Level Commands

Commands can use other commands internally:

```javascript
export class ProcessFileCommand implements ICommand {
  private fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    // Step 1: Read file
    const contentRefs = await context.run(
      new LoadFileCommand(this.fileName)
    );
    
    // Step 2: Transform
    const transformedRefs = await context.run(
      new TransformCommand(contentRefs[0], s => s.toUpperCase())
    );
    
    // Step 3: Save
    await context.run(
      new SaveFileCommand('output.txt', transformedRefs[0])
    );
    
    return transformedRefs;
  }
}
```

This approach keeps commands focused while enabling reuse.

---

## Error Handling

### Validation

```javascript
export class ValidateJsonCommand implements ICommand {
  private inputRef: StringRef;

  constructor(inputRef: StringRef) {
    this.inputRef = inputRef;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    const input = await context.get(this.inputRef);
    
    if (input === undefined) {
      throw new Error('Input reference not found');
    }
    
    try {
      const obj = JSON.parse(input);
      return [[JSON.stringify(obj), []]]; // Valid JSON
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }
}
```

### Graceful Failures

```javascript
export class TryLoadCommand implements ICommand {
  private fileName: string;
  private fallback: string;

  constructor(fileName: string, fallback: string = '') {
    this.fileName = fileName;
    this.fallback = fallback;
  }

  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    try {
      const refs = await context.run(new LoadFileCommand(this.fileName));
      return refs;
    } catch (error) {
      // Return fallback on failure
      return [[this.fallback, []]];
    }
  }
}
```

---

## Testing Commands

### Unit Test Example

```javascript
import { describe, it, expect } from 'vitest';
import { DirectoryOutputContext } from '../src/directory-output-context.js';
import { UpperCaseCommand } from './uppercase-command.js';
import { SetCommand } from '../src/commands/set.js';

describe('UpperCaseCommand', () => {
  it('should convert text to uppercase', async () => {
    const context = new DirectoryOutputContext(
      process.cwd(),
      '/tmp/test-output'
    );
    
    // Create input
    const inputRef = await context.run(new SetCommand('hello world'));
    
    // Execute command
    const outputRef = await context.run(new UpperCaseCommand(inputRef[0]));
    
    // Verify result
    const result = await context.get(outputRef[0]);
    expect(result).toBe('HELLO WORLD');
  });
  
  it('should handle empty input', async () => {
    const context = new DirectoryOutputContext(
      process.cwd(),
      '/tmp/test-output'
    );
    
    const inputRef = await context.run(new SetCommand(''));
    const outputRef = await context.run(new UpperCaseCommand(inputRef[0]));
    const result = await context.get(outputRef[0]);
    
    expect(result).toBe('');
  });
});
```

---

## Best Practices

### 1. Single Responsibility

```javascript
// Good: Does one thing well
export class UpperCaseCommand implements ICommand { /* ... */ }
export class TrimCommand implements ICommand { /* ... */ }

// Avoid: Multiple unrelated operations
export class DoEverythingCommand implements ICommand {
  async execute(context: IFlow) {
    // Uppercase, trim, validate, save, send email, etc.
  }
}
```

### 2. Immutability

Commands should not modify their inputs:

```javascript
// Good: Return new value
async execute(context: IFlow) {
  const input = await context.get(this.inputRef);
  const result = input.toUpperCase(); // New value
  return [[result, []]];
}

// Avoid: Modifying input
async execute(context: IFlow) {
  const input = await context.get(this.inputRef);
  input.value = input.value.toUpperCase(); // Mutation
  return [[input, []]];
}
```

### 3. Clear Constructors

Make command parameters obvious:

```javascript
// Good: Clear parameters
export class ReplaceCommand implements ICommand {
  constructor(
    private templateRef: StringRef,
    private replacements: Record<string, string>
  ) {}
}

// Usage is self-documenting
new ReplaceCommand(templateRef, { name: 'Alice' })
```

### 4. Error Messages

Provide helpful error messages:

```javascript
async execute(context: IFlow) {
  const input = await context.get(this.inputRef);
  
  if (input === undefined) {
    throw new Error(
      `Reference not found: ${this.inputRef.token || this.inputRef.id}. ` +
      `Make sure the reference was created before using it.`
    );
  }
  
  // ...
}
```

### 5. Type Safety

Use TypeScript for better type safety:

```typescript
export class TypedCommand implements ICommand {
  constructor(private config: { 
    maxLength: number;
    encoding: 'utf-8' | 'ascii';
  }) {}
  
  async execute(context: IFlow): Promise<[any, IRefDecorator[]][]> {
    // TypeScript ensures config is correct
  }
}
```

---

## Next Steps

- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Chain commands into workflows
- **[Example Tasks](./Example-Tasks.md)** - See commands in action
- **[Core Commands](./Core-Commands.md)** - Study built-in commands

## See Also

- **[Architecture](./Architecture.md)** - System design overview
- **[CONTRIBUTING](https://github.com/SergeiGolos/open-tasks/blob/main/CONTRIBUTING.md)** - Development guide
