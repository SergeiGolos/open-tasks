# Change Proposal: Add Workflow Processing

**Change ID:** `add-workflow-processing`  
**Created:** 2025-10-17  
**Status:** Draft

## Summary

Implement a workflow processing system that provides the **IWorkflowContext** interface for context-based function execution with automatic file-based input/output recording. The system supports:

1. **IWorkflowContext Interface**: Core API with `store()`, `token()`, and `run()` methods
2. **MemoryRef**: Reference objects with id, token, and fileName properties for tracking stored values
3. **ICommand Interface**: Executable commands that receive context and return MemoryRef arrays
4. **IMemoryDecorator Interface**: Transformations applied to MemoryRefs during storage operations
5. **Multiple Context Implementations**: InMemoryWorkflowContext, DirectoryOutputContext, and future RemoteOutputContext

This is an **internal programmatic API** used by TaskHandler implementations and built-in commands - NOT exposed as CLI commands.

## Motivation

Task handlers and built-in commands need a flexible workflow processing system to:
- Store values with automatic reference creation and file recording (for file-based contexts)
- Retrieve stored values quickly via token-based lookup
- Execute command implementations (ICommand) that can be composed together
- Apply transformations to memory references via decorators during storage
- Support different storage backends (memory, filesystem, remote) via a common interface
- Track execution history with MemoryRef objects that maintain metadata

## Goals

1. **IWorkflowContext Interface**: Define standard interface for all context implementations
2. **Store with Decorators**: Provide `store(value, decorators)` that creates MemoryRefs with transformations
3. **Token Lookup**: Provide synchronous `token(name)` that returns latest value for a token
4. **Command Execution**: Provide `run(command)` that executes ICommand instances with the context
5. **MemoryRef Structure**: Define MemoryRef type with id, token, and fileName properties
6. **ICommand Interface**: Define interface for executable commands that accept context and return MemoryRef[]
7. **IMemoryDecorator Interface**: Define interface for MemoryRef transformations (naming, tokens, timestamps)
8. **Multiple Implementations**: Support InMemoryWorkflowContext (dictionary lookup), DirectoryOutputContext (timestamped file directories), and future RemoteOutputContext (cloud storage)

## Non-Goals

- Building user-facing CLI commands (those are in `command-builtins` and `command-extension`)
- Providing a visual workflow designer (code-based only)
- Managing distributed execution (single-process only)
- Supporting binary file formats in initial version (text files only for file-based contexts)

## Affected Capabilities

This change introduces the following new capability:

- **workflow-processing**: IWorkflowContext interface, MemoryRef type, ICommand interface, IMemoryDecorator interface, and context implementations

## What Changes

- Add IWorkflowContext interface with store(), token(), and run() methods
- Implement MemoryRef type with id, token, and fileName properties
- Create ICommand interface for executable command instances
- Create IMemoryDecorator interface for MemoryRef transformations
- Implement InMemoryWorkflowContext with dictionary-based storage
- Implement DirectoryOutputContext with timestamped file directories
- Design future RemoteOutputContext for cloud storage integration
- Ensure all operations are asynchronous (except token lookup)

## Impact

- Affected specs: New capability `workflow-processing`
- Affected code: New implementation in workflow processing module
- **BREAKING**: None (new feature)
- **Relationship**: Used internally by TaskHandler classes and built-in commands

## Open Questions

1. Should MemoryRef track additional metadata (creation time, size, etc.)?
2. What error handling strategy for failed context.run() operations?
3. Should there be a way to clear or reset the context state?
4. Do we need support for nested/hierarchical tokens?
5. Should IMemoryDecorator have access to the full context for advanced scenarios?

## Success Criteria

- [ ] IWorkflowContext interface is defined and implemented
- [ ] InMemoryWorkflowContext stores values in memory dictionary
- [ ] DirectoryOutputContext creates timestamped directories and files
- [ ] MemoryRef type includes id, token, and fileName
- [ ] `context.store()` accepts decorators and applies them before creating MemoryRef
- [ ] `context.token()` returns latest value for a token (synchronous)
- [ ] `context.run()` executes ICommand instances and returns MemoryRef[]
- [ ] ICommand interface is defined and can be implemented
- [ ] IMemoryDecorator interface is defined with example implementations
- [ ] All operations are properly asynchronous (except token lookup)
- [ ] TaskHandler classes can use IWorkflowContext effectively
- [ ] Documentation covers all interfaces and usage patterns

## Related Changes

- Complements `add-cli-framework` by providing the internal workflow API used by TaskHandler and commands
- TaskHandler classes (in `command-extension`) use IWorkflowContext
- Built-in commands (in `command-builtins`) may use IWorkflowContext internally

## References

- Updated design document: `open-tasks-wiki/Updated Specs Reqs.md`
