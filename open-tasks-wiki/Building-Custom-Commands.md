# Building Custom Commands

This guide explains how to create custom commands using the card/box format for visual output.

## What is a Command?

A **command** is the smallest executable unit in Open Tasks. Commands:
- Perform a single, specific operation
- Accept arguments and context
- Return a ReferenceHandle
- Can create formatted visual output using cards

Unlike tasks (which chain multiple commands), commands are **atomic operations**.

## Command Structure

Commands are stored in `.open-tasks/tasks/` and follow this structure:

```typescript
export default class MyCommand {
  name = 'my-command';
  description = 'What this command does';
  examples = [
    'ot my-command arg1',
    'ot my-command arg1 --token result',
  ];

  async execute(args: string[], context: any): Promise<any> {
    // Command implementation
    
    return {
      id: 'command-result',
      content: 'result data',
      token: 'optional-token',
      timestamp: new Date(),
    };
  }
}
```

## Creating a Command

### Step 1: Scaffold the Command

```bash
ot create validate-email --typescript
```

### Step 2: Implement the Logic

```typescript
export default class ValidateEmailCommand {
  name = 'validate-email';
  description = 'Validate email addresses';
  examples = [
    'ot validate-email user@example.com',
    'ot validate-email --ref emails',
  ];

  async execute(args: string[], context: any): Promise<any> {
    const output = context.outputSynk;
    
    // Get email from args or reference
    const email = args[0];
    
    // Validate
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    // Create result
    const result = `Email "${email}" is ${isValid ? 'valid' : 'invalid'}`;
    
    // Output result
    output.write(result);
    
    return {
      id: 'validation-result',
      content: result,
      timestamp: new Date(),
    };
  }
}
```

## The Box Format (Cards)

The **box format** refers to the visual card system used to display formatted output. Cards are boxed, styled outputs that make information easy to read.

### Card Types

Open Tasks provides several card types:

1. **MessageCard** - Simple text message in a styled box
2. **TableCard** - Tabular data with headers and rows
3. **ListCard** - Bulleted or numbered list
4. **TreeCard** - Hierarchical tree structure
5. **KeyValueCard** - Key-value pairs

### Using MessageCard

The most common card type for simple messages:

```typescript
import { MessageCard } from '@bitcobblers/open-tasks';

// Success message
context.outputSynk.write(
  new MessageCard(
    '✓ Success',
    'Operation completed successfully!',
    'success'
  )
);

// Error message
context.outputSynk.write(
  new MessageCard(
    '✗ Error',
    'Something went wrong',
    'error'
  )
);

// Info message
context.outputSynk.write(
  new MessageCard(
    'ℹ Info',
    'Processing 10 items...',
    'info'
  )
);

// Warning message
context.outputSynk.write(
  new MessageCard(
    '⚠ Warning',
    'This operation cannot be undone',
    'warning'
  )
);
```

**Card Styles:**
- `'success'` - Green border
- `'error'` - Red border
- `'warning'` - Yellow border
- `'info'` - Blue border
- `'dim'` - Gray border
- `'default'` - No color

**Example Output:**
```
╭─ ✓ Success ──────────────────╮
│                              │
│  Operation completed         │
│  successfully!               │
│                              │
╰──────────────────────────────╯
```

### Using TableCard

Display tabular data:

```typescript
import { TableCard } from '@bitcobblers/open-tasks';

context.outputSynk.write(
  new TableCard(
    'Validation Results',
    ['Email', 'Status', 'Score'],
    [
      ['user@example.com', 'Valid', '100'],
      ['invalid-email', 'Invalid', '0'],
      ['test@test.co', 'Valid', '95']
    ],
    'Total: 3 emails checked',
    'info'
  )
);
```

**Example Output:**
```
╭─ Validation Results ─────────────────────╮
│                                          │
│  Email             │ Status  │ Score     │
│  ──────────────────┼─────────┼─────────  │
│  user@example.com  │ Valid   │ 100       │
│  invalid-email     │ Invalid │ 0         │
│  test@test.co      │ Valid   │ 95        │
│                                          │
│  Total: 3 emails checked                 │
│                                          │
╰──────────────────────────────────────────╯
```

