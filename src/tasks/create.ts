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
    'ot create my-command',
    'ot create my-command --example',
    'ot create my-command --javascript',
    'ot create my-command --description "My custom command"',
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
    const typescript = !args.includes('--javascript');
    const isExample = args.includes('--example');
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

    const commandsDir = path.join(workflowContext.cwd, '.open-tasks');

    // Check if commands directory exists
    outputBuilder.write('Checking project initialization...');
    const commandsDirExists = await fse.pathExists(commandsDir);
    if (!commandsDirExists) {
      throw new Error(
        'Commands directory does not exist. Run "ot init" first.'
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
      typescript,
      isExample
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
      `  2. Run your command: ot ${commandName}`,
    ].join('\n');

    const ref: ReferenceHandle = {
      id: 'create-result',
      content: message,
      token: 'create',
      timestamp: new Date(),
    };

    // Add visual card
    const templateType = isExample ? 'Example (Hello World)' : 'Minimal (Bare-bones)';
    const details = [
      `Command Name: ${commandName}`,
      `Template Type: ${templateType}`,
      `Language: ${typescript ? 'TypeScript' : 'JavaScript'}`,
      `Description: ${description}`,
      `Location: ${commandPath}`,
      ``,
      `Next Steps:`,
      `  1. Edit ${commandPath}`,
      `  2. Implement command logic`,
      `  3. Run: ot ${commandName}`,
    ].join('\n');

    outputBuilder.write(new MessageCard('🎨 Command Created', details, 'success'));

    return ref;
  }

  private generateTemplate(
    name: string,
    description: string,
    typescript: boolean,
    isExample: boolean
  ): string {
    if (isExample) {
      return this.generateExampleTemplate(name, description, typescript);
    } else {
      return this.generateMinimalTemplate(name, description, typescript);
    }
  }

  private generateMinimalTemplate(
    name: string,
    description: string,
    typescript: boolean
  ): string {
    if (typescript) {
      return `/**
 * ${description}
 */
export default class ${this.toPascalCase(name)}Command {
  name = '${name}';
  description = '${description}';
  examples = [
    'ot ${name}',
    'ot ${name} [args]',
  ];

  async execute(args: string[], context: any): Promise<any> {
    // Get workflow context and output synk
    const flow = context.workflowContext;
    const output = context.outputSynk;

    // TODO: Implement your command logic here
    output.writeInfo('Executing ${name} command...');

    // Return a reference handle with your result
    return {
      id: '${name}-result',
      content: 'Command executed successfully',
      token: '${name}',
      timestamp: new Date(),
    };
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
    'ot ${name}',
    'ot ${name} [args]',
  ];

  async execute(args, context) {
    // Get workflow context and output synk
    const flow = context.workflowContext;
    const output = context.outputSynk;

    // TODO: Implement your command logic here
    output.writeInfo('Executing ${name} command...');

    // Return a reference handle with your result
    return {
      id: '${name}-result',
      content: 'Command executed successfully',
      token: '${name}',
      timestamp: new Date(),
    };
  }
}
`;
    }
  }

  private generateExampleTemplate(
    name: string,
    description: string,
    typescript: boolean
  ): string {
    const typeAnnotations = typescript;
    const t = (type: string) => typeAnnotations ? `: ${type}` : '';
    const privateKeyword = typeAnnotations ? 'private ' : '';
    
    return `/**
 * ${description}
 * 
 * This demo shows how to compose workflows using IFlow commands.
 * Each step is a single-responsibility command that can be reused.
 * 
 * Workflow steps:
 * 1. SetCommand - Store template in memory
 * 2. SetCommand - Store user name in memory  
 * 3. ReplaceCommand - Replace placeholders in template
 * 4. Custom command - Display result as a card
 */

// ===== TokenDecorator - Adds a token to a reference =====
class TokenDecorator {
  constructor(${privateKeyword}token${t('string')}) ${typeAnnotations ? '{}' : `{
    this.token = token;
  }`}
  ${!typeAnnotations ? '\n' : ''}
  decorate(ref${t('any')})${t('any')} {
    return { ...ref, token: this.token };
  }
}

// ===== Step 1 & 2: SetCommand - Store values in workflow context =====
class SetCommand {
  constructor(${privateKeyword}value${t('any')}, ${privateKeyword}token${t('string')}) ${typeAnnotations ? '{}' : `{
    this.value = value;
    this.token = token;
  }`}
  ${!typeAnnotations ? '\n' : ''}
  async execute(context${t('any')}, args${t('any[]')})${t('Promise<[any, any[]][]>')} {
    // Return tuple of [value, decorators[]]
    const decorators${t('any[]')} = this.token ? [new TokenDecorator(this.token)] : [];
    return [[this.value, decorators]];
  }
}

// ===== Step 3: ReplaceCommand - Replace placeholders in template =====
class ReplaceCommand {
  constructor(
    ${privateKeyword}templateRef${t('any')},
    ${privateKeyword}replacements${t('Record<string, string>')}
  ) ${typeAnnotations ? '{}' : `{
    this.templateRef = templateRef;
    this.replacements = replacements;
  }`}
  ${!typeAnnotations ? '\n' : ''}
  async execute(context${t('any')}, args${t('any[]')})${t('Promise<[any, any[]][]>')} {
    const template = await context.get(this.templateRef);
    if (!template) {
      throw new Error(\`Template not found: \${this.templateRef.token}\`);
    }

    let result = template;
    for (const [key, value] of Object.entries(this.replacements)) {
      const placeholder = '{{' + key + '}}';
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }

    // Return tuple of [value, decorators[]]
    return [[result, []]];
  }
}

// ===== Step 4: DisplayCardCommand - Show result as formatted card =====
class DisplayCardCommand {
  constructor(${privateKeyword}valueRef${t('any')}, ${privateKeyword}metadata${t('any')} = {}) ${typeAnnotations ? '{}' : `{
    this.valueRef = valueRef;
    this.metadata = metadata;
  }`}
  ${!typeAnnotations ? '\n' : ''}
  async execute(context${t('any')}, args${t('any[]')}, cardBuilder${t('any')})${t('Promise<[any, any[]][]>')} {
    const value = await context.get(this.valueRef);
    if (!value) {
      throw new Error(\`Value not found: \${this.valueRef.token}\`);
    }

    // Use the provided card builder or fall back to console
    if (cardBuilder && typeof cardBuilder.build === 'function') {
      console.log(cardBuilder.build());
    } else {
      // Simple formatted output
      console.log('');
      console.log('👋 Hello World Demo');
      console.log('─'.repeat(50));
      console.log(\`Template: \${this.metadata.template || 'N/A'}\`);
      console.log(\`User Name: \${this.metadata.userName || 'N/A'}\`);
      console.log(\`Result: \${value}\`);
      console.log(\`Token: \${this.valueRef.token || 'none'}\`);
      console.log('');
    }

    // Return${typeAnnotations ? ' empty' : ''} tuple${typeAnnotations ? ' (this command doesn\'t store anything, just displays)' : ''}
    return [];
  }
}

// ===== Main Command Handler =====
export default class ${this.toPascalCase(name)}Command {
  name = '${name}';
  description = '${description}';
  examples = [
    'ot ${name}',
    'open-tasks ${name} "Alice"',
    'open-tasks ${name} "Bob" --token greeting',
  ];

  async execute(args${t('string[]')}, context${t('any')})${t('Promise<any>')} {
    const flow = context.workflowContext;
    const userName = args[0] || 'World';

    context.outputSynk.write('Step 1: Storing template in memory...');
    
    // Step 1: Store template
    const template = 'Hello, {{name}}! Welcome to Open Tasks CLI.';
    const templateRefs = await flow.run(new SetCommand(template, 'template'));
    const templateRef = templateRefs[0];

    context.outputSynk.write('Step 2: Storing user name in memory...');
    
    // Step 2: Store user name
    const nameRefs = await flow.run(new SetCommand(userName, 'userName'));
    
    context.outputSynk.write('Step 3: Replacing placeholders...');
    
    // Step 3: Replace placeholders
    const resultRefs = await flow.run(
      new ReplaceCommand(templateRef, { name: userName })
    );
    const resultRef = resultRefs[0];
    resultRef.token = '${name}-result';

    context.outputSynk.write('Step 4: Displaying result...');
    
    // Step 4: Display as card
    await flow.run(
      new DisplayCardCommand(resultRef, { template, userName })
    );

    // Return the final result reference
    return {
      id: resultRef.id,
      content: await flow.get(resultRef),
      token: resultRef.token,
      timestamp: resultRef.timestamp,
    };
  }
}
`;
  }

  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}
