# open-tasks

A powerful CLI tool for executing tasks with explicit workflow context, enabling seamless command chaining, reference management, and extensibility.

## 📚 Documentation

For comprehensive documentation, visit the [Open Tasks Wiki](../open-tasks-wiki/index.md):

- **[Quick Start](../open-tasks-wiki/Quick-Start.md)** - 5-minute tutorial
- **[Core Concepts](../open-tasks-wiki/Core-Concepts.md)** - Tasks, Commands, IWorkflowContext, MemoryRef
- **[Building Tasks](../open-tasks-wiki/Building-Tasks.md)** - Create custom workflows
- **[Command Library](../open-tasks-wiki/Command-Library.md)** - Pre-built commands reference
- **[Managing Context](../open-tasks-wiki/Managing-Context.md)** - MemoryRef and decorators
- **[Architecture](../open-tasks-wiki/Architecture.md)** - System design
- **[Contributing](../open-tasks-wiki/Contributing.md)** - Development guide

## Features

- 🔗 **Reference Management**: Store command outputs as MemoryRef objects and pass them between commands using tokens or UUIDs
- 📝 **Built-in Commands**: Store, load, replace, extract, PowerShell execution, and AI CLI integration
- 🔌 **Extensible**: Add custom commands in `.open-tasks/commands/` that are auto-discovered
- 🌊 **Workflow Context**: Internal `IWorkflowContext` API for orchestrating multi-step workflows
- 📁 **File Output**: Automatically saves outputs to `.open-tasks/outputs/{timestamp}-{command}/` with per-execution isolation
- 🎨 **Output Control**: Three verbosity levels (quiet, summary, verbose) with flexible routing (screen, logs, custom files)
- 🎯 **Decorators**: Transform MemoryRef objects before file creation (tokens, filenames, metadata)
- ⚡ **TypeScript**: Fully typed for excellent IDE support

## Installation

### Global Installation (Recommended)

```bash
npm install -g @bitcobblers/open-tasks
```

### Local Installation

```bash
npm install @bitcobblers/open-tasks
npx ot --help
```

### From Source

```bash
git clone <repository-url>
cd open-tasks
npm install
npm run build
npm link
```

## Quick Start

### 1. Initialize a Project

```bash
# Create .open-tasks directory with default configuration
ot init
```

### 2. Store a Value

```bash
# Store a simple value
ot store "Hello World"

# Store with a named token
ot store "Hello World" --token greeting
```

### 3. Use References in Commands

```bash
# Store and replace in template
ot store "World" --token name
ot replace "Hello {{name}}!" --ref name
```

### 4. Chain Commands

```bash
# Extract email from text
ot store "Contact: support@example.com" --token contact
ot extract "[a-z]+@[a-z.]+" --ref contact --token email
```

## Output Control

The CLI provides flexible control over command output verbosity and routing.

### Verbosity Levels

Control how much detail commands output:

```bash
# Quiet mode - minimal output (good for scripts)
ot store "data" --quiet
✓ store completed in 45ms

# Summary mode - default, clean readable output
ot store "data"
✓ store completed in 45ms
📁 Saved to: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference: @mytoken

# Verbose mode - detailed information (good for debugging)
ot store "data" --verbose
(shows processing details, file info, metadata)
```

**Flags:**
- `--quiet` or `-q` - Minimal single-line output
- `--summary` or `-s` - Default, brief formatted summary
- `--verbose` or `-v` - Detailed sections and metadata

**Note:** Individual commands control how they output (progressively or all at once). Some commands may display real-time progress in verbose mode.

### Output Targets

Control where command output is written:

```bash
# Both (default) - output to screen AND log files
ot store "data"

# Screen only - no log files created
ot store "data" --screen-only

# Log only - silent terminal, writes to files
ot store "data" --log-only

# Custom file - write to specific path
ot store "data" --file /path/to/output.log
```

**Flags:**
- `--both` - Output to screen and logs (default)
- `--screen-only` - Terminal only, no files
- `--log-only` - Files only, silent terminal
- `--file <path>` - Custom output file path

### Combining Flags

Verbosity and output targets work together:

