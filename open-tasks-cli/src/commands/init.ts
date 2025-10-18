import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { CommandHandler, ExecutionContext, ReferenceHandle } from '../types.js';
import { getDefaultConfig } from '../config-loader.js';

/**
 * Init command - initializes a new open-tasks project
 */
export default class InitCommand extends CommandHandler {
  name = 'init';
  description = 'Initialize a new open-tasks project';
  examples = [
    'open-tasks init',
    'open-tasks init --force',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const force = args.includes('--force');
    const openTasksDir = path.join(context.cwd, '.open-tasks');
    const commandsDir = path.join(openTasksDir, 'commands');
    const outputsDir = path.join(openTasksDir, 'outputs');
    const configPath = path.join(openTasksDir, 'config.json');

    // Check if .open-tasks already exists
    const exists = await fse.pathExists(openTasksDir);
    if (exists && !force) {
      throw new Error(
        'Project already initialized. Use --force to reinitialize.'
      );
    }

    const results: string[] = [];

    // Create directory structure
    await fse.ensureDir(commandsDir);
    results.push('Created .open-tasks/commands/');

    await fse.ensureDir(outputsDir);
    results.push('Created .open-tasks/outputs/');

    // Create config.json
    const config = getDefaultConfig();
    await fs.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
    results.push('Created .open-tasks/config.json');

    // Check if package.json exists in .open-tasks directory (for custom commands)
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
      results.push('Created .open-tasks/package.json (for ES module support)');
    }

    // Check if package.json exists in root
    const packageJsonPath = path.join(context.cwd, 'package.json');
    const packageJsonExists = await fse.pathExists(packageJsonPath);

    if (!packageJsonExists) {
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
      results.push('Created package.json');
    }

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
