---
title: "Command Library"
---

# Command Library

Pre-built commands available in Open Tasks CLI.

## Overview

Open Tasks CLI provides a rich library of pre-built commands that implement the `ICommand` interface. Use these commands within your tasks to build workflows without writing low-level implementations.

## Importing Commands

```typescript
import { 
  PowershellCommand,
  ClaudeCommand,
  RegexCommand,
  TemplateCommand,
  FileCommand
} from 'open-tasks-cli/commands';
```

## PowershellCommand

Execute PowerShell commands and capture output.

### Constructor

```typescript
new PowershellCommand(script: string)
```

### Usage

```typescript
// Execute command
const cmd = new PowershellCommand('Get-Content ./data.txt');
const [outputRef] = await context.run(cmd);

// List directory
const lsCmd = new PowershellCommand('Get-ChildItem');
const [listRef] = await context.run(lsCmd);

// Execute git command
const gitCmd = new PowershellCommand('git log --oneline -5');
const [logRef] = await context.run(gitCmd);

// Multiple commands (use semicolon)
const multiCmd = new PowershellCommand('cd ./src; Get-ChildItem *.ts');
const [filesRef] = await context.run(multiCmd);
```

### Use Cases

- File system operations
- Execute git commands
- Run build scripts
- Query system information
- Process data with shell tools

### Return Value

Returns `MemoryRef[]` with one element containing the command output.

---

## ClaudeCommand

Process inputs using Claude AI.

### Constructor

```typescript
new ClaudeCommand(prompt: string, inputs: MemoryRef[])
```

### Usage

```typescript
// Analyze code
const codeRef = await context.store(sourceCode, [new TokenDecorator('code')]);
const analyzeCmd = new ClaudeCommand(
  "Review this code for bugs and security issues",
  [codeRef]
);
const [analysisRef] = await context.run(analyzeCmd);

// Generate documentation
const apiRef = await context.store(apiSpec, [new TokenDecorator('api')]);
const docCmd = new ClaudeCommand(
  "Generate API documentation in Markdown format",
  [apiRef]
);
const [docsRef] = await context.run(docCmd);

// Summarize multiple files
const file1Ref = /* ... */;
const file2Ref = /* ... */;
const summaryCmd = new ClaudeCommand(
  "Provide a high-level summary of this project based on these files",
  [file1Ref, file2Ref]
);
const [summaryRef] = await context.run(summaryCmd);
```

### Configuration

Requires Claude API key configuration (see **[[Configuration]]**).

### Use Cases

- Code review and analysis
- Generate documentation
- Transform data formats
- Summarize content
- Answer questions about code/data

### Return Value

Returns `MemoryRef[]` with one element containing the AI response.

---

## RegexCommand

Apply regex patterns to extract or transform text.

### Constructor

```typescript
new RegexCommand(pattern: RegExp, inputRef: MemoryRef)
new RegexCommand(pattern: RegExp, replacement: string, inputRef: MemoryRef)
```

### Usage

```typescript
// Extract email addresses
const emailRegex = new RegexCommand(
  /[\w.-]+@[\w.-]+\.\w+/g,
  contentRef
);
const [emailsRef] = await context.run(emailRegex);

// Mask credit card numbers
const maskCmd = new RegexCommand(
  /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g,
  'XXXX-XXXX-XXXX-XXXX',
  dataRef
);
const [maskedRef] = await context.run(maskCmd);

// Extract function names from code
const funcRegex = new RegexCommand(
  /function\s+(\w+)\s*\(/g,
  codeRef
);
const [functionsRef] = await context.run(funcRegex);

// Replace URLs
const urlCmd = new RegexCommand(
  /https?:\/\/[^\s]+/g,
  '[LINK]',
  htmlRef
);
const [cleanRef] = await context.run(urlCmd);
```

### Use Cases

- Extract data patterns
- Mask sensitive information
- Clean up text
- Parse structured content
- Find and replace patterns

### Return Value

Returns `MemoryRef[]` with one element containing:
- **Extract mode** (no replacement): Matched strings (one per line)
- **Replace mode** (with replacement): Transformed text

---

## TemplateCommand

Perform template variable substitution.

### Constructor

```typescript
new TemplateCommand(template: string, variables: Map<string, MemoryRef>)
```

### Usage

```typescript
// Simple substitution
const nameRef = await context.store("Alice", [new TokenDecorator('name')]);
const roleRef = await context.store("Developer", [new TokenDecorator('role')]);

const variables = new Map([
  ['name', nameRef],
  ['role', roleRef]
]);

const templateCmd = new TemplateCommand(
  "{{name}} is a {{role}}",
  variables
);
const [resultRef] = await context.run(templateCmd);
// Result: "Alice is a Developer"

// Generate configuration
const domainRef = await context.store("example.com", []);
const portRef = await context.store("8080", []);

const configVars = new Map([
  ['domain', domainRef],
  ['port', portRef]
]);

const configCmd = new TemplateCommand(
  "server: https://{{domain}}:{{port}}/api",
  configVars
);
const [configRef] = await context.run(configCmd);

// Build deployment command
const envRef = await context.store("production", []);
const versionRef = await context.store("v1.2.3", []);

const deployVars = new Map([
  ['env', envRef],
  ['version', versionRef]
]);

const deployCmd = new TemplateCommand(
  "deploy --env={{env}} --version={{version}}",
  deployVars
);
const [commandRef] = await context.run(deployCmd);
```

