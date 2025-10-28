# Quick Reference: Testing & Debugging Tasks

## Testing Tasks (Command Line)

### Basic Usage
```powershell
npm run task <command> <arguments>
```

### Examples
```powershell
# Initialize project
npm run task init

# Store and load data
npm run task store "Hello World" --token greeting
npm run task load --ref greeting

# Test agent commands
npm run task agent --model gpt-4 --dry-run --verbose
npm run task agent --provider openai --model gpt-4

# Create custom commands
npm run task create my-command

# Complex workflows
npm run task replace "Hello {name}" --name "World" --token result
```

## Debugging in VS Code

### Quick Start
1. Open Run and Debug panel (Ctrl+Shift+D)
2. Select configuration from dropdown
3. Press F5

### Main Debug Configurations

| Configuration | Purpose | How to Customize |
|--------------|---------|------------------|
| **Debug Task (with args)** | Flexible testing | Edit `args` in launch.json |
| Debug Init Command | Test `init` | Pre-configured, just F5 |
| Debug Store Command | Test `store` | Pre-configured, just F5 |
| Debug Load Command | Test `load` | Pre-configured, just F5 |
| Debug Create Command | Test `create` | Pre-configured, just F5 |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F5 | Start debugging |
| F9 | Toggle breakpoint |
| F10 | Step over |
| F11 | Step into |
| Shift+F11 | Step out |
| Ctrl+Shift+F5 | Restart |
| Shift+F5 | Stop |

### Setting Breakpoints
1. Open any `.ts` file in `src/`
2. Click left of line number (red dot appears)
3. Start debugging (F5)
4. Execution pauses at breakpoint

### Common Files to Debug
- `src/index.ts` - CLI entry point
- `src/router.ts` - Command routing
- `src/task-handler.ts` - Task execution
- `src/commands/agent.ts` - Agent commands
- `src/tasks/init.ts` - Init task

## Development Workflow

### Recommended Setup
```powershell
# Terminal 1: Watch mode (auto-rebuild on save)
npm run dev

# Terminal 2: Test commands
npm run task store "test" --token t1
npm run task load --ref t1

# Or use VS Code debugger with breakpoints
```

### Quick Iteration
1. **Make code changes** in TypeScript files
2. **Auto-rebuild** (if watch mode running) OR manually `npm run build`
3. **Test** with `npm run task <command>` OR debug with F5
4. **Repeat**

## Customizing Debug Configuration

Edit `.vscode/launch.json` to create your own debug setup:

```json
{
  "name": "Debug My Workflow",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/dist/index.js",
  "args": ["my-command", "--my-option", "value"],
  "cwd": "${workspaceFolder}/test-workspace",
  "preLaunchTask": "npm: Build Project"
}
```

## Tips

✅ Use `npm run dev` in a terminal for auto-rebuild  
✅ Test in `test-workspace/` to avoid polluting main workspace  
✅ Set breakpoints liberally - easy to remove  
✅ Use Debug Console to evaluate expressions at runtime  
✅ Check Variables panel to inspect state  
✅ Use Call Stack to understand execution flow  

## Need More Help?

📖 **Full Guide**: [docs/DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)  
📋 **Setup Summary**: [docs/NPM_TASK_DEBUG_SETUP.md](NPM_TASK_DEBUG_SETUP.md)  
🏠 **Main README**: [README.md](../README.md)  

## Common Issues

**Build errors?** → Run `npm run build` manually  
**Breakpoints not working?** → Ensure source maps enabled (they are by default)  
**Changes not reflected?** → Rebuild with `npm run build` or use watch mode  
**Wrong directory?** → Check `cwd` in launch.json is `test-workspace`  
