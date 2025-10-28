import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { fileURLToPath } from 'url';
import { IFlow, IOutputSynk, ReferenceHandle } from '../types.js';
import { getDefaultConfig } from '../config-loader.js';
import { MessageCard } from '../cards/index.js';
import { TaskHandler } from '../task-handler.js';
import { TaskLogger } from '../logging/index.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default class InitCommand extends TaskHandler {  
  name = 'init';
  description = 'Initialize a new open-tasks project';
  examples = [
    'ot init',
    'ot init --force',
    'ot init --verbose',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: IFlow,
    synk: IOutputSynk
  ): Promise<ReferenceHandle> {
    const logger = new TaskLogger(synk, this.name);
    const force = args.includes('--force');
    const openTasksDir = path.join(flow.cwd, '.open-tasks');
    const logsDir = path.join(openTasksDir, 'logs');
    const schemasDir = path.join(openTasksDir, 'schemas');
    const configPath = path.join(openTasksDir, '.config.json');

    logger.progress('Checking if project is already initialized...');
    const exists = await fse.pathExists(openTasksDir);
    if (exists && !force) {
      logger.error('Project already initialized');
      throw new Error('Project already initialized. Use --force to reinitialize.');
    }

    const results: string[] = [];
    
    logger.progress('Creating .open-tasks directory...');
    await fse.ensureDir(openTasksDir);
    results.push('.open-tasks/');
    logger.fileCreated('.open-tasks/');
    
    logger.progress('Creating logs directory...');
    await fse.ensureDir(logsDir);
    results.push('.open-tasks/logs/');
    logger.fileCreated('.open-tasks/logs/');
    
    logger.progress('Creating schemas directory...');
    await fse.ensureDir(schemasDir);
    results.push('.open-tasks/schemas/');
    logger.fileCreated('.open-tasks/schemas/');

    // Copy schema file
    logger.progress('Copying schema file...');
    const schemaSourcePath = path.join(__dirname, '..', '..', 'schemas', 'config.schema.json');
    const schemaDestPath = path.join(schemasDir, 'config.schema.json');
    
    try {
      await fse.copy(schemaSourcePath, schemaDestPath);
      results.push('.open-tasks/schemas/config.schema.json');
      logger.fileCreated('.open-tasks/schemas/config.schema.json');
    } catch (error) {
      logger.warning('Could not copy schema file, creating schema reference only');
    }

    // Create config with schema reference
    logger.progress('Creating configuration file...');
    const defaultConfig = getDefaultConfig();
    const configWithSchema = {
      "$schema": "./schemas/config.schema.json",
      ...defaultConfig
    };
    await fs.writeFile(configPath, JSON.stringify(configWithSchema, null, 2), 'utf-8');
    results.push('.open-tasks/.config.json');
    logger.fileCreated('.open-tasks/.config.json');

    logger.progress('Setting up package.json files...');
    const commandsPackageJsonPath = path.join(openTasksDir, 'package.json');
    const commandsPackageJsonExists = await fse.pathExists(commandsPackageJsonPath);
    if (!commandsPackageJsonExists) {
      const commandsPackageJson = { type: 'module' };
      await fs.writeFile(commandsPackageJsonPath, JSON.stringify(commandsPackageJson, null, 2), 'utf-8');
      results.push('.open-tasks/package.json');
      logger.fileCreated('.open-tasks/package.json');
    }

    const packageJsonPath = path.join(flow.cwd, 'package.json');
    const packageJsonExists = await fse.pathExists(packageJsonPath);
    if (!packageJsonExists) {
      const packageJson = {
        name: path.basename(flow.cwd),
        version: '1.0.0',
        type: 'module',
        scripts: { 'ot': 'ot' },
        dependencies: {},
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
      results.push('package.json');
      logger.fileCreated('package.json');
    }

    const details = [
      `Project Directory: ${path.basename(flow.cwd)}`,
      `Open Tasks Directory: ${openTasksDir}`,
      `Files Created: ${results.length}`,
      `Force Mode: ${force ? 'Yes' : 'No'}`,
      ``,
      `Created Files:`,
      ...results.map(r => `  ✓ ${r}`),
      ``,
      `Next Steps:`,
      `  1. npm install @bitcobblers/open-tasks`,
      `  2. ot create my-command`,
      `  3. ot my-command`,
    ].join('\n');
    
    logger.card(new MessageCard('🎉 Project Initialized', details, 'success'));

    logger.complete();

    const message = [
      'Project initialized successfully!',
      '',
      'Created:',
      ...results.map((r) => `  - ${r}`),
      '',
      'Next steps:',
      '  1. Run: npm install @bitcobblers/open-tasks',
      '  2. Create a command: ot create my-command',
      '  3. Run your command: ot my-command',
    ].join('\n');

    const ref: ReferenceHandle = {
      id: 'init-result',
      content: message,
      token: 'init',
      timestamp: new Date(),
    };

    return ref;
  }  
}