```bash
# Quiet output, no files (fastest)
ot store "data" --quiet --screen-only

# Verbose logs, clean terminal
ot store "data" --verbose --log-only

# Verbose output to custom file
ot long-operation --verbose --file progress.log
```

### Documentation

- **[Verbosity Levels Guide](docs/Verbosity-Levels.md)** - Detailed guide to each level
- **[Output Targets Guide](docs/Output-Targets.md)** - Output routing explained
- **[Output Control API](docs/Output-Control-API.md)** - API reference for developers

## Built-in Commands

### `store` - Store Values

Store a value and create a reference for use in other commands.

```bash
ot store <value> [--token <name>] [verbosity flags] [output flags]
```

**Examples:**
```bash
# Store a simple string
ot store "Hello World"

# Store with a named token, quiet mode
ot store "API response data" --token api-result --quiet

# Store with verbose output
ot store "data" --token mydata --verbose

# Store multi-line content
ot store "Line 1
Line 2
Line 3" --token multiline
```

**Output:**
- Creates a file in `.open-tasks/outputs/{timestamp}-store/`
- Returns a MemoryRef wrapped in a ReferenceHandle with UUID and optional token
- File format: `{timestamp}-{token|uuid}.txt`
- Each command execution gets its own timestamped output directory

---

### `load` - Load Files

Load content from a file and create a reference.

```bash
ot load <filepath> [--token <name>]
```

**Examples:**
```bash
# Load a text file
ot load ./data.txt

# Load with token for later reference
ot load ./template.html --token template

# Load JSON file
ot load ./config.json --token config
```

---

### `replace` - Template Substitution

Replace tokens in a template string with referenced values.

```bash
ot replace <template> --ref <token1> [--ref <token2> ...]
```

**Examples:**
```bash
# Simple replacement
ot store "World" --token name
ot replace "Hello {{name}}!" --ref name

# Multiple replacements
ot store "John" --token first
ot store "Doe" --token last
ot replace "Name: {{first}} {{last}}" --ref first --ref last
```

**Token Format:**
- Use `{{token}}` in templates
- Tokens are case-sensitive
- Unreplaced tokens remain as-is (with warning)

---

### `extract` - Regex Extraction

Extract text from content using regular expressions.

```bash
ot extract <pattern> --ref <input> [--all] [--token <name>]
```

**Examples:**
```bash
# Extract first number
ot store "Price: $42.99" --token price
ot extract "\$([0-9.]+)" --ref price

# Extract all emails
ot load ./contacts.txt --token contacts
ot extract "[a-z]+@[a-z.]+" --ref contacts --all

# Extract with capture groups
ot store "Name: John Doe" --token name
ot extract "Name: ([A-Z][a-z]+) ([A-Z][a-z]+)" --ref name
```

**Flags:**
- `--all`: Extract all matches (newline-separated)
- Without `--all`: Extract first match only
- Capture groups: Returns captured groups, not full match

---

### `powershell` - Execute PowerShell

Execute PowerShell scripts and capture output.

```bash
ot powershell <script> [--ref <token1> ...] [--token <name>]
```

**Examples:**
```bash
# Simple command
ot powershell "Get-Date"

# With reference substitution
ot store "C:\Users" --token path
ot powershell "Get-ChildItem {{path}}" --ref path

# Capture output for later use
ot powershell "Get-Process | Select-Object -First 5" --token processes
```

---

### `ai-cli` - AI CLI Integration

Execute AI CLI commands with context from references.

```bash
ot ai-cli <prompt> [--ref <context1> ...] [--token <name>]
```

**Configuration:** Create `.open-tasks/ai-config.json`:

```json
{
  "command": "gh copilot suggest",
  "contextFlag": "-t",
  "timeout": 30000
}
```

**Configuration Options:**

- `command` (required) - The AI CLI command to execute
- `contextFlag` (optional) - Flag used to pass context files (default: `-t`)
- `timeout` (optional) - Command timeout in milliseconds (default: 30000)

**Supported AI CLIs:**

#### GitHub Copilot CLI

```json
{
  "command": "gh copilot suggest",
  "contextFlag": "-t",
  "timeout": 30000
}
```

