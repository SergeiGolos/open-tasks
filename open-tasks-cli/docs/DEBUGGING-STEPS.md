# VS Code Debugging Setup for Open-Tasks CLI

This guide provides step-by-step instructions for setting up and using VS Code debugging with the Open-Tasks CLI project.

## Quick Start

### 1. Initial Setup

```bash
# Navigate to project root
cd open-tasks

# Install dependencies
cd open-tasks-cli
npm install

# Install debugging dependencies
npm install --save-dev ts-node @types/node

# Build the project


# Return to project root
cd ..
```

### 2. Open in VS Code

```bash
# Open project in VS Code
code .
```

### 3. Start Debugging

1. **Open Debug View**: `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
2. **Select Configuration**: Choose "Debug CLI" from the dropdown
3. **Set Breakpoints**: Open `src/index.ts` and click in the gutter next to line 140
4. **Start Debugging**: Press `F5` or click the green play button

## Debugging Configurations

### Available Debug Configurations

The `.vscode/launch.json` file includes several pre-configured debugging scenarios:

#### 1. Debug CLI
- **Purpose**: Debug basic CLI functionality
- **Command**: `store test data --token debug`
- **Entry Point**: `src/index.ts:140`
- **Use Case**: Testing core command execution

#### 2. Debug Init Command
- **Purpose**: Debug project initialization
- **Command**: `init`
- **Entry Point**: `src/commands/init.ts`
- **Use Case**: Testing project setup workflow

#### 3. Debug Create Command
- **Purpose**: Debug command scaffolding
- **Command**: `create my-custom-command`
- **Entry Point**: `src/commands/create.ts`
- **Use Case**: Testing command template generation

#### 4. Debug Store Command with Reference
- **Purpose**: Debug data storage and reference creation
- **Command**: `store "Hello World" --token greeting`
- **Entry Point**: `src/commands/store.ts`
- **Use Case**: Testing reference system

#### 5. Debug Load Command with Reference
- **Purpose**: Debug data retrieval using references
- **Command**: `load --ref greeting`
- **Entry Point**: `src/commands/load.ts`
- **Use Case**: Testing reference lookup

#### 6. Debug Replace Command
- **Purpose**: Debug string replacement functionality
- **Command**: `replace "template: {value}" --value replaced --token result`
- **Entry Point**: `src/commands/replace.ts`
- **Use Case**: Testing template processing

#### 7. Debug Custom Command
- **Purpose**: Debug custom command development
- **Command**: `my-custom-command --input test value`
- **Entry Point**: `.open-tasks/commands/my-custom-command.js`
- **Use Case**: Testing custom command implementations

#### 8. Debug Workflow Context
- **Purpose**: Debug workflow processing and data flow
- **Command**: `store '{"key": "value"}' --token workflow-test`
- **Entry Point**: `src/workflow/directory-output-context.ts`
- **Use Case**: Testing workflow API

#### 9. Debug Error Handling
- **Purpose**: Debug error handling and logging
- **Command**: `store "" --invalid-flag`
- **Entry Point**: Error handling blocks
- **Use Case**: Testing error scenarios

#### 10. Debug Tests
- **Purpose**: Debug unit tests
- **Targets**: `workflow.test.ts`, `router.test.ts`, all tests
- **Entry Point**: Test files
- **Use Case**: Test development and debugging

## Step-by-Step Debugging Tutorial

### Scenario 1: Debugging Command Execution

1. **Set Up Breakpoints**
   ```typescript
   // Open src/index.ts
   // Set breakpoint at line 140 (command execution)
   const result = await router.execute(commandName, cleanArgs, refs, context);

   // Open src/router.ts
   // Set breakpoint at line 45 (command routing)
   const handler = this.commands.get(commandName);
   ```

2. **Launch Debugger**
   - Select "Debug CLI" configuration
   - Press `F5` to start debugging

3. **Step Through Execution**
   - Use `F10` (Step Over) to move line by line
   - Use `F11` (Step Into) to dive into functions
   - Use `Shift+F11` (Step Out) to exit current function

4. **Inspect Variables**
   - Hover over variables to see their values
   - Use the Debug panel to inspect:
     - `commandName`: The command being executed
     - `cleanArgs`: Processed arguments
     - `refs`: Available references
     - `context`: Full execution context

### Scenario 2: Debugging Reference System

1. **Execute Store Command**
   ```bash
   # First, store some data
   node open-tasks-cli/dist/index.js store "Hello World" --token greeting
   ```

2. **Debug Load Command**
   - Select "Debug Load Command with Reference" configuration
   - Set breakpoint in `src/commands/load.ts`
   - Start debugging

3. **Inspect Reference Flow**
   ```typescript
   // In the command handler, inspect:
   console.log('Available refs:', refs);
   console.log('Reference content:', refs.get('greeting')?.content);
   ```

### Scenario 3: Debugging Custom Commands

1. **Create Custom Command**
   ```bash
   cd test-workspace
   node ../open-tasks-cli/dist/index.js create my-test-command
   ```

2. **Edit Custom Command**
   ```javascript
   // Edit .open-tasks/commands/my-test-command.js
   // Add debugging code
   async execute(args, refs, context) {
     console.log('Debug: args =', args);
     console.log('Debug: refs =', refs);
     console.log('Debug: context =', context);

     // Your command logic here
   }
   ```

3. **Debug Custom Command**
   - Select "Debug Custom Command" configuration
   - Set breakpoints in your custom command
   - Start debugging

### Scenario 4: Debugging Workflow Context

1. **Enable Debug Logging**
   ```typescript
   // Set environment variable
   process.env.DEBUG_WORKFLOW = 'true';

   // In workflow context, add debug logs
   console.log('Workflow store:', { id, content, options });
   console.log('Workflow files:', await this.list());
   ```

2. **Debug Workflow Operations**
   - Select "Debug Workflow Context" configuration
   - Set breakpoints in `src/workflow/directory-output-context.ts`
   - Inspect file operations and data storage

## Advanced Debugging Techniques

### 1. Conditional Breakpoints

Set breakpoints that only trigger under certain conditions:

```typescript
// In src/router.ts, line 45
// Right-click breakpoint > Edit Breakpoint > Condition
commandName === 'store' && args.includes('--token')
```

### 2. Log Points

Add logging without breaking execution:

```typescript
// Right-click gutter > Add Log Point
console.log('Command executed:', commandName, args);
```

### 3. Exception Breakpoints

Automatically break on uncaught exceptions:

1. Open Debug view
2. Click on "Breakpoints" tab
3. Click "Add Breakpoint..." > "Exception Breakpoints"
4. Check "Uncaught Exceptions"

### 4. Watch Expressions

Monitor specific variables during debugging:

1. In Debug view, click "Watch" tab
2. Click "+" to add watch expression
3. Add expressions like:
   - `context.referenceManager.listReferences()`
   - `refs.size`
   - `args.join(' ')`

### 5. Debug Console

Execute code during debugging:

```javascript
// In Debug Console, while paused
context.referenceManager.createReference('test', 'data', 'token')
await workflowContext.store('debug', { test: true })
Object.keys(context.config)
```

## Common Debugging Scenarios

### Issue 1: Command Not Found

**Symptoms**: `Unknown command` error

**Debugging Steps**:
1. Set breakpoint in `src/router.ts` at command lookup
2. Inspect `this.commands.keys()`
3. Check if command was properly registered

### Issue 2: Reference Not Found

**Symptoms**: `Reference not found` error

**Debugging Steps**:
1. Set breakpoint in `src/types.ts` at `getReference()`
2. Inspect `this.references` and `this.tokenIndex`
3. Check reference lifecycle timing

### Issue 3: File Permission Errors

**Symptoms**: `EACCES: permission denied`

**Debugging Steps**:
1. Set breakpoint in `src/types.ts` at `writeOutput()`
2. Inspect `this.outputDir` path
3. Check directory permissions

### Issue 4: Module Resolution Errors

**Symptoms**: `Cannot find module` errors

**Debugging Steps**:
1. Check `tsup.config.ts` entry points
2. Verify built files exist in `dist/`
3. Run `npm run build` to rebuild

## Debugging Tasks

Use VS Code tasks for common debugging workflows:

### Available Tasks

1. **Build Project** (`Ctrl+Shift+P` > "Tasks: Run Task" > "Build Project")
2. **Build in Watch Mode** - Continuous rebuilding during development
3. **Run Tests** - Execute test suite
4. **Setup Debugging Environment** - Complete environment setup
5. **Initialize Test Workspace** - Create test environment

### Running Tasks

1. **Command Palette**: `Ctrl+Shift+P` > "Tasks: Run Task"
2. **Terminal**: `Ctrl+Shift+\`` > Select task from dropdown
3. **Keyboard Shortcuts**: Configure custom shortcuts for frequent tasks

