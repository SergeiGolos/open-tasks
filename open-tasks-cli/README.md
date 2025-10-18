# open-tasks-cli

A powerful CLI tool for executing tasks with explicit workflow context, enabling seamless command chaining, reference management, and extensibility.

## Features

- 🔗 **Reference Management**: Store command outputs and pass them between commands using tokens or UUIDs
- 📝 **Built-in Commands**: Store, load, replace, extract, PowerShell execution, and AI CLI integration
- 🔌 **Extensible**: Add custom commands in `.open-tasks/commands/` that are auto-discovered
- 🌊 **Workflow Context**: Internal API for orchestrating multi-step workflows
- 📁 **File Output**: Automatically saves command outputs with timestamps
- 🎨 **Formatted Output**: Color-coded terminal output with progress indicators
- ⚡ **TypeScript**: Fully typed for excellent IDE support

## Installation

### Global Installation (Recommended)

```bash
npm install -g open-tasks-cli
```

### Local Installation

```bash
npm install open-tasks-cli
npx open-tasks --help
```

### From Source

```bash
git clone <repository-url>
cd open-tasks-cli
npm install
npm run build
npm link
```

## Quick Start

### 1. Initialize a Project

```bash
# Create .open-tasks directory with default configuration
open-tasks init
```

### 2. Store a Value

```bash
# Store a simple value
open-tasks store "Hello World"

# Store with a named token
open-tasks store "Hello World" --token greeting
```

### 3. Use References in Commands

```bash
# Store and replace in template
open-tasks store "World" --token name
open-tasks replace "Hello {{name}}!" --ref name
```

### 4. Chain Commands

```bash
# Extract email from text
open-tasks store "Contact: support@example.com" --token contact
open-tasks extract "[a-z]+@[a-z.]+" --ref contact --token email
```

## Built-in Commands

### `store` - Store Values

Store a value and create a reference for use in other commands.

```bash
open-tasks store <value> [--token <name>]
```

**Examples:**
```bash
# Store a simple string
open-tasks store "Hello World"

# Store with a named token
open-tasks store "API response data" --token api-result

# Store multi-line content
open-tasks store "Line 1
Line 2
Line 3" --token multiline
```

**Output:**
- Creates a timestamped file in `.open-tasks/outputs/`
- Returns a reference handle with UUID and optional token
- File format: `YYYYMMDDTHHMMSS-<token>.txt`

---

### `load` - Load Files

Load content from a file and create a reference.

```bash
open-tasks load <filepath> [--token <name>]
```

**Examples:**
```bash
# Load a text file
open-tasks load ./data.txt

# Load with token for later reference
open-tasks load ./template.html --token template

# Load JSON file
open-tasks load ./config.json --token config
```

---

### `replace` - Template Substitution

Replace tokens in a template string with referenced values.

```bash
open-tasks replace <template> --ref <token1> [--ref <token2> ...]
```

**Examples:**
```bash
# Simple replacement
open-tasks store "World" --token name
open-tasks replace "Hello {{name}}!" --ref name

# Multiple replacements
open-tasks store "John" --token first
open-tasks store "Doe" --token last
open-tasks replace "Name: {{first}} {{last}}" --ref first --ref last
```

**Token Format:**
- Use `{{token}}` in templates
- Tokens are case-sensitive
- Unreplaced tokens remain as-is (with warning)

---

### `extract` - Regex Extraction

Extract text from content using regular expressions.

```bash
open-tasks extract <pattern> --ref <input> [--all] [--token <name>]
```

**Examples:**
```bash
# Extract first number
open-tasks store "Price: $42.99" --token price
open-tasks extract "\$([0-9.]+)" --ref price

# Extract all emails
open-tasks load ./contacts.txt --token contacts
open-tasks extract "[a-z]+@[a-z.]+" --ref contacts --all

# Extract with capture groups
open-tasks store "Name: John Doe" --token name
open-tasks extract "Name: ([A-Z][a-z]+) ([A-Z][a-z]+)" --ref name
```

**Flags:**
- `--all`: Extract all matches (newline-separated)
- Without `--all`: Extract first match only
- Capture groups: Returns captured groups, not full match

---

### `powershell` - Execute PowerShell

