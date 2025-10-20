import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { ExecutionContext, ReferenceHandle, IOutputSynk } from '../types.js';
import { TaskHandler } from '../task-handler.js';
import { IFlow } from '../types.js';
import { MessageCard } from '../cards/MessageCard.js';

/**
 * Create command - scaffolds a new custom command template
 */
export default class CreateCommand extends TaskHandler {
  name = 'create';
  description = 'Create a new custom command template';
  examples = [
    'open-tasks create my-command',
    'open-tasks create my-command --typescript',
    'open-tasks create my-command --description "My custom command"',
  ];

  protected override async executeCommand(
    config: Record<string, any>,
    args: string[],
    workflowContext: IFlow,
    outputBuilder: IOutputSynk
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
    outputBuilder.write('Validating command name...');
    if (!/^[a-z0-9-]+$/.test(commandName)) {
      throw new Error(
        'Command name must be kebab-case (lowercase letters, numbers, and hyphens only)'
      );
    }

    const commandsDir = path.join(workflowContext.cwd, '.open-tasks', 'commands');

    // Check if commands directory exists
    outputBuilder.write('Checking project initialization...');
    const commandsDirExists = await fse.pathExists(commandsDir);
    if (!commandsDirExists) {
      throw new Error(
        'Commands directory does not exist. Run "open-tasks init" first.'
      );
    }

    const extension = typescript ? 'ts' : 'js';
    const commandPath = path.join(commandsDir, `${commandName}.${extension}`);

    // Check if command already exists
    outputBuilder.write('Checking if command exists...');
    const exists = await fse.pathExists(commandPath);
    if (exists) {
      throw new Error(
        `Command "${commandName}" already exists at ${commandPath}`
      );
    }

    // Generate template
    outputBuilder.write('Generating command template...');
    const template = this.generateTemplate(
      commandName,
      description,
      typescript
    );

    // Write template file
    outputBuilder.write('Writing template file...');
    await fs.writeFile(commandPath, template, 'utf-8');

    const message = [
      `Created command: ${commandName}`,
      `Location: ${commandPath}`,
      '',
      'Next steps:',
      `  1. Edit ${commandPath} to implement your command logic`,
      `  2. Run your command: open-tasks ${commandName}`,
    ].join('\n');

    const ref: ReferenceHandle = {
      id: 'create-result',
      content: message,
      token: 'create',
      timestamp: new Date(),
    };

    // Add visual card
    const details = [
      `Command Name: ${commandName}`,
      `Language: ${typescript ? 'TypeScript' : 'JavaScript'}`,
      `Description: ${description}`,
      `Location: ${commandPath}`,
      `Template Size: ${template.length} characters`,
      ``,
      `Next Steps:`,
      `  1. Edit ${commandPath}`,
      `  2. Implement command logic`,
      `  3. Run: open-tasks ${commandName}`,
    ].join('\n');

    outputBuilder.write(new MessageCard('🎨 Command Created', details, 'success'));

    return ref;
  }

  private generateTemplate(
    name: string,
    description: string,
    typescript: boolean
  ): string {
    if (typescript) {
      return `import { TaskHandler, ExecutionContext, ReferenceHandle, IOutputSynk, IFlow } from 'open-tasks-cli';
import { MessageCard } from 'open-tasks-cli/cards';

/**
 * ${description}
 * 
 * This is a demo command that shows how to:
 * - Accept command arguments
 * - Use the output builder to create visual output
 * - Store and return results
 */
export default class ${this.toPascalCase(name)}Command extends TaskHandler {
  name = '${name}';
  description = '${description}';
  examples = [
    'open-tasks ${name}',
    'open-tasks ${name} "Alice"',
    'open-tasks ${name} "Bob" --token greeting',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    workflowContext: IFlow,
    outputBuilder: IOutputSynk
  ): Promise<ReferenceHandle> {
    // Get the name from arguments (default to "World")
    const userName = args[0] || 'World';
    
    outputBuilder.write('Creating greeting...');
    
    // Create the hello world template
    const template = 'Hello, {{name}}! Welcome to open-tasks CLI.';
    
    outputBuilder.write('Replacing name placeholder...');
    
    // Replace the placeholder with the actual name
    const greeting = template.replace('{{name}}', userName);
    
    outputBuilder.write('Building result...');
    
    // Store the result
    const token = args.find((arg, i) => args[i - 1] === '--token');
    const ref: ReferenceHandle = {
      id: '${name}-result',
      content: greeting,
      token: token || '${name}',
      timestamp: new Date(),
    };
    
    // Create a visual card showing what we did
    const details = [
      \`Template: \${template}\`,
      \`User Name: \${userName}\`,
      \`Result: \${greeting}\`,
      \`Token: \${token || 'none'}\`,
    ].join('\\n');
    
    outputBuilder.write(new MessageCard('👋 Hello World Demo', details, 'success'));
    
    return ref;
  }
}
`;
    } else {
      return `import { MessageCard } from 'open-tasks-cli/cards';

/**
 * ${description}
 * 
 * This is a demo command that shows how to:
 * - Accept command arguments
 * - Use the output builder to create visual output
 * - Store and return results
 */
export default class ${this.toPascalCase(name)}Command {
  name = '${name}';
  description = '${description}';
  examples = [
    'open-tasks ${name}',
    'open-tasks ${name} "Alice"',
    'open-tasks ${name} "Bob" --token greeting',
  ];

  /**
   * Main execute method called by the framework
   * For JavaScript commands, implement this method directly
   */
  async execute(args, context) {
    // Get the name from arguments (default to "World")
    const userName = args[0] || 'World';
    
    context.outputSynk.write('Creating greeting...');
    
    // Create the hello world template
    const template = 'Hello, {{name}}! Welcome to open-tasks CLI.';
    
    context.outputSynk.write('Replacing name placeholder...');
    
    // Replace the placeholder with the actual name
    const greeting = template.replace('{{name}}', userName);
    
    context.outputSynk.write('Building result...');
    
    // Store the result
    const token = args.find((arg, i) => args[i - 1] === '--token');
    const ref = {
      id: '${name}-result',
      content: greeting,
      token: token || '${name}',
      timestamp: new Date(),
    };
    
    // Create a visual card showing what we did
    const details = [
      \`Template: \${template}\`,
      \`User Name: \${userName}\`,
      \`Result: \${greeting}\`,
      \`Token: \${token || 'none'}\`,
    ].join('\\n');
    
    context.outputSynk.write(new MessageCard('👋 Hello World Demo', details, 'success'));
    
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
