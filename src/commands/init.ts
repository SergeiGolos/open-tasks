import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { CommandHandler, ExecutionContext, ReferenceHandle, ICardBuilder } from '../types.js';
import { getDefaultConfig } from '../config-loader.js';

/**
 * Init command - initializes a new open-tasks project
 * Supports enhanced output control (quiet, summary, verbose)
 */
export default class InitCommand extends CommandHandler {
  name = 'init';
  description = 'Initialize a new open-tasks project';
  examples = [
    'open-tasks init',
    'open-tasks init --force',
    'open-tasks init --verbose',
  ];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext,
    cardBuilder: ICardBuilder
  ): Promise<ReferenceHandle> {
    const force = args.includes('--force');
    const openTasksDir = path.join(context.cwd, '.open-tasks');
    const commandsDir = path.join(openTasksDir, 'commands');
    const outputsDir = path.join(openTasksDir, 'outputs');
    const configPath = path.join(openTasksDir, 'config.json');

    // Check if .open-tasks already exists
    cardBuilder.addProgress('Checking for existing project...');
    const exists = await fse.pathExists(openTasksDir);
    if (exists && !force) {
      throw new Error(
        'Project already initialized. Use --force to reinitialize.'
      );
    }

    const results: string[] = [];

    // Create directory structure
    cardBuilder.addProgress('Creating .open-tasks/commands/ directory...');
    await fse.ensureDir(commandsDir);
    results.push('✓ .open-tasks/commands/');

    cardBuilder.addProgress('Creating .open-tasks/outputs/ directory...');
    await fse.ensureDir(outputsDir);
    results.push('✓ .open-tasks/outputs/');

    // Create config.json
    cardBuilder.addProgress('Creating configuration file...');
    const config = getDefaultConfig();
    await fs.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
    results.push('✓ .open-tasks/config.json');

    // Check if package.json exists in .open-tasks directory (for custom commands)
    cardBuilder.addProgress('Checking for .open-tasks/package.json...');
    const commandsPackageJsonPath = path.join(openTasksDir, 'package.json');
    const commandsPackageJsonExists = await fse.pathExists(commandsPackageJsonPath);

    if (!commandsPackageJsonExists) {
      // Create package.json for custom commands (ES modules)
      const commandsPackageJson = {
        type: 'module',
      };

      await fs.writeFile(
        commandsPackageJsonPath,
        JSON.stringify(commandsPackageJson, null, 2),
        'utf-8'
      );
      results.push('✓ .open-tasks/package.json (ES module support)');
    }

    // Check if package.json exists in root
    cardBuilder.addProgress('Checking for root package.json...');
    const packageJsonPath = path.join(context.cwd, 'package.json');
    const packageJsonExists = await fse.pathExists(packageJsonPath);

    if (!packageJsonExists) {
      cardBuilder.addProgress('Creating root package.json...');
      // Create basic package.json
      const packageJson = {
        name: path.basename(context.cwd),
        version: '1.0.0',
        type: 'module',
        scripts: {
          'open-tasks': 'open-tasks',
        },
        dependencies: {},
      };

      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2),
        'utf-8'
      );
      results.push('✓ package.json');
    }

    cardBuilder.addProgress('Initialization complete!');

    // Add card with initialization details
    const details = [
      `Project Directory: ${path.basename(context.cwd)}`,
      `Open Tasks Directory: ${openTasksDir}`,
      `Files Created: ${results.length}`,
      `Force Mode: ${force ? 'Yes' : 'No'}`,
      ``,
      `Created Files:`,
      ...results,
      ``,
      `Next Steps:`,
      `  1. npm install open-tasks-cli`,
      `  2. open-tasks create my-command`,
      `  3. open-tasks my-command`,
    ].join('\n');
    
    cardBuilder.addCard('🎉 Project Initialized', details, 'success');

    const message = [
      'Project initialized successfully!',
      '',
      'Created:',
      ...results.map((r) => `  - ${r}`),
      '',
      'Next steps:',
      '  1. Run: npm install open-tasks-cli',
      '  2. Create a command: open-tasks create my-command',
      '  3. Run your command: open-tasks my-command',
    ].join('\n');

    // Create a reference with the results
    const ref = context.referenceManager.createReference(
      'init-result',
      message,
      'init'
    );

    return ref;
  }
}