Usage:
```bash
open-tasks ai-cli "How do I parse JSON in PowerShell?"
```

#### OpenAI CLI (unofficial)

```json
{
  "command": "openai-cli",
  "contextFlag": "--context",
  "timeout": 60000
}
```

#### Custom AI Tool

```json
{
  "command": "python /path/to/ai-tool.py",
  "contextFlag": "--file",
  "timeout": 45000
}
```

**Examples:**

```bash
# Simple AI query
ot ai-cli "How do I list files in PowerShell?"

# With context from file
ot load ./code.ts --token code
ot ai-cli "Explain this code" --ref code

# With multiple context files
ot load ./api.ts --token api
ot load ./types.ts --token types
ot ai-cli "How do these files work together?" --ref api --ref types

# Save AI response for later use
ot ai-cli "Suggest improvements" --ref code --token suggestions
```

**Context File Passing:**

When you use `--ref` flags, the AI CLI receives context files:

```bash
# This command:
ot ai-cli "Explain this" --ref code

# Executes (approximately):
gh copilot suggest "Explain this" -t /path/to/code-file.txt
```

**Error Handling:**

- **Missing Configuration:** If `.open-tasks/ai-config.json` doesn't exist, command fails with helpful error
- **Timeout:** If AI CLI doesn't respond within timeout, command fails
- **Non-zero Exit Code:** If AI CLI returns error, it's captured and displayed

**Troubleshooting:**

```bash
# Verify configuration exists
cat .open-tasks/ai-config.json

# Test AI CLI directly
gh copilot suggest "test prompt"

# Check timeout setting if AI CLI is slow
# Increase timeout in ai-config.json:
{ "timeout": 60000 }  # 60 seconds
```

---

### `init` - Initialize Project

Create `.open-tasks` directory structure and configuration.

```bash
ot init
```

**Creates:**
- `.open-tasks/` directory
- `.open-tasks/config.json` with defaults
- `.open-tasks/commands/` for custom commands
- `.open-tasks/outputs/` for command outputs

---

### `create` - Scaffold Custom Command

Create a new custom command template.

```bash
ot create <command-name>
```

**Example:**
```bash
ot create validate-email
# Creates: .open-tasks/commands/validate-email.ts
```

## Configuration

### Project Configuration

Create `.open-tasks/config.json`:

```json
{
  "outputDir": ".open-tasks/outputs",
  "customCommandsDir": ".open-tasks/commands"
}
```

### User Configuration

Create `~/.open-tasks/config.json` for global defaults:

```json
{
  "outputDir": ".open-tasks/outputs",
  "defaultVerbosity": "normal"
}
```

**Configuration Precedence:**
1. Project config (`.open-tasks/config.json`)
2. User config (`~/.open-tasks/config.json`)
3. Built-in defaults

## Custom Commands

Extend the CLI by creating custom commands in `.open-tasks/commands/`.

### Basic Example

Create `.open-tasks/commands/greet.ts`:

```typescript
import { CommandHandler, ExecutionContext, ReferenceHandle } from '@bitcobblers/open-tasks';

export default class GreetCommand extends CommandHandler {
  name = 'greet';
  description = 'Greet someone by name';
  examples = [
    'ot greet --ref name',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const nameRef = Array.from(refs.values())[0];
    const name = nameRef ? nameRef.content : 'World';
    const greeting = `Hello, ${name}!`;

    // Store result using workflow context
    const memoryRef = await context.workflowContext.store(greeting, []);

    // Create reference handle
    return context.referenceManager.createReference(
      memoryRef.id,
      greeting,
      undefined,
      memoryRef.fileName
    );
  }
}
```

**Usage:**
```bash
ot store "Alice" --token name
ot greet --ref name
# Output: Hello, Alice!
```

## Workflow Examples

### Example 1: Process API Response

```bash
# Fetch API data
ot powershell "Invoke-RestMethod 'https://api.example.com/data'" --token api-data

# Extract specific field
ot extract '"email":"([^"]+)"' --ref api-data --token email

# Use in template
ot replace "Contact email: {{email}}" --ref email
```

