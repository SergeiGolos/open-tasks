import { spawn } from 'child_process';
import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';

/**
 * Enum for supported agentic CLI tools
 */
export enum AgentTool {
  /** Google Gemini CLI (@google/gemini-cli) */
  GEMINI = 'gemini',
  /** Anthropic Claude Code (@anthropic-ai/claude-code) */
  CLAUDE = 'claude',
  /** GitHub Copilot CLI (@github/copilot) */
  COPILOT = 'copilot',
  /** Aider (aider-chat) */
  AIDER = 'aider',
  /** Codebuff */
  CODEBUFF = 'codebuff',
  /** Qwen Code CLI (@qwen-code/qwen-code) */
  QWEN = 'qwen',
  /** Crush (successor to OpenCode) */
  CRUSH = 'crush',
  /** llm by Simon Willison */
  LLM = 'llm',
  /** OpenAI Codex CLI */
  OPENAI = 'openai',
}

/**
 * Model providers for tools that support multiple backends
 */
export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  GROQ = 'groq',
  OLLAMA = 'ollama',
  AZURE = 'azure',
  BEDROCK = 'bedrock',
  OPENROUTER = 'openrouter',
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen',
  LOCAL = 'local',
}

/**
 * Configuration interface for agentic CLI tools
 * Supports all major CLI tools mentioned in the research document
 */
export interface IAgentConfig {
  /** The CLI tool to use */
  tool: AgentTool;
  
  /** Model provider (for multi-model tools) */
  provider?: ModelProvider;
  
  /** Specific model name (e.g., 'gpt-4', 'claude-3-sonnet', 'gemini-pro') */
  model?: string;
  
  /** Working directory for the agent */
  workingDirectory?: string;
  
  /** Additional file paths to include as context */
  contextFiles?: string[];
  
  /** Allow all tools without prompting (for unattended execution) */
  allowAllTools?: boolean;
  
  /** Run in non-interactive mode (single prompt and exit) */
  nonInteractive?: boolean;
  
  /** Temperature for model responses (0.0 to 1.0) */
  temperature?: number;
  
  /** Maximum tokens for response */
  maxTokens?: number;
  
  /** API key (if needed) */
  apiKey?: string;
  
  /** Custom flags specific to the tool */
  customFlags?: Record<string, string | boolean>;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Git integration options */
  git?: {
    /** Automatically commit changes */
    autoCommit?: boolean;
    /** Commit message template */
    commitMessage?: string;
  };
  
  /** MCP server configurations */
  mcpServers?: {
    name: string;
    endpoint: string;
  }[];
}

/**
 * Builder class for fluent AgentConfig creation
 */
export class AgentConfigBuilder {
  private config: IAgentConfig;

  constructor(tool: AgentTool) {
    this.config = {
      tool,
      nonInteractive: true, // Default to non-interactive for automation
    };
  }

  withProvider(provider: ModelProvider): this {
    this.config.provider = provider;
    return this;
  }

  withModel(model: string): this {
    this.config.model = model;
    return this;
  }

  inDirectory(dir: string): this {
    this.config.workingDirectory = dir;
    return this;
  }

  withContextFiles(...files: string[]): this {
    this.config.contextFiles = [...(this.config.contextFiles || []), ...files];
    return this;
  }

  allowingAllTools(): this {
    this.config.allowAllTools = true;
    return this;
  }

  interactive(): this {
    this.config.nonInteractive = false;
    return this;
  }

  withTemperature(temp: number): this {
    this.config.temperature = temp;
    return this;
  }

  withMaxTokens(tokens: number): this {
    this.config.maxTokens = tokens;
    return this;
  }

  withApiKey(key: string): this {
    this.config.apiKey = key;
    return this;
  }

  withTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  withGitAutoCommit(commitMessage?: string): this {
    this.config.git = {
      autoCommit: true,
      commitMessage,
    };
    return this;
  }

  withMcpServer(name: string, endpoint: string): this {
    if (!this.config.mcpServers) {
      this.config.mcpServers = [];
    }
    this.config.mcpServers.push({ name, endpoint });
    return this;
  }

