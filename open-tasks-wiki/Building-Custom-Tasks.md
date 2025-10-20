# Building Custom Tasks

Learn how to create powerful custom tasks by chaining commands together and passing outputs between them.

## Overview

Custom tasks in Open Tasks are **workflow orchestrators** that:

1. **Chain commands** - Execute multiple commands in sequence
2. **Pass data** - Use outputs from one command as inputs to another
3. **Build context** - Gather data from multiple sources
4. **Transform data** - Process and manipulate information
5. **Generate outputs** - Create useful results

Tasks are JavaScript/TypeScript files that implement the `ITaskHandler` interface.

---

## Task Structure

### Basic Task Template

```javascript
export default class MyCustomCommand {
  // Required: Task name (used in CLI)
  name = 'my-custom';
  
  // Required: Short description
  description = 'My custom task description';
  
  // Optional: Usage examples
  examples = [
    'ot my-custom',
    'ot my-custom --option value',
  ];

  // Required: Execute method
  async execute(args, context) {
    const flow = context.workflowContext;
    
    // Your workflow logic here
    
    return {
      id: 'result-id',
      content: 'result content',
      token: 'result-token',
      timestamp: new Date()
    };
  }
}
```

### Context Object

The `context` parameter provides:

```typescript
interface ExecutionContext {
  // Current working directory
  cwd: string;
  
  // Workflow execution context
  workflowContext: IFlow;
  
  // Output sink for progress messages
  outputSynk: IOutputSynk;
  
  // Verbosity level ('quiet' | 'summary' | 'verbose')
  verbosity: string;
  
  // Project configuration
  config: Record<string, any>;
}
```

---

## Command Chaining Patterns

### Pattern 1: Linear Chain

Execute commands in sequence, each using the previous result.

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  // Step 1: Load data
  const dataRef = await flow.run(new ReadCommand('data.txt'));
  
  // Step 2: Transform data
  const upperRef = await flow.run(
    new TextTransformCommand(dataRef[0], s => s.toUpperCase())
  );
  
  // Step 3: Save result
  await flow.run(new WriteCommand('output.txt', upperRef[0]));
  
  return {
    id: upperRef[0].id,
    content: await flow.get(upperRef[0]),
    timestamp: new Date()
  };
}
```

### Pattern 2: Parallel Gathering

Load multiple resources independently, then combine.

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  // Load multiple files in parallel (Note: run() is sequential,
  // but you can gather refs and process them together)
  const file1Ref = await flow.run(new ReadCommand('file1.txt'));
  const file2Ref = await flow.run(new ReadCommand('file2.txt'));
  const file3Ref = await flow.run(new ReadCommand('file3.txt'));
  
  // Combine results
  const combinedRef = await flow.run(
    new JoinCommand([file1Ref[0], '\n---\n', file2Ref[0], '\n---\n', file3Ref[0]])
  );
  
  return {
    id: combinedRef[0].id,
    content: await flow.get(combinedRef[0]),
    timestamp: new Date()
  };
}
```

### Pattern 3: Conditional Branching

Execute different workflows based on conditions.

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  const fileType = args[0];
  
  let result;
  
  if (fileType === 'json') {
    // JSON processing workflow
    const dataRef = await flow.run(new ReadCommand('data.json'));
    result = await flow.run(
      new JsonTransformCommand(dataRef[0], obj => obj.summary)
    );
  } else if (fileType === 'text') {
    // Text processing workflow
    const dataRef = await flow.run(new ReadCommand('data.txt'));
    result = await flow.run(
      new TextTransformCommand(dataRef[0], s => s.trim())
    );
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
  
  return {
    id: result[0].id,
    content: await flow.get(result[0]),
    timestamp: new Date()
  };
}
```

### Pattern 4: Loop Processing

Process multiple items with the same workflow.

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  const files = args; // Array of file paths
  
  const results = [];
  
  for (const file of files) {
    // Process each file
    const contentRef = await flow.run(new ReadCommand(file));
    const processedRef = await flow.run(
      new TextTransformCommand(contentRef[0], s => s.toUpperCase())
    );
    
    const content = await flow.get(processedRef[0]);
    results.push(`File: ${file}\n${content}\n`);
  }
  
  // Combine all results
  const finalRef = await flow.run(
    new SetCommand(results.join('\n---\n'))
  );
  
  return {
    id: finalRef[0].id,
    content: await flow.get(finalRef[0]),
    timestamp: new Date()
  };
}
```

---

## Passing Outputs as Inputs

### Using References

Commands return references that can be passed to other commands:

```javascript
// Store a value
const ref1 = await flow.run(new SetCommand('Hello'));

// Use the reference as input to another command
const ref2 = await flow.run(
  new TextTransformCommand(ref1[0], s => s.toUpperCase())
);

// Get the actual value
const value = await flow.get(ref2[0]);
console.log(value); // "HELLO"
```

### Using Tokens

Name important values with tokens for easy reference:

