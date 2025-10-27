import { promises as fs } from 'fs';
import path from 'path';
import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';
import { AgentCommand } from './agents/agent.js';
import { ClaudeConfigBuilder, ClaudeModel } from './agents/claude.js';

/**
 * PromptCommand - Load and execute GitHub Copilot prompts
 * 
 * This command reads a prompt file from `.github/prompts/{name}.prompt.md`,
 * processes it, and sends it to Claude Code CLI.
 * 
 * Prompt files follow GitHub Copilot's format:
 * ```
 * ---
 * description: Brief description of the prompt
 * ---
 * 
 * $ARGUMENTS
 * 
 * Rest of the prompt content...
 * ```
 * 
 * The `$ARGUMENTS` placeholder will be replaced with the provided arguments.
 * 
 * Usage in workflow:
 *   // Load and execute a prompt with arguments
 *   const result = await flow.run(
 *     new PromptCommand('openspec-proposal', 'Add user authentication')
 *   );
 * 
 *   // Load and execute without arguments
 *   const result = await flow.run(
 *     new PromptCommand('openspec-apply')
 *   );
 */
export class PromptCommand implements ICommand {
  private promptName: string;
  private arguments: string;
  private model?: string;
  private temperature?: number;
  private allowAllTools?: boolean;

  /**
   * Create a new PromptCommand
   * @param promptName - The name of the prompt file (without .prompt.md extension)
   * @param arguments - Arguments to replace $ARGUMENTS placeholder (optional)
   * @param options - Additional options for Claude execution
   */
  constructor(
    promptName: string,
    argumentsText?: string,
    options?: {
      model?: string;
      temperature?: number;
      allowAllTools?: boolean;
    }
  ) {
    this.promptName = promptName;
    this.arguments = argumentsText || '';
    this.model = options?.model;
    this.temperature = options?.temperature;
    this.allowAllTools = options?.allowAllTools;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    // Find the workspace root by looking for .github directory
    const workspaceRoot = await this.findWorkspaceRoot(context.cwd);
    
    // Construct the prompt file path
    const promptPath = path.join(
      workspaceRoot,
      '.github',
      'prompts',
      `${this.promptName}.prompt.md`
    );

    // Check if prompt file exists
    try {
      await fs.access(promptPath);
    } catch (error) {
      throw new Error(
        `Prompt file not found: ${this.promptName}.prompt.md\n` +
        `Expected location: ${promptPath}\n` +
        `Available prompts can be found in .github/prompts/`
      );
    }

    // Read the prompt file
    const promptContent = await fs.readFile(promptPath, 'utf-8');

    // Parse the prompt (extract content after frontmatter)
    const processedPrompt = this.processPrompt(promptContent);

    // Store the processed prompt in context
    const promptRef = await context.set(processedPrompt);

    // Build Claude config
    const configBuilder = new ClaudeConfigBuilder()
      .inDirectory(context.cwd);

    if (this.model) {
      // Validate model is a valid ClaudeModel
      if (this.isValidClaudeModel(this.model)) {
        configBuilder.withModel(this.model);
      } else {
        throw new Error(
          `Invalid Claude model: ${this.model}. ` +
          `Valid models are: sonnet, haiku, opus, or their full version names.`
        );
      }
    }

    if (this.temperature !== undefined) {
      configBuilder.withTemperature(this.temperature);
    }

    if (this.allowAllTools) {
      configBuilder.allowingAllTools();
    }

    const config = configBuilder.build();

    // Create and execute AgentCommand with the prompt
    const agentCommand = new AgentCommand(config, [promptRef]);
    const result = await agentCommand.execute(context, args, cardBuilder);

    return result;
  }

  /**
   * Check if a string is a valid ClaudeModel
   */
  private isValidClaudeModel(model: string): model is ClaudeModel {
    const validModels: readonly string[] = [
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-1-20250805',
      'claude-sonnet-4-5',
      'claude-haiku-4-5',
      'claude-opus-4-1',
      'sonnet',
      'haiku',
      'opus',
    ];
    return validModels.includes(model);
  }

  /**
   * Process the prompt content:
   * - Strip frontmatter
   * - Replace $ARGUMENTS placeholder
   */
  private processPrompt(content: string): string {
    // Remove frontmatter (YAML between --- markers)
    let processed = content;
    
    // Match frontmatter at start of file (more flexible with whitespace)
    const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    if (frontmatterMatch) {
      processed = content.slice(frontmatterMatch[0].length);
    }

    // Replace $ARGUMENTS placeholder
    if (this.arguments) {
      processed = processed.replace(/\$ARGUMENTS/g, this.arguments);
    } else {
      // Remove $ARGUMENTS line if no arguments provided
      processed = processed.replace(/\$ARGUMENTS\r?\n?/g, '');
    }

    return processed.trim();
  }

  /**
   * Find the workspace root by looking for .github directory
   */
  private async findWorkspaceRoot(startDir: string): Promise<string> {
    let currentDir = startDir;
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const githubDir = path.join(currentDir, '.github');
      try {
        const stat = await fs.stat(githubDir);
        if (stat.isDirectory()) {
          return currentDir;
        }
      } catch {
        // Directory doesn't exist, continue searching up
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break; // Reached the root
      }
      currentDir = parentDir;
    }

    throw new Error(
      'Could not find .github directory in workspace. ' +
      'Please ensure you are running this command from within a Git repository with a .github/prompts/ directory.'
    );
  }
}
