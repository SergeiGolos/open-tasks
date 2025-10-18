# Implementation Tasks: Add Workflow Processing

**Change ID:** `add-workflow-processing`  
**Last Updated:** 2025-10-18

## Task Checklist

### Phase 1: Core Interfaces and Types

- [x] **Task 1.1: Define MemoryRef interface**
  - Create interface for memory references with id, token, fileName, content, timestamp
  - Implemented in `src/workflow/types.ts`
  - **Validation:** Interface compiles and exports correctly ✅
  
- [x] **Task 1.2: Define ICommand interface**
  - Create interface with execute method signature
  - Accept context and arguments in execute method
  - Define return type as Promise<MemoryRef[]>
  - Implemented in `src/workflow/types.ts`
  - **Validation:** Interface allows proper implementation ✅
  - **Dependency:** Task 1.1

- [x] **Task 1.3: Define IMemoryDecorator interface**
  - Create interface for decorator operations that transform MemoryRef
  - Include method to decorate MemoryRef objects
  - Implemented in `src/workflow/types.ts`
  - **Validation:** Interface supports multiple decorator types ✅
  - **Dependency:** Task 1.1

- [x] **Task 1.4: Create workflow types module**
  - Define all TypeScript types for workflow system
  - Include TaskOutcome and TaskLog types for execution tracking
  - Add IWorkflowContext interface
  - Implemented in `src/workflow/types.ts`
  - **Validation:** All types export and compile cleanly ✅

### Phase 2: File Storage and Reference System

- [x] **Task 2.1: Implement file naming convention**
  - Create function to generate timestamped file names
  - Implement timestamp format (ISO 8601)
  - Handle special characters in property names
  - Implemented in `src/workflow/decorators.ts` (TimestampedFileNameDecorator)
  - **Validation:** Generated file names follow convention ✅
  
- [x] **Task 2.2: Implement MemoryRef creation**
  - Store memory references with id, token, fileName, content, timestamp
  - Implemented in WorkflowContext classes
  - **Validation:** Can create and use memory references ✅
  - **Dependency:** Task 1.1, 2.1

- [x] **Task 2.3: Implement file storage service**
  - Create service to write content to files
  - Ensure directory creation for output paths
  - Handle file write errors gracefully
  - Support atomic write operations
  - Implemented in `src/workflow/directory-output-context.ts`
  - **Validation:** Files are created with correct names and content ✅
  - **Dependency:** Task 2.1

- [x] **Task 2.4: Implement file loading service**
  - Create service to read content from files
  - Support both path-based loading
  - Handle missing files with clear errors
  - Support encoding options (default UTF-8)
  - Implemented in DirectoryOutputContext.load()
  - **Validation:** Can load files and return content ✅
  - **Dependency:** Task 2.2

### Phase 3: WorkflowContext Implementation

- [x] **Task 3.1: Create WorkflowContext class skeleton**
  - Define InMemoryWorkflowContext and DirectoryOutputContext classes
  - Store output directory and configuration
  - Initialize internal state for tracking references
  - Implemented in `src/workflow/in-memory-context.ts` and `src/workflow/directory-output-context.ts`
  - **Validation:** Classes can be instantiated ✅

- [x] **Task 3.2: Implement store method**
  - Accept values to be stored
  - Apply decorators to MemoryRef
  - Generate file name based on token/id and timestamp (DirectoryOutputContext)
  - Write content to file using storage service
  - Create and return MemoryRef
  - Implemented in both context classes
  - **Validation:** `context.store(value, decorators)` creates file and returns reference ✅
  - **Dependency:** Task 2.2, 2.3, 3.1

- [x] **Task 3.3: Implement token lookup method**
  - Accept token name as input
  - Return latest value for that token (synchronous)
  - Implemented as `token(name: string)` method
  - **Validation:** `context.token("name")` returns stored value ✅
  - **Dependency:** Task 2.2, 3.1

- [x] **Task 3.4: Implement run method**
  - Accept ICommand instance as parameter
  - Call command's execute method with context
  - Await async execution
  - Return MemoryRef[] from command execution
  - Handle command execution errors
  - Implemented in both context classes
  - **Validation:** `context.run(command)` executes and returns references ✅
  - **Dependency:** Task 1.2, 3.1