```javascript
// Store with token
const userRef = await flow.run(new SetCommand('Alice', 'username'));
const emailRef = await flow.run(new SetCommand('alice@example.com', 'email'));

// Use in templates (token-based lookup)
const templateRef = await flow.run(
  new SetCommand('Hello {{username}}, your email is {{email}}')
);

const result = await flow.run(new TemplateCommand(templateRef[0]));
// Result: "Hello Alice, your email is alice@example.com"
```

### Combining Multiple Outputs

```javascript
// Gather multiple pieces of data
const header = await flow.run(new SetCommand('# Report'));
const body = await flow.run(new ReadCommand('content.md'));
const footer = await flow.run(new SetCommand('\n---\nGenerated: ' + new Date()));

// Combine them
const report = await flow.run(
  new JoinCommand([header[0], '\n\n', body[0], '\n', footer[0]])
);
```

---

## Handling Arguments

### Basic Arguments

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  // Get positional arguments
  const inputFile = args[0] || 'default.txt';
  const outputFile = args[1] || 'output.txt';
  
  const contentRef = await flow.run(new ReadCommand(inputFile));
  await flow.run(new WriteCommand(outputFile, contentRef[0]));
  
  return { /* ... */ };
}
```

Usage:
```bash
ot my-task input.txt output.txt
```

### Named Options

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  // Parse options
  const formatIndex = args.indexOf('--format');
  const format = formatIndex !== -1 && args[formatIndex + 1]
    ? args[formatIndex + 1]
    : 'text';
  
  const verbose = args.includes('--verbose');
  
  if (verbose) {
    context.outputSynk.write(`Using format: ${format}`);
  }
  
  // Use options in workflow...
  
  return { /* ... */ };
}
```

Usage:
```bash
ot my-task --format json --verbose
```

### Combining Positional and Named

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  // Get positional args (before any flags)
  const positionalArgs = args.filter(arg => !arg.startsWith('--'));
  const inputFile = positionalArgs[0] || 'input.txt';
  
  // Get named options
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex !== -1 && args[outputIndex + 1]
    ? args[outputIndex + 1]
    : 'output.txt';
  
  const contentRef = await flow.run(new ReadCommand(inputFile));
  await flow.run(new WriteCommand(outputFile, contentRef[0]));
  
  return { /* ... */ };
}
```

Usage:
```bash
ot my-task input.txt --output result.txt
```

---

## Progress Reporting

### Using outputSynk

Report progress to the user:

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  context.outputSynk.write('Step 1: Loading data...');
  const dataRef = await flow.run(new ReadCommand('data.json'));
  
  context.outputSynk.write('Step 2: Parsing JSON...');
  const parsedRef = await flow.run(
    new JsonTransformCommand(dataRef[0], obj => obj)
  );
  
  context.outputSynk.write('Step 3: Generating report...');
  // ... more steps ...
  
  context.outputSynk.write('Complete!');
  
  return { /* ... */ };
}
```

### Respecting Verbosity

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  const verbose = context.verbosity === 'verbose';
  
  if (verbose) {
    context.outputSynk.write('Detailed progress information...');
  }
  
  // Always show important messages
  context.outputSynk.write('Processing complete');
  
  return { /* ... */ };
}
```

---

## Error Handling

### Basic Error Handling

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  try {
    const dataRef = await flow.run(new ReadCommand('data.txt'));
    return {
      id: dataRef[0].id,
      content: await flow.get(dataRef[0]),
      timestamp: new Date()
    };
  } catch (error) {
    throw new Error(`Failed to process data: ${error.message}`);
  }
}
```

### Validation

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  // Validate arguments
  if (args.length === 0) {
    throw new Error('Missing required argument: file path');
  }
  
  const filePath = args[0];
  
  // Validate file extension
  if (!filePath.endsWith('.json')) {
    throw new Error('File must be a JSON file');
  }
  
  // Continue with workflow...
  const dataRef = await flow.run(new ReadCommand(filePath));
  
  return { /* ... */ };
}
```

### Graceful Degradation

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  let dataRef;
  
  try {
    // Try primary source
    dataRef = await flow.run(new ReadCommand('primary.txt'));
  } catch (error) {
    context.outputSynk.write('Primary source failed, using fallback...');
    // Fallback to default
    dataRef = await flow.run(new SetCommand('Default content'));
  }
  
  return {
    id: dataRef[0].id,
    content: await flow.get(dataRef[0]),
    timestamp: new Date()
  };
}
```

---

## Complete Example: Multi-File Processor

Here's a complete task that demonstrates advanced patterns:

