import chalk from 'chalk';
import { ReferenceHandle } from './types.js';

/**
 * Check if color output should be disabled
 */
function useColor(): boolean {
  return process.env.NO_COLOR === undefined;
}

/**
 * Format success message
 */
export function formatSuccess(message: string): string {
  return useColor() ? chalk.green(`✓ ${message}`) : `✓ ${message}`;
}

/**
 * Format error message
 */
export function formatError(message: string): string {
  return useColor() ? chalk.red(`✗ ${message}`) : `✗ ${message}`;
}

/**
 * Format info message
 */
export function formatInfo(message: string): string {
  return useColor() ? chalk.blue(`ℹ ${message}`) : `ℹ ${message}`;
}

/**
 * Format warning message
 */
export function formatWarning(message: string): string {
  return useColor() ? chalk.yellow(`⚠ ${message}`) : `⚠ ${message}`;
}

/**
 * Format command name
 */
export function formatCommand(command: string): string {
  return useColor() ? chalk.cyan(command) : command;
}

/**
 * Format reference token/ID
 */
export function formatReference(token: string): string {
  return useColor() ? chalk.yellow(token) : token;
}

/**
 * Format reference handle display
 */
export function formatReferenceHandle(ref: ReferenceHandle): string {
  const parts = [];
  
  if (ref.token) {
    parts.push(`Token: ${formatReference(ref.token)}`);
  }
  parts.push(`ID: ${ref.id}`);
  
  if (ref.outputFile) {
    parts.push(`File: ${ref.outputFile}`);
  }
  
  parts.push(`Time: ${ref.timestamp.toISOString()}`);
  
  return parts.join(' | ');
}

/**
 * Format command list for help
 */
export function formatCommandList(
  commands: Array<{ name: string; description: string }>
): string {
  const maxNameLength = Math.max(...commands.map((c) => c.name.length));
  
  return commands
    .map(
      (c) =>
        `  ${formatCommand(c.name.padEnd(maxNameLength))}  ${c.description}`
    )
    .join('\n');
}

/**
 * Format command help
 */
export function formatCommandHelp(help: {
  name: string;
  description: string;
  examples: string[];
}): string {
  const lines = [];
  
  lines.push('');
  lines.push(formatCommand(`Command: ${help.name}`));
  lines.push('');
  lines.push(`Description: ${help.description}`);
  lines.push('');
  
  if (help.examples.length > 0) {
    lines.push('Examples:');
    help.examples.forEach((example) => {
      lines.push(`  ${example}`);
    });
    lines.push('');
  }
  
  return lines.join('\n');
}
