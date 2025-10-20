# Open Tasks Configuration Schemas

This directory contains JSON schemas for validating `.config.json` files used by the Open Tasks CLI.

## Available Schemas

### `config.schema.json`

Main configuration schema for Open Tasks, including:
- Output directory settings
- Custom command directories
- Timestamp formatting
- Agent CLI tool configurations

## Using the Schema

Add the schema reference to your `.config.json` file for IDE autocomplete and validation:

```json
{
  "$schema": "../schemas/config.schema.json",
  "outputDir": ".open-tasks/logs",
  "agents": [
    {
      "name": "my-agent",
      "type": "gemini",
      "timeout": 300000,
      "config": {
        "model": "gemini-2.0-flash-exp"
      }
    }
  ]
}
```

## Schema Structure

The schema validates:

1. **General Settings**
   - `outputDir`: Output directory path
   - `customCommandsDir`: Array of custom command directories
   - `timestampFormat`: Format string for timestamps
   - `defaultFileExtension`: Default file extension
   - `colors`: Enable/disable colored output

2. **Agent Configurations** (`agents` array)
   - Required fields: `name`, `type`, `config`
   - Optional fields: `workingDirectory`, `timeout`
   - Agent types: `gemini`, `claude`, `copilot`, `aider`, `qwen`, `llm`

3. **Tool-Specific Configs**
   - Each agent type has its own configuration schema
   - Models, parameters, and options are validated per-tool
   - See `AGENT_CONFIG_LOADING.md` for detailed options

## Supported Agent Types

| Type | Description | Config Options |
|------|-------------|----------------|
| `gemini` | Google Gemini CLI | model, contextFiles, enableSearch, apiKey |
| `claude` | Anthropic Claude Code CLI | model, allowAllTools, enableThinking |
| `copilot` | GitHub Copilot CLI | model, allowAllTools |
| `aider` | Aider coding assistant | files, noAutoCommits, model |
| `qwen` | Qwen Code CLI | enablePlan, model |
| `llm` | llm CLI tool | model, temperature, system |

## Validation

VS Code and other editors will automatically validate your config files against these schemas if you include the `$schema` property.

For manual validation, you can use tools like:
- `ajv-cli` - Command-line JSON schema validator
- Online validators like jsonschemavalidator.net

## See Also

- [Agent Configuration Loading Guide](../docs/AGENT_CONFIG_LOADING.md)
- [Agent Commands Documentation](../docs/AGENT_COMMANDS.md)
- [Example Configuration](../examples/.config.json)