### Phase 4: Transform System

- [x] **Task 4.1: Create ICommand implementations as transforms**
  - Implement transform commands using ICommand interface
  - Commands pull tokens from context by name
  - No transform method on WorkflowContext (per updated architecture)
  - **Validation:** Transform commands can be implemented ✅
  - **Dependency:** Task 1.3

- [x] **Task 4.2: Implement token replacement transform**
  - Create TokenReplaceCommand that replaces `{{token}}` patterns
  - Pull token values from context using context.token()
  - Replace tokens with referenced content
  - Handle missing tokens gracefully
  - Implemented in `src/workflow/transforms.ts`
  - **Validation:** Replaces tokens correctly in test strings ✅
  - **Dependency:** Task 4.1

- [x] **Task 4.3: Implement regex parsing transform**
  - Create ExtractCommand that applies regex patterns
  - Extract matches using capture groups
  - Support full match when no groups
  - Store match results as formatted string
  - Implemented ExtractCommand and RegexMatchCommand in `src/workflow/transforms.ts`
  - **Validation:** Extracts matches from test strings ✅
  - **Dependency:** Task 4.1

- [x] **Task 4.4: Implement additional transform commands**
  - SplitCommand: splits content by delimiter into multiple MemoryRefs
  - JoinCommand: joins multiple tokens into single output
  - All commands use token-based lookup from context
  - Implemented in `src/workflow/transforms.ts`
  - **Validation:** Transform commands work and can be chained ✅
  - **Dependency:** Task 3.1, 4.1, 4.2

- [ ] **Task 4.5: Add transform metadata to output files**
  - Store list of applied transforms in file header or footer
  - Include transform type and parameters
  - Format as markdown comments or frontmatter
  - Preserve original content
  - **Validation:** Output files contain transform metadata
  - **Dependency:** Task 4.4

### Phase 5: Optional File Name Transforms

- [ ] **Task 5.1: Implement file name transform interface**
  - Define interface for transforming generated file names
  - Allow custom naming patterns
  - Support template-based naming
  - **Validation:** Interface allows flexible naming

- [ ] **Task 5.2: Add file name transform to store method**
  - Accept optional file name transform parameter
  - Apply transform to generated file name
  - Validate transformed name is valid
  - **Validation:** Custom file names work correctly
  - **Dependency:** Task 3.2, 5.1

- [ ] **Task 5.3: Add file name transform to load method**
  - Accept optional file name transform parameter
  - Apply transform when creating output reference
  - **Validation:** Custom naming works for load operations
  - **Dependency:** Task 3.3, 5.1

- [ ] **Task 5.4: Add file name transform to transform method**
  - Accept optional file name transform parameter
  - Apply to generated output file name
  - **Validation:** Custom naming works for transform operations
  - **Dependency:** Task 4.4, 5.1

### Phase 6: Testing

- [x] **Task 6.1: Write unit tests for decorators**
  - Test TokenDecorator, FileNameDecorator, TimestampedFileNameDecorator
  - Test decorator application to MemoryRefs
  - Implemented in `test/decorators.test.ts`
  - **Validation:** All decorator tests pass ✅
  - **Dependency:** Task 2.1

- [x] **Task 6.2: Write unit tests for WorkflowContext**
  - Test InMemoryWorkflowContext and DirectoryOutputContext
  - Test store, token, run methods
  - Test error conditions
  - Implemented in `test/workflow.test.ts`
  - **Validation:** All context tests pass ✅
  - **Dependency:** Task 2.2

- [x] **Task 6.3: Write unit tests for WorkflowContext methods**
  - Test store, token, run individually
  - Test error conditions
  - Test file creation and naming (DirectoryOutputContext)
  - Implemented in `test/workflow.test.ts`
  - **Validation:** All context method tests pass ✅
  - **Dependency:** Phase 3, 4 complete

- [x] **Task 6.4: Write integration tests for transforms**
  - Test token replacement with real context
  - Test regex parsing with various patterns
  - Test transform chaining
  - Test all transform commands (TokenReplace, Extract, RegexMatch, Split, Join)
  - Implemented in `test/transforms.test.ts`
  - **Validation:** All transform tests pass (14 tests) ✅
  - **Dependency:** Phase 4 complete

