import { IFlow, IOutputSynk, ReferenceHandle } from '../types.js';
import { TaskHandler } from '../task-handler.js';
import { TaskLogger } from '../logging/index.js';
import { PromptCommand } from '../commands/prompt.js';
import { MessageCard } from '../cards/MessageCard.js';

/**
 * Prompt task - Execute GitHub Copilot prompts from .github/prompts/
 * 
 * This task allows you to execute prompts stored in your repository's
 * .github/prompts/ directory via the CLI using Claude Code CLI.
 * 
 * Examples:
 *   ot prompt openspec-proposal "Add user authentication"
 *   ot prompt code-review --model sonnet --temperature 0.3
 *   ot prompt openspec-apply --allow-all-tools
 */
export default class PromptTask extends TaskHandler {
  name = 'prompt';
  description = 'Execute GitHub Copilot prompts from .github/prompts/ using Claude';
  examples = [
    'ot prompt openspec-proposal "Add user authentication"',
    'ot prompt code-review "Review auth.ts" --model sonnet',
    'ot prompt openspec-apply --allow-all-tools',
    'ot prompt security-audit --temperature 0.2 --model opus',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: IFlow,
    synk: IOutputSynk
  ): Promise<ReferenceHandle> {
    const logger = new TaskLogger(synk, this.name);

    // Parse arguments
    if (args.length === 0) {
      logger.error('Prompt name is required');
      throw new Error(
        'Usage: ot prompt <prompt-name> [arguments] [--model <model>] [--temperature <temp>] [--allow-all-tools]'
      );
    }

    const promptName = args[0];
    let argumentText = '';
    const options: {
      model?: string;
      temperature?: number;
      allowAllTools?: boolean;
    } = {};

    // Parse remaining arguments
    let i = 1;
    while (i < args.length) {
      const arg = args[i];

      if (arg === '--model' && i + 1 < args.length) {
        options.model = args[i + 1];
        i += 2;
      } else if (arg === '--temperature' && i + 1 < args.length) {
        const temp = parseFloat(args[i + 1]);
        if (isNaN(temp) || temp < 0 || temp > 1) {
          logger.error('Temperature must be between 0.0 and 1.0');
          throw new Error('Invalid temperature value');
        }
        options.temperature = temp;
        i += 2;
      } else if (arg === '--allow-all-tools') {
        options.allowAllTools = true;
        i++;
      } else if (!arg.startsWith('--')) {
        // Treat as argument text
        argumentText = argumentText ? `${argumentText} ${arg}` : arg;
        i++;
      } else {
        i++;
      }
    }

    // Show what we're executing
    logger.progress(`Loading prompt: ${promptName}`);
    if (argumentText) {
      logger.info(`Arguments: ${argumentText}`);
    }
    if (options.model) {
      logger.info(`Model: ${options.model}`);
    }
    if (options.temperature !== undefined) {
      logger.info(`Temperature: ${options.temperature}`);
    }
    if (options.allowAllTools) {
      logger.info(`Allow all tools: enabled`);
    }

    try {
      // Create and execute the prompt command
      const promptCommand = new PromptCommand(
        promptName,
        argumentText || undefined,
        options
      );

      logger.progress('Executing prompt...');
      const refs = await flow.run(promptCommand);

      if (refs.length === 0) {
        logger.warning('No result returned from prompt');
        throw new Error('Prompt execution returned no result');
      }

      // Get the result
      const result = await flow.get(refs[0]);

      if (!result) {
        logger.warning('Result reference not found');
        throw new Error('Could not retrieve prompt result');
      }

      logger.info('Prompt executed successfully!');

      // Display result preview
      const preview = result.length > 500 
        ? result.substring(0, 500) + '...\n\n(truncated for display)'
        : result;

      logger.card(new MessageCard('✨ Prompt Result', preview, 'success'));

      // Return full result
      const handle: ReferenceHandle = {
        id: refs[0].id,
        token: refs[0].token || 'prompt-result',
        content: result,
        timestamp: new Date(),
      };

      return handle;

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Could not find .github directory')) {
          logger.error('No .github/prompts/ directory found in workspace');
          const message = 
            'This command requires a .github/prompts/ directory.\n\n' +
            'Create it and add prompt files:\n' +
            '  mkdir -p .github/prompts\n' +
            '  echo "---\\ndescription: My prompt\\n---\\n\\n$ARGUMENTS\\n\\nPrompt content..." > .github/prompts/my-prompt.prompt.md';
          logger.card(new MessageCard('❌ Setup Required', message, 'error'));
        } else if (error.message.includes('Prompt file not found')) {
          logger.error(`Prompt not found: ${promptName}.prompt.md`);
          const message = 
            `Could not find: .github/prompts/${promptName}.prompt.md\n\n` +
            'Check available prompts:\n' +
            '  ls .github/prompts/';
          logger.card(new MessageCard('❌ Prompt Not Found', message, 'error'));
        } else if (error.message.includes('Command') && error.message.includes('not found')) {
          logger.error('Claude Code CLI not installed');
          const message = 
            'This command requires the Claude Code CLI tool.\n\n' +
            'Install it:\n' +
            '  npm install -g @anthropic-ai/claude-code\n\n' +
            'Then configure:\n' +
            '  export ANTHROPIC_API_KEY=your-api-key\n' +
            '  # or on Windows:\n' +
            '  $env:ANTHROPIC_API_KEY="your-api-key"';
          logger.card(new MessageCard('❌ Claude Code CLI Required', message, 'error'));
        } else {
          logger.error(error.message);
        }
      }
      throw error;
    }
  }
}
