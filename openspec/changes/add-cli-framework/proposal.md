# Change Proposal: Add CLI Framework

**Change ID:** `add-cli-framework`  
**Created:** 2025-10-17  
**Status:** Draft

## Summary

Create an npm-based CLI tool (`open-tasks-cli`) that enables users to execute tasks with explicit workflow context. The tool provides:

1. **System Commands**: Built-in commands for initialization and scaffolding (`init`, `create`)
2. **Built-in CLI Commands**: Core operational commands packaged with the CLI
3. **Task Handlers**: User-defined custom commands in `.open-tasks/commands/` that extend functionality (extends `TaskHandler` abstract class)
4. **IWorkflowContext API**: Internal programmatic API for workflow processing (provided by `workflow-processing` capability)

The architecture separates system management, core operations, and extensibility while providing a consistent internal API (IWorkflowContext) for all command implementations.

## Motivation

Users need a flexible command-line tool to:
- Initialize projects with necessary dependencies and structure (`init`)
- Scaffold new task handler templates quickly (`create`)
- Execute tasks that can orchestrate multi-step workflows using IWorkflowContext
- Store and pass context explicitly between operations via MemoryRef objects
- Extend functionality by adding custom TaskHandler modules to their workspace
- Observe task execution with structured TaskOutcome results (id, name, logs, errors)
- Track all operations in TaskLog entries for auditing and debugging
- Integrate different command implementations (ICommand) that can be composed together

**Key Architecture**: 
- **TaskHandler**: Abstract class for CLI-invokable tasks, receives args and IWorkflowContext, returns TaskOutcome
- **ICommand**: Interface for executable commands used within TaskHandlers via context.run(), returns MemoryRef[]
- **IWorkflowContext**: Internal API (store, token, run) used by TaskHandlers and ICommand implementations
- **MemoryRef**: Reference objects (id, token, fileName) tracking stored values and command outputs

## Goals

1. **System Commands**: Provide `init` to set up project dependencies and `create` to scaffold TaskHandler templates
2. **Task Handler Framework**: Enable TaskHandler abstract class for user-defined commands with standardized interface
3. **TaskOutcome Results**: Return structured results with id, name, logs array, and errors array
4. **TaskLog Tracking**: Track each command execution with MemoryRef properties, command type, args, and timestamps
5. **Extensibility**: Allow users to add custom TaskHandler modules in `.open-tasks/commands/` that are auto-discovered
6. **Async Execution**: All task handlers execute asynchronously with progress feedback
7. **Dual Output**: TaskOutcome provides structured results; CLI formats for terminal display
8. **IWorkflowContext Integration**: Task handlers receive IWorkflowContext for orchestrating operations
9. **Built-in Commands**: Provide core commands that may internally use TaskHandler pattern
10. **Clear Separation**: IWorkflowContext functions are internal APIs, TaskHandlers are CLI-invokable

## Non-Goals

- Building a full task management system (focus is on task execution and workflow orchestration)
- Providing a GUI or TUI interface (CLI-only)
- Managing authentication for external services (assumes pre-authenticated CLIs)
- Cross-platform shell support beyond PowerShell in initial version (can be added later)

## Affected Capabilities

This change introduces the following new capabilities:

- **cli-core**: Core CLI framework, command routing, execution engine, and system commands (init, create)
- **command-lifecycle**: Async task execution, TaskOutcome handling, and TaskLog tracking
- **command-builtins**: Built-in CLI command implementations
- **command-extension**: TaskHandler system for custom user-defined commands in `.open-tasks/commands/`
- **output-formatting**: Terminal formatting, color coding, and TaskOutcome display

**Note**: The `workflow-processing` capability defines the IWorkflowContext API (context.store(), context.token(), context.run()), MemoryRef type, ICommand interface, and IMemoryDecorator interface. These are internal APIs used by TaskHandler implementations.

## Open Questions

1. Should the tool support scripting (e.g., reading a file with multiple tasks)?
2. What error handling strategy for failed operations within a TaskHandler?
3. Should there be a way to "undo" or rollback task outputs?
4. Do we need a configuration file for default behaviors (output directory, formatting preferences, etc.)?
5. How should TaskLog entries be displayed to users (full detail vs summary)?

## Success Criteria

- [ ] Users can install `open-tasks-cli` via npm and run basic commands
- [ ] System command `init` sets up project with npm dependencies and directory structure
- [ ] System command `create` scaffolds new TaskHandler templates in `.open-tasks/commands/`
- [ ] TaskHandler abstract class is defined and can be extended
- [ ] TaskOutcome type includes id, name, logs, and errors
- [ ] TaskLog type tracks MemoryRef properties, command, args, start, and end timestamps
- [ ] Custom TaskHandlers in `.open-tasks/commands/` are discovered and executed
- [ ] TaskHandlers can use IWorkflowContext (store, token, run) effectively
- [ ] Built-in commands work with consistent behavior
- [ ] Terminal output displays TaskOutcome results with formatting
- [ ] Documentation clearly distinguishes between TaskHandler, ICommand, IWorkflowContext, and MemoryRef
- [ ] Documentation covers installation, usage, and TaskHandler development

## Related Changes

- Depends on `add-workflow-processing` for IWorkflowContext interface and MemoryRef type
- TaskHandler classes use IWorkflowContext to orchestrate workflows
- Built-in commands may internally use IWorkflowContext

## References

- Updated design document: `open-tasks-wiki/Updated Specs Reqs.md`
