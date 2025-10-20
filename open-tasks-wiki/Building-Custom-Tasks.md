# Building Custom Tasks

Custom tasks let you chain multiple commands together into reusable workflows. This guide shows you how to organize commands and pass outputs as inputs between them.

## What is a Task?

A **task** is a JavaScript or TypeScript file that:
1. Executes multiple commands in sequence
2. Passes outputs from one command as inputs to another
3. Manages the workflow context
4. Can accept arguments and options

Think of tasks as **composable workflows** - small building blocks that combine to solve complex problems.

## Task Structure

Tasks are stored in `.open-tasks/tasks/` and must:
- Export a default class
- Implement the `execute()` method
- Return a `ReferenceHandle`

### Basic Task Template

```typescript
export default class MyTask {
  name = 'my-task';
  description = 'Description of what this task does';
  examples = [
    'ot my-task',
    'ot my-task arg1 arg2 --token result',
  ];

  async execute(args: string[], context: any): Promise<any> {
    // Task implementation here
    return result;
  }
}
```

## Creating Your First Task

### Step 1: Scaffold the Task

```bash
ot create code-review-task --typescript
```

This creates `.open-tasks/tasks/code-review-task.ts` with a template.

### Step 2: Implement the Workflow

Edit the generated file to chain commands:

```typescript
export default class CodeReviewTask {
  name = 'code-review-task';
  description = 'Review code files with AI';
  examples = [
    'ot code-review-task ./src/api.ts',
    'ot code-review-task ./src/api.ts --verbose',
  ];

  async execute(args: string[], context: any): Promise<any> {
    const filePath = args[0];
    if (!filePath) {
      throw new Error('File path required');
    }

    // Use the workflow context to chain operations
    const flow = context.workflowContext;
    
    // Step 1: Load the file
    context.outputSynk.write('Loading source file...');
    const loadCommand = { /* load command implementation */ };
    const [fileRef] = await flow.run(loadCommand);
    
    // Step 2: Extract functions
    context.outputSynk.write('Extracting functions...');
    const extractCommand = { /* extract command implementation */ };
    const [functionsRef] = await flow.run(extractCommand);
    
    // Step 3: Send to AI for review
    context.outputSynk.write('Requesting AI review...');
    const aiCommand = { /* ai-cli command implementation */ };
    const [reviewRef] = await flow.run(aiCommand);
    
    return {
      id: 'code-review-result',
      content: 'Review completed',
      token: 'review',
      timestamp: new Date(),
    };
  }
}
```

### Step 3: Run Your Task

```bash
ot code-review-task ./src/api.ts
```

## Passing Outputs as Inputs

The key to building workflows is passing the output of one command as the input to the next.

### Using References

```typescript
async execute(args: string[], context: any): Promise<any> {
  const flow = context.workflowContext;
  
  // Store initial data
  const data = await flow.set("Hello World", []);
  
  // Use that data in another command
  const transformed = await flow.get(data);
  
  // Transform and store again
  const result = await flow.set(transformed.toUpperCase(), []);
  
  return {
    id: result.id,
    content: await flow.get(result),
    timestamp: new Date(),
  };
}
```

### Chaining Commands

Commands can be chained by running them in sequence and passing references:

```typescript
async execute(args: string[], context: any): Promise<any> {
  const flow = context.workflowContext;
  const output = context.outputSynk;
  
  // Command 1: Load file
  output.write('Step 1: Loading file...');
  const fileContent = await flow.set(
    await readFile(args[0], 'utf-8'),
    []
  );
  
  // Command 2: Extract data using regex
  output.write('Step 2: Extracting emails...');
  const content = await flow.get(fileContent);
  const emailPattern = /[a-z]+@[a-z.]+/g;
  const emails = content.match(emailPattern) || [];
  const emailsRef = await flow.set(emails.join('\n'), []);
  
  // Command 3: Format results
  output.write('Step 3: Formatting results...');
  const emailList = await flow.get(emailsRef);
  const formatted = `Found ${emails.length} emails:\n${emailList}`;
  const result = await flow.set(formatted, []);
  
  return {
    id: result.id,
    content: formatted,
    token: 'emails',
    timestamp: new Date(),
  };
}
```

## Using Decorators

Decorators modify references before they're stored. Common decorators:

- `TokenDecorator` - Assign a named token
- `FileNameDecorator` - Set custom filename
- `TimestampedFileNameDecorator` - Add timestamp to filename
- `MetadataDecorator` - Add custom metadata

### Example with Decorators

```typescript
import { TokenDecorator, FileNameDecorator } from '@bitcobblers/open-tasks';

async execute(args: string[], context: any): Promise<any> {
  const flow = context.workflowContext;
  
  // Store with decorators
  const result = await flow.set(
    "Important data",
    [
      new TokenDecorator("important"),
      new FileNameDecorator("important-data.txt")
    ]
  );
  
  // The file will be saved as "important-data.txt"
  // and can be referenced by token "important"
  
  return {
    id: result.id,
    content: "Important data",
    token: "important",
    timestamp: new Date(),
  };
}
```

## Using the Output Builder

The output builder (`context.outputSynk`) creates formatted, visual output.

### Simple Messages

```typescript
context.outputSynk.write('Processing data...');
context.outputSynk.write('Complete!');
```

### Message Cards

```typescript
import { MessageCard } from '@bitcobblers/open-tasks';

context.outputSynk.write(
  new MessageCard(
    '✓ Success',
    'Task completed successfully',
    'success'
  )
);
```

### Table Cards

