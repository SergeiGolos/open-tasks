import { spawn } from 'child_process';
import {  ExecutionContext, ReferenceHandle, IOutputSynk, IFlow } from '../types.js';
import { TokenDecorator } from '../decorators.js';
import { TaskHandler } from '../task-handler.js';
import { MessageCard } from '../cards/MessageCard.js';

/**
 * PowerShell command - executes PowerShell scripts
 */
export default class PowerShellCommand extends TaskHandler {
  name = 'powershell';
  description = 'Execute a PowerShell script';
  examples = [
    'open-tasks powershell "Get-Date"',
    'open-tasks powershell "Get-Content {{file}}" --ref file',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    workflowContext: IFlow,
    outputBuilder: IOutputSynk
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('PowerShell command requires a script argument');
    }

    let script = args[0];
    const token = args.find((arg, i) => args[i - 1] === '--token');

    // Execute PowerShell script
    outputBuilder.write('Executing PowerShell script...');
    let exitCode = 0;
    let result: string;
    let executionError: string | undefined;

    try {
      result = await this.executePowerShell(script);
    } catch (error) {
      exitCode = 1;
      executionError = error instanceof Error ? error.message : String(error);
      result = executionError;
    }

    // Store the result
    const decorators = token ? [new TokenDecorator(token)] : [];
    const StringRef = await workflowContext.set(result, decorators);

    const outputFile = StringRef.fileName
      ? `${workflowContext.cwd}/.open-tasks/outputs/${StringRef.fileName}`
      : undefined;

    const ref: ReferenceHandle = {
      id: StringRef.id,
      content: result,
      token: token,
      timestamp: new Date(),
      outputFile: outputFile
    };

    // Add visual card
    const cardStyle = exitCode === 0 ? 'success' : 'error';
    const cardTitle = exitCode === 0 ? '⚡ PowerShell Executed' : '❌ PowerShell Failed';
    
    const details = [
      `Script: ${script.length > 100 ? script.substring(0, 100) + '...' : script}`,
      `Exit Code: ${exitCode}`,
      `Output Length: ${result.length} characters`,
    ];

    if (token) {
      details.push(`Token: ${token}`);
    }

    if (outputFile) {
      details.push(`Output File: ${outputFile}`);
    }

    if (executionError) {
      details.push(`Error: ${executionError}`);
    } else {
      const preview = result.length > 200 ? result.substring(0, 200) + '...' : result;
      details.push(`Output Preview: ${preview}`);
    }

    outputBuilder.write(new MessageCard(cardTitle, details.join('\n'), cardStyle));

    return ref;
  }

  private async executePowerShell(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Determine if we're on Windows
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'powershell.exe' : 'pwsh';
      const args = ['-NoProfile', '-NonInteractive', '-Command', script];

      const child = spawn(command, args, {
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
              `PowerShell exited with code ${code}\nStderr: ${stderr}`
            )
          );
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', (error) => {
        reject(
          new Error(
            `Failed to execute PowerShell: ${error.message}\n` +
            `Make sure PowerShell is installed and available in PATH`
          )
        );
      });

      // Set timeout
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('PowerShell execution timed out (30s)'));
      }, 30000);

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }
}
