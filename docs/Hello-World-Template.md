# Hello World Template - New Command Demo

## Overview

When you run `open-tasks create hello-world --typescript`, the generated template now creates a **working Hello World demo** instead of an empty TODO template.

## What It Does

The generated command:
1. ✅ Accepts a name argument (defaults to "World")
2. ✅ Creates a greeting template with a placeholder
3. ✅ Replaces `{{name}}` with the actual name
4. ✅ Displays a beautiful visual card showing the process
5. ✅ Returns the greeting as a reference

## Generated Template (TypeScript)

```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle, ICardBuilder } from 'open-tasks-cli';

/**
 * Hello World demo command
 * 
 * This is a demo command that shows how to:
 * - Accept command arguments
 * - Use the card builder to create visual output
 * - Store and return results
 */
export default class HelloWorldCommand extends CommandHandler {
  name = 'hello-world';
  description = 'Hello World demo command';
  examples = [
    'open-tasks hello-world',
    'open-tasks hello-world "Alice"',
    'open-tasks hello-world "Bob" --token greeting',
  ];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    cardBuilder: ICardBuilder
  ): Promise<ReferenceHandle> {
    // Get the name from arguments (default to "World")
    const userName = args[0] || 'World';
    
    cardBuilder.addProgress('Creating greeting...');
    
    // Create the hello world template
    const template = 'Hello, {{name}}! Welcome to open-tasks CLI.';
    
    cardBuilder.addProgress('Replacing name placeholder...');
    
    // Replace the placeholder with the actual name
    const greeting = template.replace('{{name}}', userName);
    
    cardBuilder.addProgress('Building result...');
    
    // Store the result
    const token = args.find((arg, i) => args[i - 1] === '--token');
    const ref = context.referenceManager.createReference(
      'hello-world-result',
      greeting,
      token || 'hello-world'
    );
    
    // Create a visual card showing what we did
    const details: Record<string, string> = {
      'Template': template,
      'User Name': userName,
      'Result': greeting,
      'Token': token || 'none',
    };
    
    cardBuilder.addCard('👋 Hello World Demo', details, 'success');
    
    return ref;
  }
}
```

## Usage Examples

### Default Usage (No Arguments)
```bash
open-tasks hello-world
```

**Output:**
```
╭ 👋 Hello World Demo ───────────────────────────────────────────╮
│                                                                │
│   Template: Hello, {{name}}! Welcome to open-tasks CLI.       │
│   User Name: World                                             │
│   Result: Hello, World! Welcome to open-tasks CLI.             │
│   Token: none                                                  │
│   ──────────────────────────────────────────────────────────   │
│   ✓ hello-world completed in 3ms                               │
│   Token:                                                       │
│   - hello-world | ID: hello-world-result | Time: 2025-...      │
│                                                                │
╰────────────────────────────────────────────────────────────────╯
```

### With Custom Name
```bash
open-tasks hello-world "Alice"
```

**Output:**
```
╭ 👋 Hello World Demo ───────────────────────────────────────────╮
│                                                                │
│   Template: Hello, {{name}}! Welcome to open-tasks CLI.       │
│   User Name: Alice                                             │
│   Result: Hello, Alice! Welcome to open-tasks CLI.             │
│   Token: none                                                  │
│   ──────────────────────────────────────────────────────────   │
│   ✓ hello-world completed in 3ms                               │
│   Token:                                                       │
│   - hello-world | ID: hello-world-result | Time: 2025-...      │
│                                                                │
╰────────────────────────────────────────────────────────────────╯
```

### With Token (For Chaining)
```bash
open-tasks hello-world "Bob" --token greeting
```

**Output:**
```
╭ 👋 Hello World Demo ───────────────────────────────────────────╮
│                                                                │
│   Template: Hello, {{name}}! Welcome to open-tasks CLI.       │
│   User Name: Bob                                               │
│   Result: Hello, Bob! Welcome to open-tasks CLI.               │
│   Token: greeting                                              │
│   ──────────────────────────────────────────────────────────   │
│   ✓ hello-world completed in 3ms                               │
│   Token:                                                       │
│   - greeting | ID: hello-world-result | Time: 2025-...         │
│                                                                │
╰────────────────────────────────────────────────────────────────╯
```

### Verbose Mode
```bash
open-tasks hello-world "Charlie" --verbose
```

**Output:**
```
[0ms] ⏳ Creating greeting...
[1ms] ⏳ Replacing name placeholder...
[2ms] ⏳ Building result...

╭ 👋 Hello World Demo ───────────────────────────────────────────╮
│                                                                │
│   Template: Hello, {{name}}! Welcome to open-tasks CLI.       │
│   User Name: Charlie                                           │
│   Result: Hello, Charlie! Welcome to open-tasks CLI.           │
│   Token: none                                                  │
│   ──────────────────────────────────────────────────────────   │
│   ✓ hello-world completed in 3ms                               │
│   Token:                                                       │
│   - hello-world | ID: hello-world-result | Time: 2025-...      │
│                                                                │
╰────────────────────────────────────────────────────────────────╯
```

## What Developers Learn

From this template, new users learn:

1. **Command Structure**
   - How to extend `CommandHandler`
   - Using `executeCommand()` with the new signature
   - Importing types from `open-tasks-cli`

2. **Argument Handling**
   - Accessing command arguments via `args[]`
   - Providing default values
   - Finding flags like `--token`

3. **Card Builder Usage**
   - Adding progress messages with `cardBuilder.addProgress()`
   - Creating visual cards with `cardBuilder.addCard()`
   - Using card styles (`'success'` in this case)

4. **Reference Management**
   - Creating references with `context.referenceManager.createReference()`
   - Using tokens for chainable workflows
   - Returning references from commands

5. **String Template Pattern**
   - Using placeholders like `{{name}}`
   - Simple string replacement
   - Building dynamic content

## Benefits Over Old Template

### Old Template (Empty TODO)
- ❌ No working code
- ❌ Just comments and placeholders
- ❌ Users had to figure out everything
- ❌ No card builder example
- ❌ Used old `execute()` signature

### New Template (Working Demo)
- ✅ Fully functional out of the box
- ✅ Demonstrates core concepts
- ✅ Shows card builder in action
- ✅ Includes progress messages
- ✅ Uses new `executeCommand()` signature
- ✅ Demonstrates argument handling
- ✅ Shows template replacement pattern
- ✅ Ready to customize and extend

## Next Steps for Users

After running the generated command, users can:

1. **Modify the template** - Change the greeting format
2. **Add more arguments** - Accept multiple inputs
3. **Chain with other commands** - Use the `--token` parameter
4. **Customize the card** - Add more details or change the style
5. **Extend functionality** - Add validation, formatting, etc.

This provides a much better learning experience than an empty template!
