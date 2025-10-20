import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  outputDir: '.open-tasks/logs',
  customCommandsDir: ['.open-tasks', path.join(os.homedir(), '.open-tasks')],
  timestampFormat: 'YYYYMMDD-HHmmss-SSS',
  defaultFileExtension: 'txt',
  colors: true,
};

/**
 * Load configuration from files and merge with defaults
 */
export async function loadConfig(cwd: string): Promise<Record<string, any>> {
  let config = { ...DEFAULT_CONFIG };

  // Try to load user-level config
  try {
    const userConfigPath = path.join(os.homedir(), '.open-tasks', '.config.json');
    const userConfigData = await fs.readFile(userConfigPath, 'utf-8');
    const userConfig = JSON.parse(userConfigData);
    config = { ...config, ...userConfig };
  } catch (error) {
    // User config doesn't exist, that's okay
  }

  // Try to load project-level config
  try {
    const projectConfigPath = path.join(cwd, '.open-tasks', '.config.json');
    const projectConfigData = await fs.readFile(projectConfigPath, 'utf-8');
    const projectConfig = JSON.parse(projectConfigData);
    config = { ...config, ...projectConfig };
  } catch (error) {
    // Project config doesn't exist, that's okay
  }

  return config;
}

/**
 * Get the default configuration
 */
export function getDefaultConfig(): Record<string, any> {
  return { ...DEFAULT_CONFIG };
}
