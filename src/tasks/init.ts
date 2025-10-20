import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { ExecutionContext,ITaskHandler, IFlow, IOutputSynk, ReferenceHandle } from '../types.js';
import { getDefaultConfig } from '../config-loader.js';
import { MessageCard } from '../cards/index.js';


export default class InitCommand implements ITaskHandler {  
  name = 'init';
  description = 'Initialize a new open-tasks project';
  examples = [
    'ot init',
    'ot init --force',
    'ot init --verbose',
  ];

  async execute(args: string[], context: ExecutionContext): Promise<ReferenceHandle> {
    const verbosity = context.verbosity || 'summary';
    const force = args.includes('--force');
    const openTasksDir = path.join(context.cwd, '.open-tasks');
    const tasksDir = path.join(openTasksDir, 'tasks');
    const outputsDir = path.join(openTasksDir, 'outputs');
    const configPath = path.join(openTasksDir, 'config.json');

    const exists = await fse.pathExists(openTasksDir);
    if (exists && !force) {
      throw new Error('Project already initialized. Use --force to reinitialize.');
    }

    const results: string[] = [];
    await fse.ensureDir(tasksDir);
    results.push('✓ .open-tasks/tasks/');
    await fse.ensureDir(outputsDir);
    results.push('✓ .open-tasks/outputs/');

    const defaultConfig = getDefaultConfig();
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    results.push('✓ .open-tasks/config.json');

    const commandsPackageJsonPath = path.join(openTasksDir, 'package.json');
    const commandsPackageJsonExists = await fse.pathExists(commandsPackageJsonPath);
    if (!commandsPackageJsonExists) {
      const commandsPackageJson = { type: 'module' };
      await fs.writeFile(commandsPackageJsonPath, JSON.stringify(commandsPackageJson, null, 2), 'utf-8');
      results.push('✓ .open-tasks/package.json (ES module support)');
    }

    const packageJsonPath = path.join(context.cwd, 'package.json');
    const packageJsonExists = await fse.pathExists(packageJsonPath);
    if (!packageJsonExists) {
      const packageJson = {
        name: path.basename(context.cwd),
        version: '1.0.0',
        type: 'module',
        scripts: { 'ot': 'ot' },
        dependencies: {},
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
      results.push('✓ package.json');
    }

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
      `  1. npm install @bitcobblers/open-tasks`,
      `  2. ot create my-command`,
      `  3. ot my-command`,
    ].join('\n');
    
    if (verbosity !== 'quiet') {
      console.log(new MessageCard('🎉 Project Initialized', details, 'success').build());
    }

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
