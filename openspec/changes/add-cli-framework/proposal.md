# Change Proposal: Add CLI Framework

**Change ID:** `add-cli-framework`  
**Created:** 2025-10-17  
**Status:** Draft

## Summary

Create an npm-based CLI tool (`open-tasks-cli`) that enables users to chain async command operations with explicit context passing between steps. The tool supports built-in commands, extensibility via local plugins, and formatted output to both screen and files.

## Motivation

Users need a flexible command-line tool to:
- Execute multi-step workflows where each command's output becomes input for subsequent commands
- Store and pass context explicitly between operations (rather than relying on implicit state)
- Extend functionality by adding custom command modules to their workspace
- Observe command execution with color-coded, formatted feedback
- Integrate AI CLI tools with pre-defined context and transformations
- Capture all outputs to timestamped files for auditing and reuse

## Goals

1. **Composable Commands**: Enable verb-based commands that can be chained together with explicit reference passing
2. **Extensibility**: Allow users to add custom command modules in `.open-tasks/commands/` that are auto-discovered
3. **Async Execution**: All commands execute asynchronously with progress feedback
4. **Dual Output**: Write command outputs to both the terminal (with formatting/colors) and timestamped files
5. **Reference Management**: Support memory references (tokens) that store command outputs for reuse
6. **Built-in Commands**: Provide core commands for storage, file I/O, string manipulation, shell execution, AI integration, and data extraction

## Non-Goals

- Building a full task management system (focus is on command orchestration)
- Providing a GUI or TUI interface (CLI-only)
- Managing authentication for external services (assumes pre-authenticated CLIs)
- Cross-platform shell support beyond PowerShell (can be added later)

## Affected Capabilities

This change introduces the following new capabilities:

- **cli-core**: Core CLI framework, command routing, and execution engine
- **command-lifecycle**: Async command execution, output handling, and reference management
- **command-builtins**: Built-in command implementations (store, load, replace, powershell, ai-cli, extract)
- **command-extension**: Plugin system for custom commands
- **output-formatting**: Terminal formatting, color coding, and file output

## Open Questions

1. Should the tool support scripting (e.g., reading a file with multiple commands)?
2. What error handling strategy for failed commands in a chain?
3. Should there be a way to "undo" or rollback command outputs?
4. Do we need a configuration file for default behaviors (output directory, formatting preferences, etc.)?

## Success Criteria

- [ ] Users can install `open-tasks-cli` via npm and run basic commands
- [ ] All six built-in commands work with explicit reference passing
- [ ] Custom commands in `.open-tasks/commands/` are discovered and executed
- [ ] All command outputs are written to timestamped files
- [ ] Terminal output includes color-coded formatting for different output types
- [ ] Documentation covers installation, usage, and extension development

## Related Changes

None (initial implementation)

## References

- Requirements: `../../../open-tasks-wiki/Requirements.md`
