---
title: "Configuration"
---

# Configuration

Customize Open Tasks CLI behavior through configuration files.

## Overview

Open Tasks CLI uses `.open-tasks/config.json` to configure output directories, file naming patterns, and other settings.

## Configuration File

### Location

```
.open-tasks/config.json
```

### Default Configuration

Created automatically by `open-tasks init`:

```json
{
  "outputDirectory": ".open-tasks/outputs",
  "tasksDirectory": ".open-tasks/tasks",
  "fileNamePattern": "{timestamp}-{token}",
  "timestampFormat": "YYYYMMDD-HHmmss-SSS",
  "defaultContext": "directory",
  "verbose": false
}
```

## Configuration Options

### outputDirectory

**Type**: `string`  
**Default**: `.open-tasks/outputs`

Base directory where command outputs are stored. Each task execution creates a timestamped subdirectory:

```
.open-tasks/outputs/
└── {timestamp}-{task-name}/
    └── output-files...
```

```json
{
  "outputDirectory": "./custom-outputs"
}
```

### tasksDirectory

**Type**: `string`  
**Default**: `.open-tasks/tasks`

Directory where custom task files are located.

```json
{
  "tasksDirectory": "./my-tasks"
}
```

### fileNamePattern

**Type**: `string`  
**Default**: `{timestamp}-{token}`

Pattern for naming output files.

**Available placeholders:**
- `{timestamp}` - Current timestamp
- `{token}` - Token name (if provided)
- `{id}` - UUID
- `{command}` - Command name

```json
{
  "fileNamePattern": "{command}-{timestamp}-{token}"
}
```

Examples:
- `{timestamp}-{token}` → `20251018-143022-456-mytoken.txt`
- `{token}-{id}` → `mytoken-uuid-123-456.txt`
- `{command}/{timestamp}` → `PowershellCommand/20251018-143022-456.txt`

### timestampFormat

**Type**: `string`  
**Default**: `YYYYMMDD-HHmmss-SSS`

Format for timestamps in filenames.

```json
{
  "timestampFormat": "YYYY-MM-DD_HH-mm-ss"
}
```

Common formats:
- `YYYYMMDD-HHmmss-SSS` → `20251018-143022-456`
- `YYYY-MM-DD_HH-mm-ss` → `2025-10-18_14-30-22`
- `YYYY-MM-DD` → `2025-10-18`
- `unix` → `1729263022456` (milliseconds since epoch)

### defaultContext

**Type**: `"memory" | "directory"`  
**Default**: `"directory"`

Default IWorkflowContext implementation.

```json
{
  "defaultContext": "directory"
}
```

**Options:**
- `directory` - Store outputs as files (production)
- `memory` - Store outputs in memory (testing)

### verbose

**Type**: `boolean`  
**Default**: `false`

Enable verbose logging.

```json
{
  "verbose": true
}
```

Can also be enabled via command line:
```bash
open-tasks my-task --verbose
```

### templates

**Type**: `object`  
**Default**: Built-in templates

Custom template configuration.

```json
{
  "templates": {
    "directory": "./custom-templates",
    "default": "my-template"
  }
}
```

## AI Configuration

### Claude AI

Create `.open-tasks/ai-config.json`:

```json
{
  "claude": {
    "apiKey": "your-api-key-here",
    "model": "claude-3-opus-20240229",
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

**Security**: Never commit API keys to version control. Use environment variables:

```json
{
  "claude": {
    "apiKey": "${CLAUDE_API_KEY}",
    "model": "claude-3-opus-20240229"
  }
}
```

Then set environment variable:
```bash
export CLAUDE_API_KEY="your-api-key-here"
```

### Other AI Providers

```json
{
  "openai": {
    "apiKey": "${OPENAI_API_KEY}",
    "model": "gpt-4",
    "maxTokens": 4096
  },
  "gemini": {
    "apiKey": "${GEMINI_API_KEY}",
    "model": "gemini-pro"
  }
}
```

## Environment Variables

Override configuration via environment variables:

```bash
# Output directory
export OPEN_TASKS_OUTPUT_DIR="./outputs"

# Verbose mode
export OPEN_TASKS_VERBOSE="true"

# Default context
export OPEN_TASKS_CONTEXT="memory"

# AI API keys
export CLAUDE_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
```

## Per-Task Configuration

Tasks can override configuration:

```typescript
export default class MyTask extends TaskHandler {
  static name = 'my-task';
  static config = {
    outputDirectory: './task-specific-outputs',
    verbose: true
  };

  async execute(args: string[], context: IWorkflowContext): Promise<TaskOutcome> {
    // Task implementation
  }
}
```

## Complete Example

```json
{
  "outputDirectory": ".open-tasks/outputs",
  "tasksDirectory": ".open-tasks/tasks",
  "fileNamePattern": "{command}/{timestamp}-{token}",
  "timestampFormat": "YYYY-MM-DD_HH-mm-ss-SSS",
  "defaultContext": "directory",
  "verbose": false,
  "templates": {
    "directory": "./templates",
    "default": "workflow"
  },
  "ai": {
    "claude": {
      "apiKey": "${CLAUDE_API_KEY}",
      "model": "claude-3-opus-20240229",
      "maxTokens": 4096,
      "temperature": 0.7
    }
  },
  "gitignore": [
    ".open-tasks/outputs/*",
    ".open-tasks/ai-config.json"
  ]
}
```

## .gitignore

Recommended `.gitignore` patterns:

```gitignore
# Open Tasks outputs
.open-tasks/outputs/

# AI configuration (contains API keys)
.open-tasks/ai-config.json

# Keep tasks directory (user code)
!.open-tasks/tasks/

# Keep main config
!.open-tasks/config.json
```

## Configuration Validation

Validate your configuration:

```bash
open-tasks validate-config
```

Output:
```
✓ Configuration valid
✓ Output directory exists: .open-tasks/outputs
✓ Tasks directory exists: .open-tasks/tasks
✓ File name pattern valid
✓ Timestamp format valid
✓ AI configuration valid
```

## Troubleshooting

### Configuration Not Found

```bash
Error: No configuration file found at .open-tasks/config.json
```

**Solution**: Run `open-tasks init` to create default configuration.

### Invalid JSON

```bash
Error: Failed to parse config.json: Unexpected token } at position 123
```

**Solution**: Validate JSON syntax using a linter or validator.

### Permission Issues

```bash
Error: Cannot write to output directory
```

**Solution**: Check directory permissions:
```bash
chmod 755 .open-tasks/outputs
```

### Environment Variable Not Found

```bash
Error: Environment variable CLAUDE_API_KEY not set
```

**Solution**: Set the environment variable:
```bash
export CLAUDE_API_KEY="your-key-here"
```

Or add to your shell profile (`.bashrc`, `.zshrc`, etc.):
```bash
echo 'export CLAUDE_API_KEY="your-key"' >> ~/.bashrc
source ~/.bashrc
```

## Best Practices

1. **Version control config.json** - But not ai-config.json
2. **Use environment variables** - For sensitive data
3. **Document custom settings** - Add comments (JSON5 supported)
4. **Validate after changes** - Run `open-tasks validate-config`
5. **Keep defaults when possible** - Override only what's needed
6. **Organize outputs** - Use structured fileNamePattern
7. **Regular cleanup** - Manage `.open-tasks/outputs/` size

## Next Steps

- **[[System Commands]]** - Initialize and configure projects
- **[[Building Tasks]]** - Create custom workflows
- **[[Command Library]]** - Use pre-built commands
- **[[Installation]]** - Set up Open Tasks CLI