### Template Syntax

- Variables: `{{variableName}}`
- Must match keys in the variables Map
- Missing variables result in empty string

### Use Cases

- Generate configuration files
- Build dynamic commands
- Create parameterized scripts
- Interpolate variables
- Construct API requests

### Return Value

Returns `MemoryRef[]` with one element containing the interpolated text.

---

## FileCommand

Read and write files with various operations.

### Constructor

```typescript
new FileCommand(operation: 'read' | 'write' | 'append', filePath: string, content?: MemoryRef)
```

### Usage

```typescript
// Read file
const readCmd = new FileCommand('read', './data.txt');
const [contentRef] = await context.run(readCmd);

// Write file
const dataRef = await context.store("new content", [new TokenDecorator('data')]);
const writeCmd = new FileCommand('write', './output.txt', dataRef);
await context.run(writeCmd);

// Append to file
const logRef = await context.store("Log entry", []);
const appendCmd = new FileCommand('append', './log.txt', logRef);
await context.run(appendCmd);

// Workflow: Read, transform, write
const readCmd = new FileCommand('read', './input.txt');
const [inputRef] = await context.run(readCmd);

// Transform with regex
const transformCmd = new RegexCommand(/foo/g, 'bar', inputRef);
const [transformedRef] = await context.run(transformCmd);

// Write result
const writeCmd = new FileCommand('write', './output.txt', transformedRef);
await context.run(writeCmd);
```

### Operations

- **`read`**: Read file content, return MemoryRef
- **`write`**: Write MemoryRef content to file (overwrites)
- **`append`**: Append MemoryRef content to file

### Use Cases

- Load data for processing
- Save workflow results
- Append to logs
- Read configuration
- Write generated content

### Return Value

- **read**: Returns `MemoryRef[]` with one element containing file content
- **write/append**: Returns empty `MemoryRef[]` (operation succeeds or throws)

---

## CurlCommand

Execute HTTP requests (wrapper around curl).

### Constructor

```typescript
new CurlCommand(url: string, options?: CurlOptions)
```

### Usage

```typescript
// Simple GET request
const getCmd = new CurlCommand('https://api.example.com/data');
const [responseRef] = await context.run(getCmd);

// POST with data
const postData = await context.store('{"key": "value"}', []);
const postCmd = new CurlCommand('https://api.example.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: postData
});
const [resultRef] = await context.run(postCmd);

// With authentication
const authCmd = new CurlCommand('https://api.example.com/secure', {
  headers: { 'Authorization': 'Bearer token123' }
});
const [dataRef] = await context.run(authCmd);
```

### Options

```typescript
interface CurlOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: MemoryRef;
}
```

### Use Cases

- Fetch external data
- Call REST APIs
- Submit forms
- Download resources
- Integrate with web services

### Return Value

Returns `MemoryRef[]` with one element containing the HTTP response body.

---

## Command Composition

Commands are designed to chain together via MemoryRef passing:

```typescript
async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
  const outcome = this.initOutcome();

  // Step 1: Fetch data
  const fetchCmd = new CurlCommand('https://api.example.com/data');
  const [dataRef] = await context.run(fetchCmd);
  
  // Step 2: Extract specific field
  const extractCmd = new RegexCommand(/"value":"([^"]+)"/, dataRef);
  const [valueRef] = await context.run(extractCmd);
  
  // Step 3: Use in template
  const vars = new Map([['apiValue', valueRef]]);
  const templateCmd = new TemplateCommand('Result: {{apiValue}}', vars);
  const [messageRef] = await context.run(templateCmd);
  
  // Step 4: Save to file
  const saveCmd = new FileCommand('write', './result.txt', messageRef);
  await context.run(saveCmd);

  return outcome;
}
```

## Creating Custom Commands

See **[[Creating Commands]]** for details on building your own `ICommand` implementations to extend the library.

## Summary

**Available Commands:**

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| PowershellCommand | Execute shell commands | Command string | Command output |
| ClaudeCommand | AI processing | Prompt + MemoryRefs | AI response |
| RegexCommand | Pattern matching | Pattern + MemoryRef | Matches or transformed text |
| TemplateCommand | Variable substitution | Template + variables | Interpolated text |
| FileCommand | File operations | Path + optional data | File content or void |
| CurlCommand | HTTP requests | URL + options | Response body |

## Next Steps

- **[[Building Tasks]]** - Use commands in your tasks
- **[[Creating Commands]]** - Build custom commands
- **[[Managing Context]]** - Work with MemoryRef objects
- **[[Workflow API]]** - Deep dive into IWorkflowContext