```javascript
import { ReadCommand } from '../src/commands/read.js';
import { SetCommand } from '../src/commands/set.js';
import { JsonTransformCommand } from '../src/commands/json-transform.js';
import { TemplateCommand } from '../src/commands/template.js';
import { WriteCommand } from '../src/commands/write.js';
import { JoinCommand } from '../src/commands/join.js';

export default class MultiFileProcessorCommand {
  name = 'multi-file-processor';
  description = 'Process multiple files and generate a report';
  examples = [
    'ot multi-file-processor file1.json file2.json file3.json',
    'ot multi-file-processor *.json --output report.md',
  ];

  async execute(args, context) {
    const flow = context.workflowContext;
    
    // Parse arguments
    const outputIndex = args.indexOf('--output');
    const outputFile = outputIndex !== -1 && args[outputIndex + 1]
      ? args[outputIndex + 1]
      : 'report.md';
    
    const files = args.filter(arg => !arg.startsWith('--') && arg !== args[outputIndex + 1]);
    
    if (files.length === 0) {
      throw new Error('No input files specified');
    }
    
    context.outputSynk.write(`Processing ${files.length} file(s)...`);
    
    // Process each file
    const summaries = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      context.outputSynk.write(`Processing ${i + 1}/${files.length}: ${file}`);
      
      try {
        // Read file
        const contentRef = await flow.run(new ReadCommand(file));
        
        // Parse JSON
        const dataRef = await flow.run(
          new JsonTransformCommand(contentRef[0], obj => obj)
        );
        
        const data = JSON.parse(await flow.get(dataRef[0]));
        
        // Store data fields as tokens
        await flow.run(new SetCommand(file, 'filename'));
        await flow.run(new SetCommand(data.title || 'Untitled', 'title'));
        await flow.run(new SetCommand(data.description || 'No description', 'description'));
        
        // Create summary using template
        const templateRef = await flow.run(new SetCommand(
          `### {{filename}}\n\n**{{title}}**\n\n{{description}}\n`
        ));
        
        const summaryRef = await flow.run(new TemplateCommand(templateRef[0]));
        summaries.push(await flow.get(summaryRef[0]));
        
      } catch (error) {
        context.outputSynk.write(`Warning: Failed to process ${file}: ${error.message}`);
        summaries.push(`### ${file}\n\n**Error:** ${error.message}\n`);
      }
    }
    
    // Build final report
    context.outputSynk.write('Generating final report...');
    
    const header = `# Multi-File Processing Report\n\n` +
                  `Generated: ${new Date().toLocaleString()}\n` +
                  `Files Processed: ${files.length}\n\n---\n\n`;
    
    const reportContent = header + summaries.join('\n---\n\n');
    const reportRef = await flow.run(new SetCommand(reportContent));
    
    // Save report
    await flow.run(new WriteCommand(outputFile, reportRef[0]));
    
    context.outputSynk.write(`Report saved to: ${outputFile}`);
    
    return {
      id: reportRef[0].id,
      content: reportContent,
      token: 'report-result',
      timestamp: new Date(),
      outputFile: `${context.workflowContext.outputDir}/${outputFile}`
    };
  }
}
```

---

## Best Practices

### 1. Keep Tasks Focused

```javascript
// Good: Single, clear purpose
class CodeReviewCommand {
  name = 'code-review';
  description = 'Review code with AI';
}

// Avoid: Multiple unrelated operations
class DoEverythingCommand {
  name = 'do-everything';
  description = 'Review, test, deploy, and make coffee';
}
```

### 2. Use Meaningful Names

```javascript
// Good: Clear, descriptive names
const userDataRef = await flow.run(new ReadCommand('users.json'));
const validatedRef = await flow.run(new ValidateCommand(userDataRef[0]));

// Avoid: Generic names
const ref1 = await flow.run(new ReadCommand('users.json'));
const ref2 = await flow.run(new ValidateCommand(ref1[0]));
```

### 3. Provide Good Examples

```javascript
export default class MyCommand {
  examples = [
    'ot my-command input.txt',           // Basic usage
    'ot my-command input.txt --verbose', // With options
    'ot my-command *.json --output report.md', // Advanced usage
  ];
}
```

### 4. Handle Errors Gracefully

```javascript
async execute(args, context) {
  try {
    // Workflow logic
  } catch (error) {
    // Add context to errors
    throw new Error(`Failed to process ${args[0]}: ${error.message}`);
  }
}
```

### 5. Document Your Workflow

```javascript
async execute(args, context) {
  const flow = context.workflowContext;
  
  // Step 1: Load configuration
  context.outputSynk.write('Step 1: Loading configuration...');
  const configRef = await flow.run(new ReadCommand('.config.json'));
  
  // Step 2: Parse and validate
  context.outputSynk.write('Step 2: Validating configuration...');
  // ...
  
  // Each step is clearly documented
}
```

---

## Next Steps

- **[Building Custom Commands](./Building-Custom-Commands.md)** - Create reusable commands
- **[Example Tasks](./Example-Tasks.md)** - See real-world examples
- **[Core Commands](./Core-Commands.md)** - Learn about available commands

## See Also

- **[Architecture](./Architecture.md)** - System design overview
- **[Core Tasks](./Core-Tasks.md)** - Built-in tasks
- **[Core Agents Command Builder](./Core-Agents-Command-Builder.md)** - AI agent configuration
