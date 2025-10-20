import { spawn } from 'child_process';

/**
 * Base interface for agent configurations
 * Each agent tool implements this to define how commands are built and executed
 */
export interface IAgentConfig {
  /** Working directory for the agent */
  workingDirectory?: string;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Dry-run mode - echo command instead of executing it */
  dryRun?: boolean;
  
  /**
   * Build the command-line arguments for this agent
   * @param prompt - The complete prompt text to execute
   * @returns The command name and arguments array
   */
  buildCommand(prompt: string): { command: string; args: string[] };
  
  /**
   * Get environment variables needed for this agent
   * @returns Environment variables to set
   */
  getEnvironment(): Record<string, string>;
}

/**
 * Execute an agent CLI tool
 * @param command - Command to run
 * @param args - Command arguments
 * @param cwd - Working directory
 * @param env - Environment variables
 * @param timeout - Timeout in milliseconds
 * @param dryRun - If true, echo command instead of executing
 * @param verbose - If true, stream output to console
 */
export function executeAgent(
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string>,
  timeout?: number,
  dryRun?: boolean,
  verbose?: boolean
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Build the full command string for dry-run display
    const escapedArgs = args.map(arg => {
      // Quote arguments that contain spaces or special characters
      if (arg.includes(' ') || arg.includes('"') || arg.includes("'")) {
        return `"${arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
      }
      return arg;
    });
    const fullCommand = `${command} ${escapedArgs.join(' ')}`;
    
    // In dry-run mode, echo the command instead of executing
    if (dryRun) {
      const dryRunOutput = `[DRY-RUN] Would execute:\ncd ${cwd}\n${fullCommand}`;
      if (verbose) {
        console.log(dryRunOutput);
      }
      resolve(dryRunOutput);
      return;
    }
    
    const processEnv = { ...process.env, ...env };
    
    const child = spawn(command, args, {
      cwd,
      env: processEnv,
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // Stream to console in verbose mode
      if (verbose) {
        process.stdout.write(text);
      }
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      // Stream to console in verbose mode
      if (verbose) {
        process.stderr.write(text);
      }
    });

    let timeoutId: NodeJS.Timeout | undefined;
    if (timeout) {
      timeoutId = setTimeout(() => {
        child.kill();
        reject(new Error(`Agent execution timed out after ${timeout}ms`));
      }, timeout);
    }

    child.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Agent failed with code ${code}:\n${stderr || stdout}`));
      }
    });

    child.on('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(new Error(`Failed to execute agent: ${error.message}`));
    });
  });
}
