import { ExecutionContext, ReferenceHandle } from './types.js';
import { TaskHandler } from './task-handler.js';

/**
 * Command router for discovering and executing commands
 */
export class CommandRouter {
  private commands: Map<string, TaskHandler>;

  constructor() {
    this.commands = new Map();
  }

  /**
   * Register a command handler
   */
  register(name: string, handler: TaskHandler): void {
    this.commands.set(name, handler);
  }

  /**
   * Get a command handler by name
   */
  get(name: string): TaskHandler | undefined {
    return this.commands.get(name);
  }

  /**
   * Execute a command with arguments and references
   */
  async execute(
    commandName: string,
    args: string[],    
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const handler = this.commands.get(commandName);
    
    if (!handler) {
      throw new Error(
        `Unknown command: ${commandName}\n\n` +
        `Available commands: ${Array.from(this.commands.keys()).join(', ')}`
      );
    }

    return await handler.execute(args, context);
  }

  /**
   * List all registered commands
   */
  listCommands(): Array<{ name: string; description: string }> {
    return Array.from(this.commands.entries()).map(([name, handler]) => ({
      name,
      description: handler.description,
    }));
  }

  /**
   * Get command details for help
   */
  getCommandHelp(name: string): {
    name: string;
    description: string;
    examples: string[];
  } | undefined {
    const handler = this.commands.get(name);
    if (!handler) return undefined;

    return {
      name: handler.name,
      description: handler.description,
      examples: handler.examples,
    };
  }
}