  withFlag(name: string, value: string | boolean): this {
    if (!this.config.customFlags) {
      this.config.customFlags = {};
    }
    this.config.customFlags[name] = value;
    return this;
  }

  build(): IAgentConfig {
    return this.config;
  }
}

/**
 * AgentCommand - Executes agentic CLI tools with prompts constructed from StringRefs
 * 
 * This command takes a configuration for various agentic CLI tools (Gemini, Claude, Copilot, etc.)
 * and executes them with a prompt constructed by joining the values from multiple StringRefs.
 * 
 * Usage in workflow:
 *   // Create config using builder
 *   const config = new AgentConfigBuilder(AgentTool.GEMINI)
 *     .withModel('gemini-2.5-pro')
 *     .allowingAllTools()
 *     .build();
 *   
 *   // Execute with prompt from refs
 *   const promptRef = await flow.run(new SetCommand('Explain the authentication flow'));
 *   const codeRef = await flow.run(new ReadCommand('auth.ts'));
 *   const result = await flow.run(new AgentCommand(config, [promptRef[0], codeRef[0]]));
 */
export class AgentCommand implements ICommand {
  private config: IAgentConfig;
  private promptRefs: StringRef[];

  /**
   * Create a new AgentCommand
   * @param config - Agent tool configuration
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

    // Build command based on the configured tool
    const { command, args: cmdArgs } = this.buildCommand(prompt);

    // Execute the CLI tool with verbosity info from context
    const verbosity = (context as any).verbosity || 'summary';
    const result = await this.executeAgent(command, cmdArgs, this.config.workingDirectory || context.cwd, verbosity);

    // Return the result
    return [[result, []]];
  }

  /**
   * Build command and arguments based on tool configuration
   */
  private buildCommand(prompt: string): { command: string; args: string[] } {
    const args: string[] = [];
    
    switch (this.config.tool) {
      case AgentTool.GEMINI:
        // gemini -p "prompt"
        args.push('-p', prompt);
        if (this.config.model) {
          args.push('--model', this.config.model);
        }
        if (this.config.contextFiles) {
          args.push(...this.config.contextFiles);
        }
        return { command: 'gemini', args };

      case AgentTool.CLAUDE:
        // claude -p "prompt" or claude --print "prompt"
        args.push('-p', prompt);
        if (this.config.allowAllTools) {
          args.push('--allow-all-tools');
        }
        if (this.config.model) {
          args.push('--model', this.config.model);
        }
        return { command: 'claude', args };

      case AgentTool.COPILOT:
        // copilot -p "prompt" --allow-all-tools
        args.push('-p', prompt);
        if (this.config.allowAllTools) {
          args.push('--allow-all-tools');
        }
        if (this.config.model) {
          args.push('--model', this.config.model);
        }
        return { command: 'copilot', args };

      case AgentTool.AIDER:
        // aider --message "prompt" file1 file2
        args.push('--message', prompt);
        if (this.config.contextFiles) {
          args.push(...this.config.contextFiles);
        }
        if (this.config.model) {
          args.push('--model', this.config.model);
        }
        if (this.config.git?.autoCommit === false) {
          args.push('--no-auto-commits');
        }
        return { command: 'aider', args };

      case AgentTool.CODEBUFF:
        // codebuff "prompt"
        args.push(prompt);
        if (this.config.model) {
          args.push('--model', this.config.model);
        }
        return { command: 'codebuff', args };

      case AgentTool.QWEN:
        // qwen -p "prompt" file1 file2
        args.push('-p', prompt);
        if (this.config.contextFiles) {
          args.push(...this.config.contextFiles);
        }
        if (this.config.model) {
          args.push('--model', this.config.model);
        }
        return { command: 'qwen', args };

      case AgentTool.CRUSH:
        // crush -p "prompt" (assuming similar to OpenCode)
        args.push('-p', prompt);
        if (this.config.model) {
          args.push('--model', this.config.model);
        }
        if (this.config.provider) {
          args.push('--provider', this.config.provider);
        }
        return { command: 'crush', args };

      case AgentTool.LLM:
        // llm "prompt"
        args.push(prompt);
        if (this.config.model) {
          args.push('-m', this.config.model);
        }
        if (this.config.temperature !== undefined) {
          args.push('--temperature', this.config.temperature.toString());
        }
        return { command: 'llm', args };

      case AgentTool.OPENAI:
        // openai -p "prompt"
        args.push('-p', prompt);
        if (this.config.model) {
          args.push('--model', this.config.model);
        }
        return { command: 'openai', args };

      default:
        throw new Error(`Unsupported agent tool: ${this.config.tool}`);
    }
  }