## Productivity Tips

### 1. Debugging Shortcuts

- `F5`: Start/Continue debugging
- `F10`: Step Over
- `F11`: Step Into
- `Shift+F11`: Step Out
- `F9`: Toggle Breakpoint
- `Ctrl+Shift+F5`: Restart debugging
- `Shift+F5`: Stop debugging

### 2. Multi-File Debugging

Open multiple files and set breakpoints across:
- `src/index.ts` - Main entry point
- `src/router.ts` - Command routing
- `src/commands/[command].ts` - Specific command
- `src/workflow/` - Workflow processing

### 3. Integrated Terminal

Use the integrated terminal for:
- Running commands outside debugger
- Checking file system state
- Testing manual operations

### 4. Source Maps

Source maps are enabled for debugging TypeScript:
- Set breakpoints in `.ts` files
- Debug using original source code
- Variable inspection works with TypeScript types

## Troubleshooting Debugging Issues

### Issue 1: Breakpoints Not Hit

**Solutions**:
1. Ensure source maps are generated (`npm run build`)
2. Check that `ts-node/esm` loader is configured
3. Verify `NODE_OPTIONS="--experimental-vm-modules"` is set

### Issue 2: Module Loading Errors

**Solutions**:
1. Check that `ts-node` is installed as dev dependency
2. Verify `tsup.config.ts` has correct entry points
3. Ensure working directory is correct in launch config

### Issue 3: Environment Variables

**Solutions**:
1. Set `NODE_OPTIONS="--experimental-vm-modules"` in launch config
2. Check for conflicting environment variables
3. Verify Node.js version >= 18.0.0

### Issue 4: Path Resolution

**Solutions**:
1. Use absolute paths in launch configurations
2. Set `cwd` property in launch config
3. Verify working directory structure

## Next Steps

1. **Practice Debugging**: Try each debug configuration
2. **Custom Commands**: Create and debug your own commands
3. **Test Development**: Write and debug unit tests
4. **Performance Analysis**: Use debugging to analyze performance bottlenecks
5. **Contributing**: Use debugging when contributing to the project

For additional help, refer to the main [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) or open an issue in the project repository.