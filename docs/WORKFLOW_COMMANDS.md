# Built-in Workflow Commands

This document describes the new built-in commands available as ICommand implementations for use in workflow pipelines.

## Overview

These commands are designed to be used programmatically in workflow pipelines using the `IFlow.run()` API. Unlike CLI commands, these are TypeScript classes that implement the `ICommand` interface and can be composed together in complex workflows.

## Commands

### SetCommand (already exists)

Store a value in the workflow context.

```typescript
import { SetCommand } from './commands';

// Store a simple value
const refs = await flow.run(new SetCommand('Hello, World!'));

// Store with a token
const refs = await flow.run(new SetCommand('Hello', 'greeting'));
```

### ReadCommand

Reads content from a file and stores it in the workflow context.

```typescript
import { ReadCommand } from './commands';

// Read from a file
const refs = await flow.run(new ReadCommand('data.txt'));
const content = await flow.get(refs[0]);
```

**Parameters:**
- `fileName` (string): Path to the file to read (absolute or relative to cwd)

**Returns:** Array with one StringRef containing the file content

**Errors:** Throws if file doesn't exist

### WriteCommand

Writes content from a StringRef to a file.

```typescript
import { WriteCommand } from './commands';

// Write content to a file
const contentRef = await flow.run(new SetCommand('Content to write'));
await flow.run(new WriteCommand('output.txt', contentRef[0]));
```

**Parameters:**
- `fileName` (string): Path to the file to write (absolute or relative to cwd)
- `contentRef` (StringRef): Reference to the content to write

**Returns:** Array with one StringRef containing the file path

**Behavior:** Creates directories if they don't exist

### TemplateCommand

Processes templates with token replacement from the workflow context.

```typescript
import { TemplateCommand } from './commands';

// From a string template
await flow.run(new SetCommand('World', 'name'));
const result = await flow.run(
  new TemplateCommand('Hello {{name}}!')
);

// From a file
const result = await flow.run(
  new TemplateCommand('template.html')
);

// From a StringRef
const templateRef = await flow.run(new SetCommand('Hello {{name}}!'));
const result = await flow.run(new TemplateCommand(templateRef[0]));
```

**Parameters:**
- `source` (string | StringRef): Either a filename, template string, or StringRef

**Returns:** Array with one StringRef containing the processed template

**Behavior:**
- Replaces `{{tokenName}}` with values from context
- If source is a string, tries to read as file first, falls back to treating as template
- Unmatched tokens are left as-is

### MatchCommand

Matches a regex pattern and assigns captured groups to tokens.

```typescript
import { MatchCommand } from './commands';

const text = await flow.run(
  new SetCommand('John Doe, age 30')
);

const results = await flow.run(
  new MatchCommand(
    text[0],
    /(\w+) (\w+), age (\d+)/,
    ['firstName', 'lastName', 'age']
  )
);

// results[0] has token 'firstName' with value 'John'
// results[1] has token 'lastName' with value 'Doe'
// results[2] has token 'age' with value '30'
```

**Parameters:**
- `contentRef` (StringRef): Reference to the content to match against
- `regexPattern` (string | RegExp): Regular expression pattern
- `tokens` (string[]): Array of token names to assign to captured groups

**Returns:** Array of StringRefs, one for each captured group, with assigned tokens

**Errors:** Throws if no match is found

### TextTransformCommand

Transforms string content using a function.

```typescript
import { TextTransformCommand } from './commands';

const text = await flow.run(new SetCommand('hello world'));

// Transform to uppercase
const upper = await flow.run(
  new TextTransformCommand(text[0], (s) => s.toUpperCase())
);

// Custom transformation
const trimmed = await flow.run(
  new TextTransformCommand(text[0], (s) => s.trim())
);
```

**Parameters:**
- `contentRef` (StringRef): Reference to the content to transform
- `transformFn` ((input: string) => string): Transformation function

**Returns:** Array with one StringRef containing the transformed content

### JsonTransformCommand

Transforms JSON content using a function.

