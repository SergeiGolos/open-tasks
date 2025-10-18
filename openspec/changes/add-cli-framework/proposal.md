# Change Proposal: Add CLI Framework

**Change ID:** `add-cli-framework`  
**Created:** 2025-10-17  
**Status:** Draft

## Summary

Create an npm-based CLI tool (`open-tasks-cli`) that enables users to chain async command operations with explicit context passing between steps. The tool provides:
1. **System Commands**: Built-in commands for initialization and scaffolding (`init`, `create`)
2. **Built-in CLI Commands**: Core operational commands packaged with the CLI (`store`, `load`, `replace`, `powershell`, `ai-cli`, `extract`)
3. **Process Commands**: User-defined custom commands in `.open-tasks/commands/` that extend functionality
4. **Context API**: Internal programmatic API for workflow processing (not exposed as CLI commands)

The three-tier architecture separates system management, core operations, and extensibility.

## Motivation

Users need a flexible command-line tool to:
- Initialize projects with necessary dependencies and structure (`init`)
- Scaffold new process command templates quickly (`create`)
- Execute multi-step workflows where each command's output becomes input for subsequent commands
- Store and pass context explicitly between operations (rather than relying on implicit state)
- Extend functionality by adding custom process command modules to their workspace
- Observe command execution with color-coded, formatted feedback
- Integrate AI CLI tools with pre-defined context and transformations
- Capture all outputs to timestamped files for auditing and reuse

**Important Distinction**: The Context API functions (`context.store()`, `context.load()`, `context.transform()`, `context.run()`) are internal programmatic APIs used by command implementations. They are NOT exposed as CLI commands. Only process commands in `.open-tasks/commands/` are exposed to end users.

## Goals

1. **System Commands**: Provide `init` to set up project dependencies and `create` to scaffold process command templates
2. **Composable Commands**: Enable verb-based commands that can be chained together with explicit reference passing
3. **Extensibility**: Allow users to add custom process command modules in `.open-tasks/commands/` that are auto-discovered
4. **Async Execution**: All commands execute asynchronously with progress feedback
5. **Dual Output**: Write command outputs to both the terminal (with formatting/colors) and timestamped files
6. **Reference Management**: Support memory references (tokens) that store command outputs for reuse
7. **Built-in CLI Commands**: Provide six core commands for common operations (store, load, replace, powershell, ai-cli, extract)
8. **Clear Separation**: Keep Context API functions as internal implementation details, not exposed as CLI commands

## Non-Goals

- Building a full task management system (focus is on command orchestration)
- Providing a GUI or TUI interface (CLI-only)
- Managing authentication for external services (assumes pre-authenticated CLIs)
- Cross-platform shell support beyond PowerShell (can be added later)

## Affected Capabilities

This change introduces the following new capabilities:

- **cli-core**: Core CLI framework, command routing, execution engine, and system commands (init, create)
- **command-lifecycle**: Async command execution, output handling, and reference management
- **command-builtins**: Built-in CLI command implementations (store, load, replace, powershell, ai-cli, extract)
- **command-extension**: Plugin system for custom process commands in `.open-tasks/commands/`
- **output-formatting**: Terminal formatting, color coding, and file output

**Note**: The `workflow-processing` capability defines the internal Context API (`context.store()`, `context.load()`, `context.transform()`, `context.run()`). These are NOT CLI commands and are NOT exposed to end users directly.

## Open Questions

1. Should the tool support scripting (e.g., reading a file with multiple commands)?
2. What error handling strategy for failed commands in a chain?
3. Should there be a way to "undo" or rollback command outputs?
4. Do we need a configuration file for default behaviors (output directory, formatting preferences, etc.)?

## Success Criteria

- [ ] Users can install `open-tasks-cli` via npm and run basic commands
- [ ] System command `init` sets up project with npm dependencies and directory structure
- [ ] System command `create` scaffolds new process command templates in `.open-tasks/commands/`
- [ ] All six built-in CLI commands work with explicit reference passing
- [ ] Custom process commands in `.open-tasks/commands/` are discovered and executed
- [ ] All command outputs are written to timestamped files
- [ ] Terminal output includes color-coded formatting for different output types
- [ ] Documentation clearly distinguishes between system commands, CLI commands, process commands, and Context API
- [ ] Documentation covers installation, usage, and process command development

## Related Changes

None (initial implementation)

## References

- Requirements: `../../../open-tasks-wiki/Requirements.md`
