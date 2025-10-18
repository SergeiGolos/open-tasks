import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { CommandHandler, ExecutionContext, ReferenceHandle } from '../types.js';

/**
 * Create command - scaffolds a new custom command template
 */
export default class CreateCommand extends CommandHandler {
  name = 'create';
  description = 'Create a new custom command template';
  examples = [
    'open-tasks create my-command',
    'open-tasks create my-command --typescript',
    'open-tasks create my-command --description "My custom command"',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Create command requires a command name argument');
    }

    const commandName = args[0];
    const typescript = args.includes('--typescript');
    const descriptionIndex = args.indexOf('--description');
    const description =
      descriptionIndex !== -1 && args[descriptionIndex + 1]
        ? args[descriptionIndex + 1]
        : 'Custom command';

    // Validate command name
    if (!/^[a-z0-9-]+$/.test(commandName)) {
      throw new Error(
        'Command name must be kebab-case (lowercase letters, numbers, and hyphens only)'
      );
    }

    const commandsDir = path.join(context.cwd, '.open-tasks', 'commands');

    // Check if commands directory exists
    const commandsDirExists = await fse.pathExists(commandsDir);
    if (!commandsDirExists) {
      throw new Error(
        'Commands directory does not exist. Run "open-tasks init" first.'
      );
    }

    const extension = typescript ? 'ts' : 'js';
    const commandPath = path.join(commandsDir, `${commandName}.${extension}`);

    // Check if command already exists
    const exists = await fse.pathExists(commandPath);
    if (exists) {
      throw new Error(
        `Command "${commandName}" already exists at ${commandPath}`
      );
    }

    // Generate template
    const template = this.generateTemplate(
      commandName,
      description,
      typescript
    );

    // Write template file
    await fs.writeFile(commandPath, template, 'utf-8');

    const message = [
      `Created command: ${commandName}`,
      `Location: ${commandPath}`,
      '',
      'Next steps:',
      `  1. Edit ${commandPath} to implement your command logic`,
      `  2. Run your command: open-tasks ${commandName}`,
    ].join('\n');

    const ref = context.referenceManager.createReference(
      'create-result',
      message,
      'create'
    );

    return ref;
  }

  private generateTemplate(
    name: string,
    description: string,
    typescript: boolean
  ): string {
    if (typescript) {
      return `import { CommandHandler, ExecutionContext, ReferenceHandle } from 'open-tasks-cli';

/**
 * ${description}
 */
export default class ${this.toPascalCase(name)}Command extends CommandHandler {
  name = '${name}';
  description = '${description}';
  examples = [
    'open-tasks ${name}',
    'open-tasks ${name} arg1 --token mytoken',
  ];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    // TODO: Implement your command logic here
    
    // Example: Access arguments
    const firstArg = args[0];
    
    // Example: Access references
    const tokenValue = args.find((arg, i) => args[i - 1] === '--ref');
    if (tokenValue) {
      const ref = refs.get(tokenValue);
      console.log('Reference content:', ref?.content);
    }
    
    // Example: Store a result
    const result = 'Command executed successfully!';
    const ref = context.referenceManager.createReference(
      '${name}-result',
      result,
      '${name}'
    );
    
    return ref;
  }
}
`;
    } else {
      return `/**
 * ${description}
 */
export default class ${this.toPascalCase(name)}Command {
  name = '${name}';
  description = '${description}';
  examples = [
    'open-tasks ${name}',
    'open-tasks ${name} arg1 --token mytoken',
  ];

  async execute(args, refs, context) {
    // TODO: Implement your command logic here
    
    // Example: Access arguments
    const firstArg = args[0];
    
    // Example: Access references
    const tokenValue = args.find((arg, i) => args[i - 1] === '--ref');
    if (tokenValue) {
      const ref = refs.get(tokenValue);
      console.log('Reference content:', ref?.content);
    }
    
    // Example: Store a result
    const result = 'Command executed successfully!';
    const ref = context.referenceManager.createReference(
      '${name}-result',
      result,
      '${name}'
    );
    
    return ref;
  }
}
`;
    }
  }

  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}
