# Design Document: Workflow Processing

**Change ID:** `add-workflow-processing`  
**Last Updated:** 2025-10-17

## Context

The workflow processing system needs to provide a context-based execution model where functions can store, load, transform, and run operations with automatic file-based I/O recording. This design addresses how to implement this system with proper abstraction and extensibility.

## Goals

- Provide a clean context API for workflow operations
- Implement file-based storage with consistent naming
- Enable reference passing between operations
- Support extensible transform system
- Maintain async/await execution model

## Non-Goals

- Database or cloud storage backends (file-based only for v1)
- Visual workflow designer
- Distributed execution
- Binary file support

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WorkflowContext                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  │
│  │  store() │  │  load()  │  │transform()│  │   run()  │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └────┬─────┘  │
└───────┼─────────────┼──────────────┼─────────────┼─────────┘
        │             │              │             │
        ▼             ▼              ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                   File Storage Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ FileNaming   │  │ FileWriter   │  │  FileReader      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    File System                              │
│         {property}.{timestamp}.md files                     │
└─────────────────────────────────────────────────────────────┘

        Extensions:
┌──────────────────┐     ┌──────────────────┐
│   ITransform     │     │    ICommand      │
│  ┌────────────┐  │     │  ┌────────────┐  │
│  │ transform()│  │     │  │ execute()  │  │
│  └────────────┘  │     │  └────────────┘  │
└──────────────────┘     └──────────────────┘
```

## Key Design Decisions

### Decision 1: File-Based Storage

**Choice:** Use individual timestamped markdown files for each operation output

**Rationale:**
- Simple and transparent - users can inspect outputs easily
- No database dependencies
- Git-friendly for version control
- Easy to implement and debug

**Alternatives Considered:**
1. SQLite database - More complex, harder to inspect
2. Single JSON file - Doesn't scale, merge conflicts
3. Memory-only - Loses persistence and auditability

**Trade-offs:**
- (+) Simple, transparent, debuggable
- (+) No external dependencies
- (-) Large number of files for complex workflows
- (-) Limited query capabilities

**Mitigation:** Provide cleanup utilities, organize by directories, use clear naming

---

### Decision 2: Timestamp-Based File Naming

**Choice:** Use format `{property}.{timestamp}.md` for automatic file names

**Rationale:**
- Guarantees uniqueness without collision checks
- Natural chronological ordering
- Easy to identify when files were created
- Supports same property name multiple times

**Alternatives Considered:**
1. UUID-based: Less human-readable
2. Counter-based: Requires state management
3. Hash-based: Not chronological

**Trade-offs:**
- (+) No collision checking needed
- (+) Human-readable and sortable
- (+) Encodes creation time
- (-) Long file names with millisecond precision

---

### Decision 3: FileReference as Return Type

**Choice:** All operations (store, load, transform, run) return FileReference objects

**Rationale:**
- Consistent API - same type everywhere
- Enables chaining operations
- Lazy loading of content
- Can be passed to subsequent operations

**Alternatives Considered:**
1. Return content directly - Breaks chaining
2. Return file path strings - Less type-safe
3. Return mixed types - Inconsistent API

**Trade-offs:**
- (+) Consistent, chainable API
- (+) Type-safe references
- (+) Lazy loading optimization
- (-) Extra abstraction layer

---

### Decision 4: Transform Metadata in File

**Choice:** Store transform metadata as YAML frontmatter in output files

**Rationale:**
- Keeps metadata with content
- Standard markdown convention
- Parseable but human-readable
- Preserves transform history

**Alternatives Considered:**
1. Separate .meta files - File proliferation
2. JSON comments - Not standard markdown
3. Footer comments - Less standard

**Format:**
```markdown
---
transforms:
  - type: token-replacement
    tokens: { name: "World" }
  - type: regex-extract
    pattern: '\d+'
---
Original transformed content here
```

**Trade-offs:**
- (+) Self-contained files
- (+) Standard format
- (+) Human and machine readable
- (-) Slightly larger files
- (-) Requires YAML parser

---

### Decision 5: Interface-Based Extension

**Choice:** Define ITransform and ICommand interfaces for extensibility

**Rationale:**
- Clear contract for extensions
- Type-safe implementations
- No modification of core code
- Supports composition

**Interface Signatures:**
```typescript
interface ITransform {
  transform(
    content: string,
    references: FileReference[],
    context: WorkflowContext
  ): Promise<string>;
}

interface ICommand {
  execute(
    context: WorkflowContext,
    ...args: any[]
  ): Promise<FileReference>;
}
```

**Trade-offs:**
- (+) Clean extension points
- (+) Type-safe
- (+) Testable in isolation
- (-) Requires interface knowledge

---

### Decision 6: Asynchronous-First Design

**Choice:** All operations are asynchronous and return Promises

**Rationale:**
- File I/O is inherently async
- Enables parallel operations where possible
- Future-proof for network storage
- Consistent with modern Node.js patterns

**Trade-offs:**
- (+) Non-blocking operations
- (+) Can parallelize when safe
- (+) Future-proof
- (-) Requires async/await knowledge
- (-) More complex error handling

---

## Component Design

### WorkflowContext Class

**Responsibilities:**
- Provide store, load, transform, and run methods
- Manage output directory and configuration
- Coordinate with file storage layer
- Handle file reference creation

**Key Properties:**
```typescript
class WorkflowContext {
  private outputDir: string;
  private config: WorkflowConfig;
  private fileStorage: FileStorageService;
  