### Example 2: Code Analysis

```bash
# Load source code
ot load ./app.ts --token source

# Ask AI for review
ot ai-cli "Review this code for security issues" --ref source --token review
```

### Example 3: Data Transformation Pipeline

```bash
# Load raw data
ot load ./data.csv --token raw

# Extract specific columns
ot extract "^([^,]+)," --ref raw --all --token names

# Generate report template
ot replace "Names found:\n{{names}}" --ref names --token report
```

### Example 4: Multi-file Processing

```bash
# Load multiple files
ot load ./file1.txt --token f1
ot load ./file2.txt --token f2
ot load ./file3.txt --token f3

# Combine with template
ot replace "File 1: {{f1}}\nFile 2: {{f2}}\nFile 3: {{f3}}" \
  --ref f1 --ref f2 --ref f3 --token combined
```

### Example 5: Log Analysis

```bash
# Load log file
ot load ./app.log --token logs

# Extract error messages
ot extract "ERROR: (.+)" --ref logs --all --token errors

# Extract timestamps of errors
ot extract "(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})" --ref errors --all --token timestamps

# Generate summary
ot replace "Found errors at:\n{{timestamps}}" --ref timestamps --token summary
```

### Example 6: Environment Configuration

```bash
# Load template config
ot load ./config.template.json --token template

# Replace environment-specific values
ot replace "{{template}}" --ref template \
  | replace "{{DATABASE_URL}}" "postgres://localhost/prod" --token step1 \
  | replace "{{API_KEY}}" "secret-key-123" --token config

# Output: .open-tasks/outputs/{timestamp}-replace/config.txt
```

### Example 7: Documentation Generation

```bash
# Extract function signatures from code
ot load ./src/api.ts --token source
ot extract "export function ([a-zA-Z]+)\([^)]*\)" --ref source --all --token functions

# Generate documentation stub
ot replace "# API Documentation\n\nFunctions:\n{{functions}}" --ref functions --token docs

# Output: .open-tasks/outputs/{timestamp}-replace/docs.txt
```

### Example 8: Data Validation Pipeline

```bash
# Load data file
ot load ./users.csv --token users

# Extract email column
ot extract ",[^,]+@[^,]+," --ref users --all --token emails

# Validate email format (custom command)
ot validate-emails --ref emails --token validated

# Generate report
ot replace "Validated {{validated}}" --ref validated --token report
```

### Example 9: Build Automation

```bash
# Get current version from package.json
ot load ./package.json --token package
ot extract '"version": "([^"]+)"' --ref package --token version

# Update changelog
ot load ./CHANGELOG.md --token changelog
ot replace "## [{{version}}]\n\n- New features\n\n{{changelog}}" \
  --ref version --ref changelog --token updated-changelog

# Generate release notes
ot replace "Release {{version}}" --ref version --token release-notes
```

### Example 10: Code Refactoring Helper

```bash
# Load source file
ot load ./legacy-code.js --token source

# Ask AI to suggest refactoring
ot ai-cli "Suggest modern ES6 refactoring for this code" --ref source --token suggestions

# Extract specific pattern to replace
ot extract "var ([a-zA-Z]+) = " --ref source --all --token var-declarations

# Generate replacement script
ot replace "Replace these var declarations:\n{{var-declarations}}" \
  --ref var-declarations --token refactor-plan
```

## Reference Management

### Reference Types

1. **UUID References**: Automatically generated unique identifiers
2. **Token References**: User-defined named references

### Reference Lifetime

- References exist in memory during CLI execution
- Output files persist in `.open-tasks/outputs/{timestamp}-{command}/`
- References are NOT preserved across CLI invocations
- Use files for persistent storage between runs

### Output Directory Structure

Each command execution creates an isolated timestamped directory:

```
.open-tasks/
  outputs/
    20250118T143052-store/
      20250118T143052-greeting.txt
    20250118T143105-replace/
      20250118T143105-result.txt
    20250118T143120-extract/
      20250118T143120-emails.txt
```

