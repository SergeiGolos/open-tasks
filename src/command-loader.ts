import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { LoadedCommand } from './types.js';

/**
 * Command loader for discovering and registering commands
 */
export class CommandLoader {
  /**
   * Load commands from a source directory
   * @param sourceDir - The directory to load commands from
   * @param options - Configuration options for loading
   * @returns Array of loaded commands that can be registered
   */
  async loadCommandSource(
    sourceDir: string,
    options: { warnOnMissing?: boolean } = {}
  ): Promise<LoadedCommand[]> {
    const { warnOnMissing = true } = options;
    const loadedCommands: LoadedCommand[] = [];

    try {
      const exists = await fs
        .access(sourceDir)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        if (warnOnMissing) {        
          console.warn(`No command found at ${sourceDir}`);
        }
        return loadedCommands;
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
        const loadedCommand = await this.loadCommand(commandPath, commandName);
        
        if (loadedCommand) {
          loadedCommands.push(loadedCommand);
        }
      }
    } catch (error) {
      console.warn(`Error loading commands from ${sourceDir}: ${error}`);
    }

    return loadedCommands;
  }

  /**
   * Load a single command from a file path
   * @returns LoadedCommand if successful, undefined if loading failed
   */
  private async loadCommand(
    commandPath: string,
    customName?: string
  ): Promise<LoadedCommand | undefined> {
    try {
      // Convert to file URL for dynamic import
      const fileUrl = pathToFileURL(commandPath).href;
      const module = await import(fileUrl);

      // Look for default export or named export
      const CommandClass = module.default || module[Object.keys(module)[0]];

      if (!CommandClass) {
        console.warn(`No export found in ${commandPath}`);
        return undefined;
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
        return undefined;
      }

      // Return loaded command with name and handler
      const name = customName || commandInstance.name;
      return {
        name,
        handler: commandInstance,
      };
    } catch (error) {
      console.warn(`Error loading command from ${commandPath}: ${error}`);
      return undefined;
    }
  }
}
