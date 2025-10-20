import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { CommandRouter } from './router.js';

/**
 * Command loader for discovering and registering commands
 */
export class CommandLoader {
  constructor(private router: CommandRouter) {}

  /**
   * Load commands from a source directory
   * @param sourceDir - The directory to load commands from
   * @param options - Configuration options for loading
   */
  async loadCommandSource(
    sourceDir: string,
    options: { warnOnMissing?: boolean } = {}
  ): Promise<void> {
    const { warnOnMissing = true } = options;

    try {
      const exists = await fs
        .access(sourceDir)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        if (warnOnMissing) {        
          console.warn(`No command found at ${sourceDir}`);
        }
        return;
      }

      const files = await fs.readdir(sourceDir);

      for (const file of files) {
        // Load .js and .ts files
        const isValidFile = file.endsWith('.js') || file.endsWith('.ts');
        if (!isValidFile) {
          continue;
        }

        const commandPath = path.join(sourceDir, file);
        const commandName = path.basename(file, path.extname(file));
        await this.loadCommand(commandPath, commandName);
      }
    } catch (error) {
      console.warn(`Error loading commands from ${sourceDir}: ${error}`);
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
