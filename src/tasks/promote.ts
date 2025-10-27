import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import fse from 'fs-extra';
import { ReferenceHandle, IFlow, IOutputSynk } from '../types.js';
import { MessageCard } from '../cards/MessageCard.js';
import { TaskHandler } from '../task-handler.js';
import { TaskLogger } from '../logging/index.js';

/**
 * Promote command - copies a task and its dependencies to the user profile level
 */
export default class PromoteCommand extends TaskHandler {
  name = 'promote';
  description = 'Copy a task and its dependencies to the user profile level directory';
  examples = [
    'ot promote my-task',
    'ot promote my-command --verbose',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: IFlow,
    synk: IOutputSynk
  ): Promise<ReferenceHandle> {
    const logger = new TaskLogger(synk, this.name);
    
    if (args.length === 0) {
      logger.error('Promote command requires a task name argument');
      throw new Error('Promote command requires a task name argument');
    }

    const taskName = args[0];
    
    // Validate task name
    logger.progress('Validating task name...');
    if (!/^[a-z0-9-]+$/.test(taskName)) {
      logger.error('Task name must be kebab-case');
      throw new Error(
        'Task name must be kebab-case (lowercase letters, numbers, and hyphens only)'
      );
    }

    const projectDir = path.join(flow.cwd, '.open-tasks');
    const userDir = path.join(os.homedir(), '.open-tasks');

    // Check if project .open-tasks directory exists
    logger.progress('Checking project directory...');
    const projectDirExists = await fse.pathExists(projectDir);
    if (!projectDirExists) {
      logger.error('Project .open-tasks directory does not exist');
      throw new Error(
        'Project .open-tasks directory does not exist. Run "ot init" first.'
      );
    }

    // Find task file (could be .ts or .js)
    logger.progress(`Looking for task: ${taskName}...`);
    let sourceFile: string | null = null;
    let extension = '';

    for (const ext of ['ts', 'js']) {
      const candidatePath = path.join(projectDir, `${taskName}.${ext}`);
      if (await fse.pathExists(candidatePath)) {
        sourceFile = candidatePath;
        extension = ext;
        break;
      }
    }

    if (!sourceFile) {
      logger.error(`Task "${taskName}" not found`);
      throw new Error(
        `Task "${taskName}" not found in ${projectDir}. ` +
        `Looking for ${taskName}.ts or ${taskName}.js`
      );
    }

    // Ensure user .open-tasks directory exists
    logger.progress('Ensuring user directory exists...');
    await fse.ensureDir(userDir);
    logger.fileCreated(userDir);

    // Check if file already exists in user directory
    const destFile = path.join(userDir, `${taskName}.${extension}`);
    const destExists = await fse.pathExists(destFile);
    
    if (destExists) {
      // Create backup
      const backupFile = path.join(userDir, `${taskName}.${extension}.backup`);
      logger.info(`Backing up existing file to ${path.basename(backupFile)}...`);
      await fse.copy(destFile, backupFile);
      logger.fileCreated(path.basename(backupFile));
    }

    // Copy the task file
    logger.progress('Copying task file...');
    await fse.copy(sourceFile, destFile);
    logger.fileCreated(`${taskName}.${extension}`);

    // Look for and copy any related spec files
    const specFiles: string[] = [];
    const specPath = path.join(projectDir, `${taskName}.md`);
    if (await fse.pathExists(specPath)) {
      const destSpecPath = path.join(userDir, `${taskName}.md`);
      await fse.copy(specPath, destSpecPath);
      specFiles.push(`${taskName}.md`);
      logger.fileCreated(`${taskName}.md`);
    }

    // Check for dependencies by reading the task file
    logger.progress('Analyzing dependencies...');
    const taskContent = await fs.readFile(sourceFile, 'utf-8');
    const dependencies = await this.findDependencies(taskContent, projectDir);

    // Copy dependencies
    const copiedDependencies: string[] = [];
    for (const dep of dependencies) {
      const depSourcePath = path.join(projectDir, dep);
      const depDestPath = path.join(userDir, dep);
      
      if (await fse.pathExists(depSourcePath)) {
        await fse.copy(depSourcePath, depDestPath);
        copiedDependencies.push(dep);
        logger.fileCreated(dep);
        logger.info(`Copied dependency: ${dep}`);
      }
    }

    // Create package.json in user directory if it doesn't exist
    const userPackageJsonPath = path.join(userDir, 'package.json');
    if (!await fse.pathExists(userPackageJsonPath)) {
      const packageJson = { type: 'module' };
      await fs.writeFile(userPackageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    }

    const message = [
      `Promoted task: ${taskName}`,
      `Location: ${destFile}`,
      `Dependencies copied: ${copiedDependencies.length}`,
      `Spec files copied: ${specFiles.length}`,
    ].join('\n');

    const details = [
      `Task Name: ${taskName}`,
      `Source: ${sourceFile}`,
      `Destination: ${destFile}`,
      `Extension: ${extension}`,
      `Backup Created: ${destExists ? 'Yes' : 'No'}`,
      ``,
      `Dependencies Copied: ${copiedDependencies.length}`,
      ...(copiedDependencies.length > 0 
        ? copiedDependencies.map(d => `  - ${d}`) 
        : ['  (none)']),
      ``,
      `Spec Files Copied: ${specFiles.length}`,
      ...(specFiles.length > 0 
        ? specFiles.map(s => `  - ${s}`) 
        : ['  (none)']),
      ``,
      `Next Steps:`,
      `  1. The task is now available globally`,
      `  2. Run: ot ${taskName}`,
      `  3. Edit in: ${userDir}`,
    ].join('\n');

    logger.card(new MessageCard('📦 Task Promoted', details, 'success'));
    logger.complete();

    return {
      id: 'promote-result',
      content: message,
      token: 'promote',
      timestamp: new Date(),
    };
  }

  /**
   * Find dependencies in a task file by looking for imports and requires
   */
  private async findDependencies(content: string, projectDir: string): Promise<string[]> {
    const dependencies: Set<string> = new Set();

    // Match ES6 imports from relative paths
    const importRegex = /import\s+.*?\s+from\s+['"](\.\/|\.\.\/)[^'"]+['"]/g;
    const matches = content.match(importRegex);

    if (matches) {
      for (const match of matches) {
        // Extract the path from the import statement
        const pathMatch = match.match(/['"](\.\/|\.\.\/)[^'"]+['"]/);
        if (pathMatch) {
          const importPath = pathMatch[0].slice(1, -1); // Remove quotes
          
          // Resolve relative path
          const baseName = path.basename(importPath);
          
          // Try with various extensions
          for (const ext of ['ts', 'js', 'json']) {
            const fileName = baseName.endsWith(`.${ext}`) ? baseName : `${baseName}.${ext}`;
            if (fileName !== 'types.ts' && fileName !== 'types.js') {
              // Don't copy framework types
              dependencies.add(fileName);
            }
          }
        }
      }
    }

    return Array.from(dependencies);
  }
}
