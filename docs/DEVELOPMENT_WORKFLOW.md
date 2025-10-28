# Development Workflow Guide

This guide explains how to test and debug task workflows during development.

## Quick Start

### Running Tasks via npm

The `npm run task` command builds the project and executes the CLI with any arguments you pass:

```powershell
# Run any task command
npm run task init
npm run task store "test data" --token mytoken
npm run task load --ref mytoken
npm run task agent --model gpt-4 --provider openai
npm run task create my-command

# Pass complex arguments
npm run task replace "Hello {name}" --name "World" --token greeting
npm run task agent --dry-run --verbose --model claude-3
```

### How It Works

The `task` script in `package.json`:
```json
"task": "npm run build && node dist/index.js"
```

This:
1. Builds the TypeScript source (`npm run build`)
2. Executes the compiled CLI (`node dist/index.js`)
3. Passes all additional arguments to the CLI

## Debugging in VS Code

### Debug Configurations Available

Press `F5` or go to **Run and Debug** panel to see these configurations:

#### 1. **Debug Task (with args)** - Main Development Config
- **Use this for**: Testing any command with custom arguments
- **How to use**:
  1. Open `.vscode/launch.json`
  2. Edit the `args` array in the "Debug Task (with args)" configuration
  3. Press F5 to debug

**Example - Debug Init:**
```json
"args": ["init", "--force"]
```

**Example - Debug Store:**
```json
"args": ["store", "my test data", "--token", "myref"]
```

**Example - Debug Agent:**
```json
"args": ["agent", "--model", "gpt-4", "--provider", "openai", "--dry-run"]
```

#### 2. **Pre-configured Command Debuggers**
Ready-to-use debug configs for common commands:
- **Debug Init Command** - Tests `ot init`
- **Debug Store Command** - Tests `ot store "Hello World" --token greeting`
- **Debug Load Command** - Tests `ot load --ref greeting`
- **Debug Create Command** - Tests `ot create my-custom-command`
- **Debug Replace Command** - Tests `ot replace` with templates
- **Debug Custom Command** - Tests custom commands

Just select one and press F5!

#### 3. **Test Debuggers**
- **Debug Tests - All** - Run all vitest tests with debugger
- **Debug Tests - Workflow** - Debug workflow tests
- **Debug Tests - Router** - Debug router tests

### Setting Breakpoints

1. Open any TypeScript file in `src/`
2. Click in the gutter (left of line numbers) to set breakpoints
3. Start debugging (F5)
4. Execution will pause at your breakpoints

**Common Files to Debug:**
- `src/index.ts` - CLI entry point
- `src/router.ts` - Command routing
- `src/task-handler.ts` - Task execution
- `src/commands/agent.ts` - Agent command
- `src/tasks/init.ts` - Init task

### Debug Workflow

**Typical development cycle:**

1. **Write/modify code** in `src/`
2. **Set breakpoints** where you want to inspect
3. **Choose debug config** from dropdown
4. **Press F5** to start debugging
5. **Inspect variables** in the Debug panel
6. **Step through code** with F10 (step over), F11 (step into)
7. **Make changes** and repeat

### Working Directory

All debug configurations run with `cwd: ${workspaceFolder}/test-workspace`.

This means:
- Commands execute as if you're in `test-workspace/`
- `.open-tasks/` directory is in `test-workspace/.open-tasks/`
- Perfect for testing without affecting your main workspace

## Advanced Debugging

### Debugging with Input Prompts

Some commands prompt for user input (like `agent` command). In debug mode:
- Use the integrated terminal
- Type your responses when prompted
- Breakpoints still work during interactive sessions

### Debugging Background Processes

For long-running processes:
1. Use **Attach to Running Process** config
2. Start your process with `--inspect` flag:
   ```powershell
   node --inspect dist/index.js agent --model gpt-4
   ```
3. Attach debugger from VS Code

### Source Maps

The project is configured with source maps:
- Set breakpoints in `.ts` files (not compiled `.js`)
- See original TypeScript code in debugger
- Variable names match your source code

## Build Modes

### One-time Build
```powershell
npm run build
```
Compiles TypeScript to `dist/` directory once.

### Watch Mode
```powershell
npm run dev
```
Automatically rebuilds when you save `.ts` files.

**Tip**: Keep watch mode running in a terminal while developing!

### Global Install (for testing)
```powershell
npm run dev-deploy
```
Builds and installs globally, making `ot` command available system-wide.

## Testing Workflows

### Unit Tests
```powershell
npm test                 # Run tests once
npm run test:coverage    # Run with coverage report
```

### Manual Integration Testing

**Recommended workflow:**

1. **Setup test workspace**:
   ```powershell
   cd test-workspace
   node ../dist/index.js init --force
   ```

2. **Test commands manually**:
   ```powershell
   npm run task store "test" --token t1
   npm run task load --ref t1
   npm run task agent --model gpt-4 --dry-run
   ```

3. **Or debug with VS Code**:
   - Set breakpoints
   - Press F5
   - Step through execution

## Common Issues

### Issue: `Cannot find module`
**Solution**: Run `npm run build` first

### Issue: Debugger doesn't stop at breakpoints
**Solution**: 
- Ensure source maps are enabled (they are by default)
- Check that you set breakpoints in `.ts` files, not `.js`
- Rebuild with `npm run build`

### Issue: Changes not reflected
**Solution**: 
- Stop debugger
- Run `npm run build`
- Start debugger again
- OR: Use `npm run dev` in a separate terminal

### Issue: Wrong working directory
**Solution**: Check `cwd` in launch config is `${workspaceFolder}/test-workspace`

## Tips & Best Practices

1. **Use watch mode** (`npm run dev`) while developing
2. **Test in test-workspace** to avoid polluting main workspace
3. **Set breakpoints liberally** - you can always remove them
4. **Use Debug Console** to evaluate expressions at runtime
5. **Inspect variables** in the Variables panel
6. **Check Call Stack** to understand execution flow
7. **Use conditional breakpoints** for complex scenarios (right-click breakpoint)

## Example: Debugging a New Command

Let's say you're creating a new `transform` command:

1. **Create the command file**:
   ```typescript
   // src/commands/transform.ts
   export const transform = {
     name: 'transform',
     description: 'Transform text',
     execute: async (input, options) => {
       debugger; // Will pause here in debug mode
       return input.toUpperCase();
     }
   };
   ```

2. **Edit launch.json**:
   ```json
   {
     "name": "Debug Transform Command",
     "args": ["transform", "hello world", "--token", "result"]
   }
   ```

3. **Set breakpoints** in `transform.ts`

4. **Press F5** and debug!

## Resources

- [VS Code Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [TypeScript Debugging](https://code.visualstudio.com/docs/typescript/typescript-debugging)
