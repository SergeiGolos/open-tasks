
### IWorkflowContext

```typescript
interface IWorkflowContext {
  // Store a value and create a file reference
  store(value: string, transforms: IMemoryDecorator[] = []): Promise<MemoryRef>;
      
  // looks at the MemoryRef it has created in the current context and matches return the value in the memory reference with the token.  in the case where multiple reference match the token name, use the reference that was created last.
  token(name: string): string | undefined
  
  // Execute a command implementation
  run(command: ICommand): Promise<MemoryRef[]>;  
}
```

#### Examples

- InMemoryWorkflowContext - the values are stored in memory only by file name lookup in a `dictionary<string, string>` implementation. 
- DirectoryOutputContext - create a timestamp base directory in `.open-tasks/output/{timestamp-dir}` all the memory references are saved to the directory.
- Future state RemoteOutputContext that can point to s3 buckets

### ICommand

```typescript

/**
 * ICommand - Interface for command implementations
 * Used with context.run()
 */
interface ICommand {
  /**
   * Execute the command with the workflow context
   * @param context - WorkflowContext for accessing Context API
   * @param args - Additional arguments passed to the command
   * @returns Promise resolving to MemoryRef
   */
  execute(context: WorkflowContext): Promise<MemoryRef[]>;
}
```

#### Examples

- Powershell - can be given arguments to build a command to run in the powershell terminal.
- Curl - can execute the curl command and dump the output into a memory location (a superset function of powershell with special constructor arguments.
- Claude / Gemini / Codex - comamnds to excute the CLI tools that can take promotes the construtor arguments should support configuration object plus a collection of MemoryRef[] obejcts that it will use to build the prompt from
- Any CLI tools can have a custom ICommand Wrapper build for it.  The goal is to hide the complexity and differences of setting up a command behind the constructor for the class and the execute command simply works.. 
- RegEx command  that can extract a regex match
- Tokenize command that given some file input will create the same input but with the tokens it matches in the context with the token value.

### MemoryRef

```typescript
/**
 * MemoryRef - Result of Context API operations
 * Represents a stored file with metadata
 */
type MemoryRef = {
  
  /**
   * Absolute path to the file
   */   
  id: string 
  
  /**
   * Value match for token replacement
   */
  token: string;
  
  /**
   * Absolute path to the file
   */
  fileName: string;  
}

```

### IMemoryDecorator

```typescript

/**
 * IMemoryDecorator - Interface for decorating the memory ref
 */
interface IMemoryDecorator {
  /**
   * decorate the command with applied when storing saving the ref.
   */
  decorate(source: MemoryRef): MemoryRef;
}

```

These are run before the store command saves the content, allowing the transformation to drive the way we construct the name.   When the ICommand  consumes the context.store command, it will apply the correct decorators that make sense for how the reference should be created.
#### Examples

- TimestampDecorator - will prepend the date time stamp on the filename of the Ref
- TokenDecorator - will set the token to some value.
- SetNameDecorator - will set the filename for the memory ref
- PrependNameDecorator - will take the existing name and prepend the value this decorator is configured with.

### TaskHandler

```typescript
abstract class TaskHandler {  //previously known as Command handler (rename everywhere)
  /**
   * Execute the Task as defined in the exceute class.
   * @param args - Positional arguments passed to the command from the CMD   * 
   * @param context - Execution context with shared resources
   * @returns Promise resolving to a ReferenceHandle
   */
  abstract execute(
    args: string[],    
    context: IWorkflowContext
  ): Promise<TaskOutcome>;

  /**
   * The Tesk name, used as the verb in the call to the open-tasks cli command line.
   */
  static name: string;
  
  /**
   * Command description for help output (optional)
   */
  static description?: string;

  /**
   * Usage examples for help output (optional)
   */
  static examples?: string[];
}

/**
 * TaskOutcome - Result of CLI command execution
 */
type TaskOutcome = {
  /**
   * Unique identifier (user token or auto-generated UUID)
   */
  id: string;
  
  /**
   * the taks that was run.
   */
  name: string;  
    
  /**
   * a collection of command generated logs.
   */  
  logs: TaskLog[];
  
  /**
   * a collection of errors that may have been caught, if this is not empyt the Task has failed.
   */  
  errors: string[]
}

type TaskLog = 
{
	... MemoryRef // everythin on a mem ref that is being tracked.	
	// and for process tracking.
	
	command:  string // type of command being run
	args: MemoryRef[] // the args passed to the command 
	start: DateTime // start of the ICommand
	end: DateTime	
}
```