  /**
   * Execute the agent CLI tool
   */
  private executeAgent(command: string, args: string[], cwd: string, verbosity: string = 'summary'): Promise<string> {
    return new Promise((resolve, reject) => {
      const env = { ...process.env };
      
      // Set API key if provided
      if (this.config.apiKey) {
        switch (this.config.tool) {
          case AgentTool.GEMINI:
            env.GEMINI_API_KEY = this.config.apiKey;
            break;
          case AgentTool.CLAUDE:
            env.ANTHROPIC_API_KEY = this.config.apiKey;
            break;
          case AgentTool.OPENAI:
            env.OPENAI_API_KEY = this.config.apiKey;
            break;
        }
      }

      // Log command being executed in verbose mode
      if (verbosity === 'verbose') {
        console.log(`\n[Agent Command] ${command} ${args.join(' ')}\n`);
      }

      const child = spawn(command, args, {
        cwd,
        env,
        shell: true,
        stdio: verbosity === 'verbose' ? ['inherit', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          const chunk = data.toString();
          stdout += chunk;
          
          // In verbose mode, stream output to console in real-time
          if (verbosity === 'verbose') {
            process.stdout.write(chunk);
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          const chunk = data.toString();
          stderr += chunk;
          
          // In verbose mode, stream stderr to console in real-time
          if (verbosity === 'verbose') {
            process.stderr.write(chunk);
          }
        });
      }

      // Handle timeout
      let timeoutId: NodeJS.Timeout | undefined;
      if (this.config.timeout) {
        if (verbosity === 'verbose') {
          console.log(`[Agent] Timeout set to ${this.config.timeout}ms`);
        }
        timeoutId = setTimeout(() => {
          if (verbosity === 'verbose') {
            console.error(`[Agent] Process timed out after ${this.config.timeout}ms`);
          }
          child.kill();
          reject(new Error(`Agent execution timed out after ${this.config.timeout}ms`));
        }, this.config.timeout);
      }

      child.on('spawn', () => {
        if (verbosity === 'verbose') {
          console.log(`[Agent] Process spawned (PID: ${child.pid})`);
        }
      });

      child.on('close', (code, signal) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (verbosity === 'verbose') {
          console.log(`\n[Agent] Process closed with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
        }

        if (code === 0) {
          resolve(stdout);
        } else {
          const errorMsg = `Agent execution failed with code ${code}:\n${stderr || stdout}`;
          if (verbosity === 'verbose') {
            console.error(`[Agent Error] ${errorMsg}`);
          }
          reject(new Error(errorMsg));
        }
      });

      child.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        const errorMsg = `Failed to execute agent: ${error.message}`;
        if (verbosity === 'verbose') {
          console.error(`[Agent Error] ${errorMsg}`);
        }
        reject(new Error(errorMsg));
      });
    });
  }
}

/**
 * Convenience factory functions for common configurations
 */
export const AgentConfig = {
  gemini: () => new AgentConfigBuilder(AgentTool.GEMINI),
  claude: () => new AgentConfigBuilder(AgentTool.CLAUDE),
  copilot: () => new AgentConfigBuilder(AgentTool.COPILOT),
  aider: () => new AgentConfigBuilder(AgentTool.AIDER),
  codebuff: () => new AgentConfigBuilder(AgentTool.CODEBUFF),
  qwen: () => new AgentConfigBuilder(AgentTool.QWEN),
  crush: () => new AgentConfigBuilder(AgentTool.CRUSH),
  llm: () => new AgentConfigBuilder(AgentTool.LLM),
  openai: () => new AgentConfigBuilder(AgentTool.OPENAI),
};