```typescript
import { TableCard } from '@bitcobblers/open-tasks';

context.outputSynk.write(
  new TableCard(
    'Results',
    ['Name', 'Count', 'Status'],
    [
      ['Item 1', '42', 'Active'],
      ['Item 2', '17', 'Pending'],
      ['Item 3', '8', 'Complete']
    ],
    'Total: 3 items',
    'info'
  )
);
```

### List Cards

```typescript
import { ListCard } from '@bitcobblers/open-tasks';

context.outputSynk.write(
  new ListCard(
    'Tasks Completed',
    [
      'Loaded source file',
      'Extracted functions',
      'Generated documentation',
      'Saved results'
    ],
    'success'
  )
);
```

## Accepting Arguments and Options

Tasks can accept command-line arguments and parse options.

### Basic Arguments

```typescript
async execute(args: string[], context: any): Promise<any> {
  const input = args[0]; // First argument
  const option = args[1]; // Second argument
  
  if (!input) {
    throw new Error('Input required');
  }
  
  // Use the arguments in your workflow
  const result = await processInput(input, option);
  
  return {
    id: 'result',
    content: result,
    timestamp: new Date(),
  };
}
```

### Parsing Options

```typescript
async execute(args: string[], context: any): Promise<any> {
  // Find token option
  const tokenIndex = args.indexOf('--token');
  const token = tokenIndex !== -1 ? args[tokenIndex + 1] : undefined;
  
  // Find verbose flag
  const verbose = args.includes('--verbose');
  
  // Filter out options to get positional args
  const positionalArgs = args.filter(arg => !arg.startsWith('--'));
  
  // Use in workflow
  if (verbose) {
    context.outputSynk.write('Running in verbose mode...');
  }
  
  return {
    id: 'result',
    content: 'Done',
    token: token,
    timestamp: new Date(),
  };
}
```

## Real-World Task Examples

### Multi-File Code Review

```typescript
export default class MultiFileReviewTask {
  name = 'multi-review';
  description = 'Review multiple related files together';
  examples = [
    'ot multi-review ./src/api.ts ./src/types.ts',
  ];

  async execute(args: string[], context: any): Promise<any> {
    const flow = context.workflowContext;
    const output = context.outputSynk;
    
    if (args.length < 2) {
      throw new Error('At least 2 files required');
    }
    
    const fileRefs = [];
    
    // Load all files
    output.write(`Loading ${args.length} files...`);
    for (const filePath of args) {
      const content = await readFile(filePath, 'utf-8');
      const ref = await flow.set(content, []);
      fileRefs.push(ref);
    }
    
    // Combine all content for AI
    const allContent = await Promise.all(
      fileRefs.map(ref => flow.get(ref))
    );
    const combined = allContent.join('\n\n--- FILE SEPARATOR ---\n\n');
    const combinedRef = await flow.set(combined, []);
    
    output.write('Sending to AI for review...');
    // AI review logic here
    
    return {
      id: 'review-result',
      content: 'Review complete',
      timestamp: new Date(),
    };
  }
}
```

### Data Pipeline Task

```typescript
export default class DataPipelineTask {
  name = 'data-pipeline';
  description = 'Load, transform, and save data';
  examples = [
    'ot data-pipeline ./input.csv',
  ];

  async execute(args: string[], context: any): Promise<any> {
    const flow = context.workflowContext;
    const output = context.outputSynk;
    
    // Step 1: Load
    output.write('Loading data...');
    const rawData = await readFile(args[0], 'utf-8');
    const dataRef = await flow.set(rawData, []);
    
    // Step 2: Parse
    output.write('Parsing CSV...');
    const data = await flow.get(dataRef);
    const rows = data.split('\n').map(row => row.split(','));
    
    // Step 3: Transform
    output.write('Transforming data...');
    const transformed = rows.map(row => ({
      name: row[0],
      email: row[1],
      status: row[2]
    }));
    
    // Step 4: Save
    output.write('Saving results...');
    const result = await flow.set(
      JSON.stringify(transformed, null, 2),
      [new FileNameDecorator('output.json')]
    );
    
    return {
      id: result.id,
      content: `Processed ${transformed.length} records`,
      timestamp: new Date(),
    };
  }
}
```

## Error Handling

Always handle errors gracefully in your tasks:

```typescript
async execute(args: string[], context: any): Promise<any> {
  const flow = context.workflowContext;
  const output = context.outputSynk;
  
  try {
    output.write('Starting task...');
    
    // Your workflow here
    const result = await doSomething();
    
    output.write(new MessageCard('Success', 'Task completed', 'success'));
    
    return {
      id: 'result',
      content: result,
      timestamp: new Date(),
    };
  } catch (error) {
    output.write(
      new MessageCard(
        'Error',
        `Task failed: ${error.message}`,
        'error'
      )
    );
    
    throw error; // Re-throw for framework to handle
  }
}
```

## Best Practices

1. **Break Down Complex Workflows** - Create smaller, focused tasks that can be combined
2. **Use Descriptive Names** - Task names should clearly indicate their purpose
3. **Provide Examples** - Help users understand how to use your task
4. **Handle Errors** - Validate inputs and provide helpful error messages
5. **Use Output Builder** - Create visual, informative output for users
6. **Document Arguments** - Clearly document what arguments and options are supported
7. **Keep Tasks Focused** - Each task should do one thing well
8. **Test Incrementally** - Test each step of your workflow separately

## Next Steps

- **[Building Custom Commands](./Building-Custom-Commands.md)** - Learn about the box format and creating custom commands
- **[Commands](./Commands.md)** - Reference all available built-in commands
- **[Example Tasks](./Example-Tasks.md)** - See more workflow examples
- **[Architecture](./Architecture.md)** - Understand the underlying system

---

**Need help?** Check the [Developer Guide](./Developer-Guide.md) for more advanced patterns and troubleshooting tips.