**Benefits:**
- No file naming conflicts between executions
- Easy to track command history
- Clean separation of outputs from different workflow steps
- Simplifies debugging (each execution's files are isolated)

## Troubleshooting

### Command Not Found

```bash
# Verify installation
npm list -g @bitcobblers/open-tasks

# Re-link if needed
npm link
```

### Custom Commands Not Loading

```bash
# Check directory structure
ls .open-tasks/commands/

# Verify file is exported as default
# ✓ export default class MyCommand extends CommandHandler
# ✗ export class MyCommand extends CommandHandler
```

### Reference Not Found

References are ephemeral - they only exist during the current CLI session. To persist data:

```bash
# Store to file first
ot store "data" --token mydata

# Later: load from file
ot load .open-tasks/outputs/YYYYMMDDTHHMMSS-mydata.txt --token mydata
```

### AI CLI Configuration Missing

```bash
# Create configuration
echo '{"command":"gh copilot suggest","contextFlag":"-t","timeout":30000}' > .open-tasks/ai-config.json

# Verify
ot ai-cli "test prompt"
```

## Development

### Building from Source

```bash
npm install
npm run build
```

### Running Tests

```bash
npm test              # Watch mode
npm run test:coverage # With coverage
```

### Linting and Formatting

```bash
npm run lint
npm run format
```

## API Documentation

### CommandHandler Interface

```typescript
abstract class CommandHandler {
  abstract name: string;
  abstract description: string;
  abstract examples: string[];
  
  abstract execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle>;
}
```

### ExecutionContext

```typescript
interface ExecutionContext {
  cwd: string;
  outputDir: string;
  referenceManager: ReferenceManager;
  outputHandler: OutputHandler;
  workflowContext: DirectoryOutputContext; // Implements IWorkflowContext
  config: Record<string, any>;
}
```

### IWorkflowContext

The internal workflow processing API:

```typescript
interface IWorkflowContext {
  // Create MemoryRef from content
  store(content: any, decorators: IMemoryDecorator[]): Promise<MemoryRef>;
  
  // Load MemoryRef from file
  load(filePath: string, decorators: IMemoryDecorator[]): Promise<MemoryRef>;
  
  // Apply transformation to MemoryRef
  transform(ref: MemoryRef, transformer: ITransformer): Promise<MemoryRef>;
}
```

### IMemoryDecorator

Transform MemoryRef objects **before** file creation:

```typescript
interface IMemoryDecorator {
  decorate(ref: MemoryRef): Promise<MemoryRef>;
}
```

**Built-in Decorators:**
- `TokenDecorator` - Assign a named token
- `FileNameDecorator` - Set custom filename
- `TimestampedFileNameDecorator` - Add timestamp prefix
- `MetadataDecorator` - Add custom metadata

**Example:**
```typescript
import { TokenDecorator, FileNameDecorator } from '@bitcobblers/open-tasks';

// Decorators run BEFORE file is written
const ref = await context.workflowContext.store(
  "Hello World",
  [
    new TokenDecorator("greeting"),
    new FileNameDecorator("message.txt")
  ]
);
// File is written to: .open-tasks/outputs/{timestamp}-store/message.txt
```

See [Managing Context](../open-tasks-wiki/Managing-Context.md) for complete decorator documentation.

### ReferenceHandle

```typescript
interface ReferenceHandle {
  id: string;
  token?: string;
  content: any;
  timestamp: Date;
  outputFile?: string;
}
```

## Requirements

- Node.js >= 18.0.0
- PowerShell (for `powershell` command)
- AI CLI tool (for `ai-cli` command, e.g., GitHub Copilot CLI)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: [Open Tasks Wiki](../open-tasks-wiki/index.md)
- **Issues**: Report bugs and request features on GitHub Issues
- **Developer Guide**: [Contributing](../open-tasks-wiki/Contributing.md)

## Roadmap

- [ ] Shell integration (bash, zsh completion)
- [ ] Plugin system for third-party extensions
- [ ] Web UI for workflow visualization
- [ ] Docker integration commands
- [ ] Git workflow commands

## Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [Ora](https://github.com/sindresorhus/ora) - Progress indicators
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vitest](https://vitest.dev/) - Testing framework