```typescript
import { JsonTransformCommand } from './commands';

const json = await flow.run(
  new SetCommand('{"name": "John", "age": 30}')
);

// Extract a field
const name = await flow.run(
  new JsonTransformCommand(json[0], (obj) => obj.name)
);

// Transform and return object (will be JSON-serialized)
const users = await flow.run(
  new JsonTransformCommand(json[0], (obj) => obj.users)
);
```

**Parameters:**
- `contentRef` (StringRef): Reference to the JSON content to transform
- `transformFn` ((input: any) => any): Transformation function

**Returns:** Array with one StringRef containing:
  - The string as-is if the result is a string
  - JSON-serialized result for non-string values

**Errors:** Throws if content is not valid JSON

### QuestionCommand

Prompts user for input and stores the response.

```typescript
import { QuestionCommand } from './commands';

// Direct prompt
const answer = await flow.run(
  new QuestionCommand('What is your name?')
);

// Prompt from StringRef
const promptRef = await flow.run(
  new SetCommand('Enter your email:')
);
const email = await flow.run(new QuestionCommand(promptRef[0]));
```

**Parameters:**
- `prompt` (string | StringRef): Either a message string or StringRef containing the prompt

**Returns:** Array with one StringRef containing the user's response

**Behavior:** Blocks execution until user provides input

### JoinCommand

Joins an array of strings and StringRefs into a single string.

```typescript
import { JoinCommand } from './commands';

// Join string literals
const result = await flow.run(
  new JoinCommand(['Hello', ', ', 'World', '!'])
);

// Join StringRefs
const part1 = await flow.run(new SetCommand('Hello'));
const part2 = await flow.run(new SetCommand('World'));
const joined = await flow.run(
  new JoinCommand([part1[0], ' ', part2[0]])
);

// Mix strings and StringRefs
const name = await flow.run(new SetCommand('Alice'));
const greeting = await flow.run(
  new JoinCommand(['Hello, ', name[0], '!'])
);
```

**Parameters:**
- `parts` ((string | StringRef)[]): Array of strings and StringRefs to join

**Returns:** Array with one StringRef containing the joined string

## Example Workflow

Here's a complete example showing how to use multiple commands together:

```typescript
import { DirectoryOutputContext } from './directory-output-context';
import {
  SetCommand,
  ReadCommand,
  WriteCommand,
  TemplateCommand,
  MatchCommand,
  TextTransformCommand,
  JsonTransformCommand,
  JoinCommand
} from './commands';

// Create workflow context
const context = new DirectoryOutputContext(process.cwd(), '.output');

// Read a JSON file
const jsonRef = await context.run(new ReadCommand('user.json'));

// Parse and extract name
const nameRef = await context.run(
  new JsonTransformCommand(jsonRef[0], (obj) => obj.name)
);

// Store as token for template use
await context.run(new SetCommand(await context.get(nameRef[0]), 'userName'));

// Process a template
const messageRef = await context.run(
  new TemplateCommand('Welcome {{userName}}!')
);

// Transform to uppercase
const upperRef = await context.run(
  new TextTransformCommand(messageRef[0], (s) => s.toUpperCase())
);

// Write result to file
await context.run(new WriteCommand('output.txt', upperRef[0]));

console.log('Workflow completed!');
```

## Integration with Existing Codebase

These commands integrate with the existing workflow system:

- They implement the `ICommand` interface
- They work with `IFlow` context (like `DirectoryOutputContext`)
- They use `StringRef` for references
- They support decorators via the return tuple `[value, decorators[]]`
- They can be composed in complex workflows using `flow.run()`

## Testing

All commands have comprehensive tests in `tests/commands.test.ts`. Run tests with:

```bash
npm test
```

## Notes

- All file operations respect the `cwd` property of the `IFlow` context
- Relative paths are resolved relative to `cwd`
- The `TemplateCommand` intelligently handles both file paths and template strings
- The `QuestionCommand` is designed for interactive workflows
- All commands follow the same error handling patterns as existing commands
