import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { CommandRouter } from './router.js';
import { CommandHandler } from './types.js';

/**
 * Command loader for discovering and registering commands
 */
export class CommandLoader {
  constructor(private router: CommandRouter) {}

  /**
   * Load built-in commands from the commands directory
   */
  async loadBuiltinCommands(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const commandsDir = path.join(__dirname, 'commands');

    try {
      const files = await fs.readdir(commandsDir);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const commandPath = path.join(commandsDir, file);
          await this.loadCommand(commandPath);
        }
      }
    } catch (error) {
      // Commands directory might not exist yet, that's okay
      console.warn('No built-in commands directory found');
    }
  }

  /**
   * Load custom commands from .open-tasks/commands directory
   */
  async loadCustomCommands(customCommandsDir: string): Promise<void> {
    try {
      const exists = await fs
        .access(customCommandsDir)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        return; // No custom commands directory
      }

      const files = await fs.readdir(customCommandsDir);

      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          const commandPath = path.join(customCommandsDir, file);
          const commandName = path.basename(file, path.extname(file));
          await this.loadCommand(commandPath, commandName);
        }
      }
    } catch (error) {
      console.warn(`Error loading custom commands: ${error}`);
    }
  }

  /**
   * Load a single command from a file path
   */
  private async loadCommand(
    commandPath: string,
    customName?: string
  ): Promise<void> {
    try {
      // Convert to file URL for dynamic import
      const fileUrl = pathToFileURL(commandPath).href;
      const module = await import(fileUrl);

      // Look for default export or named export
      const CommandClass = module.default || module[Object.keys(module)[0]];

      if (!CommandClass) {
        console.warn(`No export found in ${commandPath}`);
        return;
      }

      // Instantiate the command
      const commandInstance = new CommandClass();

      // Verify it's a valid command handler
      if (
        !commandInstance.name ||
        !commandInstance.description ||
        typeof commandInstance.execute !== 'function'
      ) {
        console.warn(`Invalid command handler in ${commandPath}`);
        return;
      }

      // Register the command
      const name = customName || commandInstance.name;
      this.router.register(name, commandInstance);
    } catch (error) {
      console.warn(`Error loading command from ${commandPath}: ${error}`);
    }
  }
}