- [ ] **Task 6.5: Write end-to-end workflow tests**
  - Test complete workflows with multiple operations
  - Test chaining store → run(command) → token
  - Test real file I/O operations with DirectoryOutputContext
  - **Validation:** E2E tests pass
  - **Dependency:** Phase 3, 4, 5 complete

### Phase 7: Documentation and Examples

- [ ] **Task 7.1: Write API documentation**
  - Document WorkflowContext class and methods
  - Document ICommand and ITransform interfaces
  - Document FileReference usage
  - Include code examples for each operation
  - **Validation:** Documentation is complete and accurate

- [ ] **Task 7.2: Create transform implementation guide**
  - Document how to create custom transforms
  - Provide transform template
  - Explain transform metadata
  - Show integration examples
  - **Validation:** Developer can create custom transform from guide

- [ ] **Task 7.3: Create command implementation guide**
  - Document how to implement ICommand
  - Provide command template
  - Show context usage examples
  - Explain error handling
  - **Validation:** Developer can create custom command from guide

- [ ] **Task 7.4: Create workflow examples**
  - Document 3-5 complete workflow examples
  - Show store and load patterns
  - Demonstrate transform chaining
  - Include run command examples
  - **Validation:** Examples are tested and work correctly

- [ ] **Task 7.5: Write architecture documentation**
  - Explain file-based storage design
  - Document reference passing pattern
  - Explain transform pipeline architecture
  - Document extension points
  - **Validation:** Architecture is clearly documented

## Dependency Graph

```
Phase 1 (Interfaces)
├── 1.1 → 1.2, 1.3
├── 1.4 (independent)

Phase 2 (Storage)
├── 1.1, 2.1 → 2.2 → 2.4
├── 2.1 → 2.3

Phase 3 (Context)
├── 3.1 → 3.2, 3.3, 3.4
├── 2.2, 2.3 → 3.2
├── 2.2, 2.4 → 3.3
├── 1.2 → 3.4

Phase 4 (Transforms)
├── 1.3 → 4.1 → 4.2, 4.3
├── 3.1, 4.1, 4.2 → 4.4 → 4.5

Phase 5 (Optional Naming)
├── 5.1 → 5.2, 5.3, 5.4
├── 3.2 → 5.2
├── 3.3 → 5.3
├── 4.4 → 5.4

Phase 6 (Testing)
├── 2.1 → 6.1
├── 2.2 → 6.2
├── Phase 3, 4 → 6.3
├── Phase 4 → 6.4
├── Phase 3, 4, 5 → 6.5

Phase 7 (Documentation)
├── Phase 3, 4, 5 → 7.1, 7.2, 7.3, 7.4, 7.5
```

## Parallel Work Opportunities

- **Phase 1** can be done in parallel (all interface definitions)
- **Phase 2** tasks 2.3 and 2.4 can be done in parallel after 2.1, 2.2
- **Phase 3** tasks 3.2, 3.3, 3.4 can be done in parallel after 3.1
- **Phase 4** tasks 4.2, 4.3 can be done in parallel
- **Phase 5** tasks 5.2, 5.3, 5.4 can be done in parallel after 5.1
- **Testing** can start alongside implementation
- **Documentation** can be written as features are completed

## Estimated Effort

- **Phase 1:** 2-3 hours
- **Phase 2:** 4-6 hours
- **Phase 3:** 6-8 hours
- **Phase 4:** 8-10 hours
- **Phase 5:** 3-4 hours
- **Phase 6:** 8-10 hours
- **Phase 7:** 6-8 hours

**Total:** 37-49 hours (approximately 1 week full-time)

## Success Metrics

- [ ] All WorkflowContext methods work correctly
- [ ] File references can be passed and chained
- [ ] Transforms apply correctly and preserve metadata
- [ ] ICommand interface can be implemented
- [ ] File naming follows convention
- [ ] Error handling is robust
- [ ] Test coverage > 80%
- [ ] Documentation is complete
- [ ] Extension guides enable custom implementations