Execute PowerShell scripts and capture output.

```bash
open-tasks powershell <script> [--ref <token1> ...] [--token <name>]
```

**Examples:**
```bash
# Simple command
open-tasks powershell "Get-Date"

# With reference substitution
open-tasks store "C:\Users" --token path
open-tasks powershell "Get-ChildItem {{path}}" --ref path

# Capture output for later use
open-tasks powershell "Get-Process | Select-Object -First 5" --token processes
```

---

### `ai-cli` - AI CLI Integration

Execute AI CLI commands with context from references.

```bash
open-tasks ai-cli <prompt> [--ref <context1> ...] [--token <name>]
```

**Configuration:** Create `.open-tasks/ai-config.json`:
```json
{
  "command": "gh copilot suggest",
  "contextFlag": "-t",
  "timeout": 30000
}
```

**Examples:**
```bash
# Simple AI query
open-tasks ai-cli "How do I list files in PowerShell?"

# With context files
open-tasks load ./code.ts --token code
open-tasks ai-cli "Explain this code" --ref code
```

---

### `init` - Initialize Project

Create `.open-tasks` directory structure and configuration.

```bash
open-tasks init
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
open-tasks create <command-name>
```

**Example:**
```bash
open-tasks create validate-email
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
import { CommandHandler, ExecutionContext, ReferenceHandle } from 'open-tasks-cli';

export default class GreetCommand extends CommandHandler {
  name = 'greet';
  description = 'Greet someone by name';
  examples = [
    'open-tasks greet --ref name',
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
open-tasks store "Alice" --token name
open-tasks greet --ref name
# Output: Hello, Alice!
```

## Workflow Examples

### Example 1: Process API Response

```bash
# Fetch API data
open-tasks powershell "Invoke-RestMethod 'https://api.example.com/data'" --token api-data

# Extract specific field
open-tasks extract '"email":"([^"]+)"' --ref api-data --token email

# Use in template
open-tasks replace "Contact email: {{email}}" --ref email
```

### Example 2: Code Analysis

```bash
# Load source code
open-tasks load ./app.ts --token source

# Ask AI for review
open-tasks ai-cli "Review this code for security issues" --ref source --token review
```

### Example 3: Data Transformation Pipeline

```bash
# Load raw data
open-tasks load ./data.csv --token raw

# Extract specific columns
open-tasks extract "^([^,]+)," --ref raw --all --token names

# Generate report template
open-tasks replace "Names found:\n{{names}}" --ref names --token report
```

### Example 4: Multi-file Processing

```bash
# Load multiple files
open-tasks load ./file1.txt --token f1
open-tasks load ./file2.txt --token f2
open-tasks load ./file3.txt --token f3

# Combine with template
open-tasks replace "File 1: {{f1}}\nFile 2: {{f2}}\nFile 3: {{f3}}" \
  --ref f1 --ref f2 --ref f3 --token combined
```

## Reference Management

### Reference Types

1. **UUID References**: Automatically generated unique identifiers
2. **Token References**: User-defined named references

### Reference Lifetime

- References exist in memory during CLI execution
- Output files persist in `.open-tasks/outputs/`
- References are NOT preserved across CLI invocations
- Use files for persistent storage between runs

### File Naming Convention

```
YYYYMMDDTHHMMSS-<token|uuid>.txt
```

Examples:
- `20251018T143052-greeting.txt`
- `20251018T143053-a4f7e2d1.txt`

## Troubleshooting

### Command Not Found

```bash
# Verify installation
npm list -g open-tasks-cli

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
open-tasks store "data" --token mydata

# Later: load from file
open-tasks load .open-tasks/outputs/YYYYMMDDTHHMMSS-mydata.txt --token mydata
```

### AI CLI Configuration Missing

```bash
# Create configuration
echo '{"command":"gh copilot suggest","contextFlag":"-t","timeout":30000}' > .open-tasks/ai-config.json

# Verify
open-tasks ai-cli "test prompt"
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
  workflowContext: DirectoryOutputContext;
  config: Record<string, any>;
}
```

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

- **Issues**: Report bugs and request features on GitHub Issues
- **Documentation**: Full documentation in `/docs` directory

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