### Using ListCard

Display a list of items:

```typescript
import { ListCard } from '@bitcobblers/open-tasks';

context.outputSynk.write(
  new ListCard(
    'Steps Completed',
    [
      'Loaded configuration',
      'Validated input',
      'Processed data',
      'Saved results'
    ],
    'success',
    false // false = bullets, true = numbers
  )
);
```

**Example Output:**
```
╭─ Steps Completed ────────────╮
│                              │
│  • Loaded configuration      │
│  • Validated input           │
│  • Processed data            │
│  • Saved results             │
│                              │
╰──────────────────────────────╯
```

### Using TreeCard

Display hierarchical data:

```typescript
import { TreeCard, TreeNode } from '@bitcobblers/open-tasks';

const tree: TreeNode = {
  label: 'Project',
  icon: '📁',
  children: [
    {
      label: 'src',
      icon: '📁',
      children: [
        { label: 'index.ts', icon: '📄' },
        { label: 'types.ts', icon: '📄' }
      ]
    },
    {
      label: 'tests',
      icon: '📁',
      children: [
        { label: 'index.test.ts', icon: '📄' }
      ]
    }
  ]
};

context.outputSynk.write(
  new TreeCard(
    'File Structure',
    tree,
    'info'
  )
);
```

**Example Output:**
```
╭─ File Structure ─────────────╮
│                              │
│  📁 Project                  │
│    📁 src                    │
│      📄 index.ts             │
│      📄 types.ts             │
│    📁 tests                  │
│      📄 index.test.ts        │
│                              │
╰──────────────────────────────╯
```

### Using KeyValueCard

Display key-value pairs:

```typescript
import { KeyValueCard } from '@bitcobblers/open-tasks';

context.outputSynk.write(
  new KeyValueCard(
    'Configuration',
    {
      'Project': '@bitcobblers/open-tasks',
      'Version': '1.0.0',
      'Node': '18.0.0',
      'Status': 'Active'
    },
    'info'
  )
);
```

**Example Output:**
```
╭─ Configuration ──────────────╮
│                              │
│  Project: open-tasks-cli     │
│  Version: 1.0.0              │
│  Node: 18.0.0                │
│  Status: Active              │
│                              │
╰──────────────────────────────╯
```

## Complete Command Example

Here's a complete command that validates emails and uses multiple card types:

```typescript
import { MessageCard, TableCard, ListCard } from '@bitcobblers/open-tasks';

export default class EmailValidatorCommand {
  name = 'validate-emails';
  description = 'Validate multiple email addresses';
  examples = [
    'ot validate-emails user@test.com admin@example.com',
    'ot validate-emails --ref email-list',
  ];

  async execute(args: string[], context: any): Promise<any> {
    const output = context.outputSynk;
    const flow = context.workflowContext;
    
    // Get emails from args
    const emails = args.filter(arg => !arg.startsWith('--'));
    
    if (emails.length === 0) {
      throw new Error('No emails provided');
    }
    
    // Show what we're doing
    output.write(
      new MessageCard(
        '📧 Email Validator',
        `Validating ${emails.length} email address(es)...`,
        'info'
      )
    );
    
    // Validate each email
    const results = emails.map(email => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const score = isValid ? 100 : 0;
      return {
        email,
        status: isValid ? 'Valid' : 'Invalid',
        score: score.toString()
      };
    });
    
    // Display results in a table
    output.write(
      new TableCard(
        'Validation Results',
        ['Email', 'Status', 'Score'],
        results.map(r => [r.email, r.status, r.score]),
        `Total: ${results.length} emails`,
        'default'
      )
    );
    
    // Show valid emails in a list
    const validEmails = results
      .filter(r => r.status === 'Valid')
      .map(r => r.email);
    
    if (validEmails.length > 0) {
      output.write(
        new ListCard(
          '✓ Valid Emails',
          validEmails,
          'success'
        )
      );
    }
    
    // Show invalid emails in a list
    const invalidEmails = results
      .filter(r => r.status === 'Invalid')
      .map(r => r.email);
    
    if (invalidEmails.length > 0) {
      output.write(
        new ListCard(
          '✗ Invalid Emails',
          invalidEmails,
          'error'
        )
      );
    }
    
    // Store results
    const resultText = results
      .map(r => `${r.email}: ${r.status}`)
      .join('\n');
    
    const resultRef = await flow.set(resultText, []);
    
    return {
      id: resultRef.id,
      content: resultText,
      token: 'validation-results',
      timestamp: new Date(),
    };
  }
}
```