  async store(value: string, propertyName: string): Promise<FileReference>
  async load(filePath: string): Promise<FileReference>
  async transform(ref: FileReference, transforms: ITransform[]): Promise<FileReference>
  async run(command: ICommand, ...args: any[]): Promise<FileReference>
}
```

---

### FileReference Class

**Responsibilities:**
- Store file path and metadata
- Lazy load file content
- Cache loaded content
- Provide access methods

**Key Properties:**
```typescript
class FileReference {
  private filePath: string;
  private propertyName: string;
  private timestamp: Date;
  private cachedContent?: string;
  
  getPath(): string
  async getContent(): Promise<string>
  getMetadata(): FileMetadata
}
```

---

### FileStorageService

**Responsibilities:**
- Generate file names following convention
- Write files with proper encoding
- Read files with error handling
- Create directories as needed

**Key Methods:**
```typescript
class FileStorageService {
  generateFileName(property: string, suffix?: string): string
  async writeFile(fileName: string, content: string): Promise<string>
  async readFile(filePath: string): Promise<string>
  async ensureDirectory(dirPath: string): Promise<void>
}
```

---

## Data Flow Examples

### Example 1: Store and Transform Chain

```typescript
// 1. Store initial value
const ref1 = await context.store("Hello {{name}}", "template");
// Creates: template.20251017-143052-123.md

// 2. Create transform
const tokenTransform = new TokenReplacementTransform({ name: "World" });

// 3. Apply transform
const ref2 = await context.transform(ref1, [tokenTransform]);
// Creates: template.transform.20251017-143052-456.md
// Content: "Hello World"
// With metadata about token replacement

// 4. Use result in another operation
const finalRef = await context.load(ref2.getPath());
```

### Example 2: Command Execution with Context

```typescript
class ProcessDataCommand implements ICommand {
  async execute(context: WorkflowContext, inputRef: FileReference): Promise<FileReference> {
    // Load input
    const content = await inputRef.getContent();
    
    // Process
    const processed = content.toUpperCase();
    
    // Store result
    return await context.store(processed, "processed");
  }
}

// Usage
const input = await context.load("data.txt");
const result = await context.run(new ProcessDataCommand(), input);
```

---

## Error Handling Strategy

### File Not Found
- Throw descriptive error with file path
- Suggest checking directory
- Log to error file with context

### Transform Failure
- Catch in transform pipeline
- Write error file with failed transform details
- Include original content and transform metadata
- Continue or abort based on configuration

### Command Execution Error
- Catch in run method
- Wrap with command context
- Create .error file with full details
- Propagate to caller

---

## Performance Considerations

### File I/O Optimization
- Use buffered writes for large content
- Implement content caching in FileReference
- Batch directory creation checks
- Use streams for large files (future)

### Memory Management
- Lazy load file content
- Clear cached content when not needed
- Implement max file size limits
- Consider streaming for transforms (future)

---

## Security Considerations

### Path Traversal
- Sanitize property names
- Validate file paths are within output directory
- Use path.resolve to prevent directory traversal

### File System Access
- Limit to configured output directory
- Validate file names
- Check file size limits

### Content Injection
- Escape special characters in property names
- Validate transform inputs
- Sanitize regex patterns in transforms

---

## Testing Strategy

### Unit Tests
- FileReference creation and loading
- File name generation
- Transform implementations
- Context method isolation

### Integration Tests
- Store → Load → Transform chains
- Command execution with context
- Multiple transforms in sequence
- Error handling paths

### End-to-End Tests
- Complete workflows
- Real file system operations
- Cross-platform compatibility
- Performance benchmarks

---

## Migration Plan

Not applicable - this is a new capability with no existing implementation.

---

## Open Questions

1. **Transform Metadata Format**: Should we support multiple formats (YAML frontmatter, JSON, comments)?
   - **Recommendation:** Start with YAML frontmatter, make configurable later

2. **File Size Limits**: What should be the default maximum file size?
   - **Recommendation:** 10MB default, configurable via options

3. **Cleanup Strategy**: Should we provide automatic cleanup of old files?
   - **Recommendation:** No automatic cleanup in v1, provide utility tool

4. **Parallel Operations**: Should we support parallel transform application?
   - **Recommendation:** Sequential in v1, add parallel option in v2

5. **Storage Backends**: Should we design for pluggable storage?
   - **Recommendation:** File-only in v1, refactor for plugins in v2

---

## Future Enhancements

### Phase 2
- Streaming support for large files
- Parallel transform execution
- SQL-like querying of workflow outputs
- Cleanup and archival utilities

### Phase 3
- Pluggable storage backends
- Network/cloud storage support
- Workflow visualization
- Checkpoint and resume support

---

## References

- Original requirements: Issue description
- Related change: `add-cli-framework` for potential CLI integration
