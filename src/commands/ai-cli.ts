import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { CommandHandler, ExecutionContext, ReferenceHandle, ICardBuilder } from '../types.js';
import { TokenDecorator } from '../workflow/decorators.js';

interface AiCliConfig {
  command: string;
  args: string[];
  contextPattern?: string;
  timeout?: number;
}

/**
 * AI CLI command - integrates with external AI CLI tools
 */
export default class AiCliCommand extends CommandHandler {
  name = 'ai-cli';
  description = 'Execute an AI CLI tool with context files';
  examples = [
    'open-tasks ai-cli "Summarize this" --ref document',
    'open-tasks ai-cli "Compare these files" --ref file1 --ref file2',
  ];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    cardBuilder: ICardBuilder
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('AI CLI command requires a prompt argument');
    }

    const prompt = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Load AI CLI configuration
    cardBuilder.addProgress('Loading AI CLI configuration...');
    const config = await this.loadConfig(context.cwd);

    // Build command with context files
    const contextFiles = Array.from(refs.values())
      .map((ref) => ref.outputFile)
      .filter((file): file is string => file !== undefined);

    cardBuilder.addProgress(`Executing AI CLI with ${contextFiles.length} context file(s)...`);

    // Execute AI CLI
    let exitCode = 0;
    let result: string;
    let executionError: string | undefined;

    try {
      result = await this.executeAiCli(config, prompt, contextFiles);
    } catch (error) {
      exitCode = 1;
      executionError = error instanceof Error ? error.message : String(error);
      result = executionError;
    }

    // Store the result
    const decorators = token ? [new TokenDecorator(token)] : [];
    const memoryRef = await context.workflowContext.store(result, decorators);

    const outputFile = memoryRef.fileName
      ? `${context.outputDir}/${memoryRef.fileName}`
      : undefined;

    const ref = context.referenceManager.createReference(
      memoryRef.id,
      result,
      token,
      outputFile
    );

    // Add visual card
    const cardStyle = exitCode === 0 ? 'success' : 'error';
    const cardTitle = exitCode === 0 ? '🤖 AI CLI Executed' : '❌ AI CLI Failed';
    
    const details: Record<string, string> = {
      'Command': config.command,
      'Prompt': prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt,
      'Context Files': contextFiles.length > 0 ? contextFiles.join(', ') : 'None',
      'Exit Code': String(exitCode),
      'Response Length': `${result.length} characters`,
    };

    if (token) {
      details['Token'] = token;
    }

    if (outputFile) {
      details['Output File'] = outputFile;
    }

    if (executionError) {
      details['Error'] = executionError;
    } else {
      const preview = result.length > 200 ? result.substring(0, 200) + '...' : result;
      details['Response Preview'] = preview;
    }

    cardBuilder.addCard(cardTitle, details, cardStyle);

    return ref;
  }

  private async loadConfig(cwd: string): Promise<AiCliConfig> {
    const configPath = path.join(cwd, '.open-tasks', 'ai-config.json');

    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      throw new Error(
        'AI CLI configuration not found. Create .open-tasks/ai-config.json with command and args.'
      );
    }
  }

  private async executeAiCli(
    config: AiCliConfig,
    prompt: string,
    contextFiles: string[]
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const commandArgs = [...config.args];

      // Add context files
      if (contextFiles.length > 0) {
        contextFiles.forEach((file) => {
          commandArgs.push('--context', file);
        });
      }

      // Add prompt
      commandArgs.push(prompt);

      const child = spawn(config.command, commandArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `AI CLI exited with code ${code}\nStderr: ${stderr}`
            )
          );
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', (error) => {
        reject(
          new Error(
            `Failed to execute AI CLI: ${error.message}\n` +
            `Make sure ${config.command} is installed and available in PATH`
          )
        );
      });

      // Set timeout
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('AI CLI execution timed out'));
      }, config.timeout || 60000);

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }
}