## Handling References

Commands can accept and use references from previous commands:

```typescript
async execute(args: string[], context: any): Promise<any> {
  const flow = context.workflowContext;
  
  // Check for --ref option
  const refIndex = args.indexOf('--ref');
  if (refIndex !== -1) {
    const refToken = args[refIndex + 1];
    
    // Load the referenced data
    // Note: Reference management is handled by the framework
    // In custom commands, you work with the data directly
    const data = args[refIndex + 1]; // Simplified - actual implementation varies
    
    // Use the data
    return processData(data);
  }
  
  // Or use direct arguments
  return processData(args[0]);
}
```

## Best Practices

### 1. Use Appropriate Card Types

- **MessageCard** - Status updates, confirmations, errors
- **TableCard** - Tabular data, comparisons
- **ListCard** - Steps, results, items
- **TreeCard** - Hierarchical structures
- **KeyValueCard** - Configuration, metadata

### 2. Provide Visual Feedback

```typescript
// Good: Clear visual feedback
output.write(
  new MessageCard(
    '✓ Complete',
    'Processed 100 items in 2.5s',
    'success'
  )
);

// Avoid: Plain text
output.write('Done');
```

### 3. Handle Errors Gracefully

```typescript
try {
  // Command logic
} catch (error) {
  output.write(
    new MessageCard(
      '✗ Error',
      `Failed to process: ${error.message}`,
      'error'
    )
  );
  throw error;
}
```

### 4. Show Progress for Long Operations

```typescript
output.write('Loading file...');
const data = await loadLargeFile();

output.write('Processing data...');
const processed = await processData(data);

output.write('Saving results...');
await saveResults(processed);

output.write(
  new MessageCard(
    '✓ Success',
    'All steps completed',
    'success'
  )
);
```

### 5. Include Summary Information

```typescript
output.write(
  new TableCard(
    'Processing Summary',
    ['Metric', 'Value'],
    [
      ['Total Items', '1000'],
      ['Processed', '985'],
      ['Errors', '15'],
      ['Duration', '3.2s']
    ],
    'Processing complete',
    'info'
  )
);
```

## Testing Your Command

After creating a command, test it:

```bash
# Test with direct arguments
ot my-command arg1 arg2

# Test with verbose output
ot my-command arg1 --verbose

# Test with quiet output
ot my-command arg1 --quiet

# Test with token
ot my-command arg1 --token result
```

## Advanced: Custom Card Builders

You can create your own card builders by implementing the `ICardBuilder` interface:

```typescript
import { ICardBuilder, CardStyle } from '@bitcobblers/open-tasks';
import boxen from 'boxen';

export class CustomCard implements ICardBuilder {
  name: string;
  type: string = 'CustomCard';
  
  constructor(
    private title: string,
    private content: string,
    private style: CardStyle = 'default'
  ) {
    this.name = `CustomCard:${title}`;
  }
  
  build(): string {
    // Custom rendering logic
    return boxen(this.content, {
      title: this.title,
      padding: 1,
      borderStyle: 'double',
      borderColor: 'magenta'
    });
  }
}

// Use it
context.outputSynk.write(
  new CustomCard('My Custom Card', 'Custom content here')
);
```

## Next Steps

- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Chain commands into workflows
- **[Example Tasks](./Example-Tasks.md)** - See commands in action
- **[Architecture](./Architecture.md)** - Understand the system design
- **[Developer Guide](./Developer-Guide.md)** - Advanced development patterns

---

**Need help?** Check the [Commands](./Commands.md) reference for examples of built-in commands.
