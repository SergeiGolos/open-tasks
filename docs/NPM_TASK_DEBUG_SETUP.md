# npm Task Script & VS Code Debugging Setup - Summary

## What Was Done

### 1. Added npm Task Script

**File**: `package.json`

Added a new `task` script to the scripts section:
```json
"task": "npm run build && node dist/index.js"
```

**Usage**:
```powershell
npm run task init
npm run task store "data" --token ref
npm run task agent --model gpt-4 --dry-run
npm run task <any-command> <args>
```

**What it does**:
- Automatically builds the project
- Runs the CLI with any arguments you provide
- Perfect for quick testing during development

### 2. Fixed VS Code Debug Configurations

**File**: `.vscode/launch.json`

**Changes Made**:
- Fixed all paths from `open-tasks-cli/dist/` to `dist/`
- Fixed working directory references
- Updated test configurations to use correct workspace paths

**Added New Configuration**:
- **"Debug Task (with args)"** - Main flexible debugging config
  - Edit `args` array to test any command
  - Press F5 to start debugging
  - Automatically builds before debugging

**Fixed Existing Configurations**:
- Debug CLI (Built)
- Debug Init Command
- Debug Create Command
- Debug Store Command
- Debug Load Command
- Debug Replace Command
- Debug Custom Command
- Debug Tests - All
- Debug Tests - Workflow
- Debug Tests - Router

All configurations now:
✅ Point to correct `dist/index.js` location
✅ Use correct workspace folders
✅ Have source maps enabled
✅ Run in `test-workspace` directory
✅ Auto-build before debugging

### 3. Created Comprehensive Documentation

**File**: `docs/DEVELOPMENT_WORKFLOW.md`

Complete guide covering:
- How to use `npm run task`
- All debug configurations explained
- Setting breakpoints
- Debug workflow best practices
- Common issues and solutions
- Example debugging scenarios

### 4. Updated README.md

Enhanced the Development section:
- Added `npm run task` examples
- Listed debugging features
- Referenced comprehensive workflow guide
- Added watch mode recommendation

## How to Use

### Testing Tasks via Command Line

```powershell
# Quick test any command
npm run task init
npm run task store "hello" --token greeting
npm run task load --ref greeting

# Test with complex args
npm run task agent --model gpt-4 --provider openai --dry-run --verbose
```

### Debugging in VS Code

**Method 1: Flexible Debug (Recommended)**
1. Open `.vscode/launch.json`
2. Find "Debug Task (with args)" configuration
3. Edit the `args` array:
   ```json
   "args": ["init", "--force"]
   ```
4. Press F5

**Method 2: Pre-configured Debugs**
1. Click the Run and Debug icon in VS Code (Ctrl+Shift+D)
2. Select a pre-configured option from dropdown:
   - Debug Init Command
   - Debug Store Command
   - Debug Load Command
   - etc.
3. Press F5

**Method 3: Set Breakpoints and Go**
1. Open any TypeScript file in `src/`
2. Click left of line number to set breakpoint (red dot)
3. Select debug config
4. Press F5
5. Code pauses at breakpoint

## Files Modified

✅ `package.json` - Added `task` script
✅ `.vscode/launch.json` - Fixed all paths and configurations
✅ `docs/DEVELOPMENT_WORKFLOW.md` - Created comprehensive guide
✅ `README.md` - Enhanced Development section

## Testing Done

✅ Verified `npm run task -- --help` works correctly
✅ Build process completes successfully
✅ CLI executes with proper arguments
✅ No errors in launch.json
✅ All debug configurations validated

## Benefits

### For Development
- **Faster testing**: No need to install globally
- **Quick iteration**: Build and test in one command
- **Flexible**: Test any command with any arguments

### For Debugging
- **Easy setup**: Pre-configured for common scenarios
- **Flexible**: Edit args for custom testing
- **Source maps**: Debug TypeScript directly
- **Breakpoints**: Stop execution anywhere
- **Inspection**: View variables, call stack, etc.

### For New Contributors
- **Clear documentation**: Step-by-step guides
- **Low friction**: npm run task just works
- **Multiple approaches**: CLI testing and VS Code debugging
- **Best practices**: Examples and tips included

## Next Steps

You can now:
1. ✅ Run `npm run task <command> <args>` to test workflows
2. ✅ Press F5 in VS Code to debug
3. ✅ Set breakpoints in any TypeScript file
4. ✅ Inspect variables during execution
5. ✅ Read `docs/DEVELOPMENT_WORKFLOW.md` for advanced techniques

## Quick Reference

### npm Commands
```powershell
npm run build          # Build once
npm run dev            # Build and watch
npm run task <args>    # Build and run CLI
npm test               # Run tests
npm run dev-deploy     # Install globally
```

### VS Code Shortcuts
- **F5** - Start debugging
- **F9** - Toggle breakpoint
- **F10** - Step over
- **F11** - Step into
- **Shift+F11** - Step out
- **Ctrl+Shift+D** - Open Run and Debug panel

### Debug Workflow
1. Write code → 2. Set breakpoints → 3. Press F5 → 4. Inspect → 5. Fix → 6. Repeat
