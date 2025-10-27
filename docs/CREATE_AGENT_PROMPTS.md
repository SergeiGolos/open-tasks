# Using Saved Prompts with create-agent

The `create-agent` command now saves all prompts to files for reference, debugging, and reuse.

## Generated Prompt Files

When you run `create-agent`, it creates these files in `.open-tasks/`:

```
.open-tasks/
├── <task-name>.md                           # Task specification
├── <task-name>.ts                           # Generated TypeScript code
├── <task-name>.planning-prompt.txt          # Prompt used for planning phase
└── <task-name>.implementation-prompt.txt    # Prompt used for code generation
```

## Benefits

### 1. **Transparency**
- See exactly what prompts were sent to the AI
- Understand how the AI generated the code
- Debug issues by reviewing the prompt content

### 2. **Reproducibility**
- Recreate the same output with the same prompt
- Share prompts with team members
- Version control your prompts

### 3. **Iteration**
- Edit prompts to refine output
- Add more context or constraints
- Experiment with different approaches

### 4. **Debugging**
- Check if wiki documentation was loaded correctly
- Verify prompt size and content
- Identify missing information

## Example: Viewing Prompts

```bash
# After creating a task
ot create-agent weather-report --cli-agent claude-default

# View the planning prompt
cat .open-tasks/weather-report.planning-prompt.txt

# View the implementation prompt (includes wiki docs)
cat .open-tasks/weather-report.implementation-prompt.txt

# Check prompt sizes
ls -lh .open-tasks/weather-report.*.txt
```

## Example: Regenerating from Saved Prompts

If you want to regenerate the task with modifications:

1. **Edit the saved prompt:**
   ```bash
   # Edit the implementation prompt
   code .open-tasks/weather-report.implementation-prompt.txt
   ```

2. **Manually run the agent with the modified prompt:**
   ```bash
   # For Claude
   claude -p "$(cat .open-tasks/weather-report.implementation-prompt.txt)" > .open-tasks/weather-report.ts
   
   # For Gemini
   gemini -p "$(cat .open-tasks/weather-report.implementation-prompt.txt)" > .open-tasks/weather-report.ts
   ```

## Prompt Structure

### Planning Prompt
Contains:
- Task name and requirements
- Framework context (ITaskHandler, IFlow, Commands, etc.)
- Required plan sections
- Guidelines for creating actionable plans

### Implementation Prompt
Contains:
- Complete task specification from planning phase
- **Full wiki documentation** (~50KB):
  - Building-Custom-Tasks.md
  - Core-Commands.md
  - Example-Tasks.md
- Implementation requirements with code examples
- TypeScript patterns and best practices
- Output format instructions

## Verbose Mode

Use `--verbose` to see additional information:

```bash
ot create-agent my-task --cli-agent claude-default --verbose
```

Shows:
- Prompt file paths as they're saved
- Prompt sizes in KB
- Agent command being executed
- Process information

## Tips

1. **Review Before Implementing**
   - Check planning prompt to ensure requirements are clear
   - Verify implementation prompt includes necessary context

2. **Iterate on Prompts**
   - If code generation isn't perfect, edit the implementation prompt
   - Add more specific examples or constraints
   - Re-run the agent with the modified prompt

3. **Share Prompts**
   - Commit prompt files to version control
   - Team members can learn from successful prompts
   - Build a library of effective prompts

4. **Debug Issues**
   - If agent produces unexpected output, review the prompts
   - Check if wiki docs were loaded (look for "# Reference:" sections)
   - Verify prompt isn't truncated or malformed
