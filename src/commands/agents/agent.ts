import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../../types.js';
import { IAgentConfig, executeAgent } from './base.js';

/**
 * Generic AgentCommand - Executes any agentic CLI tool with prompts from StringRefs
 * 
 * The agent configuration defines all tool-specific behavior including:
 * - How to build command-line arguments
 * - What environment variables to set
 * - Tool-specific options and flags
 * 
 * Usage:
 *   const config = new GeminiConfigBuilder()
 *     .withModel('gemini-2.5-pro')
 *     .withTimeout(30000)
 *     .build();
 *   
 *   const result = await flow.run(
 *     new AgentCommand(config, [promptRef, codeRef])
 *   );
 */
export class AgentCommand implements ICommand {
  private config: IAgentConfig;
  private promptRefs: StringRef[];

  /**
   * Create a new AgentCommand
   * @param config - Agent-specific configuration (GeminiConfig, ClaudeConfig, etc.)
   * @param promptRefs - Array of StringRefs whose values will be joined to form the prompt
   */
  constructor(config: IAgentConfig, promptRefs: StringRef[]) {
    this.config = config;
    this.promptRefs = promptRefs;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    // Retrieve and join all StringRef values to create the prompt
    const promptParts: string[] = [];
    
    for (const ref of this.promptRefs) {
      const content = await context.get(ref);
      if (content === undefined) {
        throw new Error(`Prompt reference not found: ${ref.token || ref.id}`);
      }
      promptParts.push(content);
    }
    
    const prompt = promptParts.join('\n\n');

    // Let the config build the command (tool-specific)
    const { command, args: cmdArgs } = this.config.buildCommand(prompt);
    
    // Get environment variables from config (tool-specific)
    const env = this.config.getEnvironment();
    
    // Get runtime options from context config
    const runtimeConfig = context.config || {};
    const verbose = runtimeConfig.verbosity === 'verbose';
    const dryRun = this.config.dryRun || runtimeConfig.dryRun || false;
    
    // Execute the CLI tool
    const result = await executeAgent(
      command,
      cmdArgs,
      this.config.workingDirectory || context.cwd,
      env,
      this.config.timeout,
      dryRun,
      verbose
    );

    // Return the result
    return [[result, []]];
  }
}
