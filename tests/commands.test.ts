import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { DirectoryOutputContext } from '../src/directory-output-context.js';
import { SetCommand } from '../src/commands/set.js';
import { ReadCommand } from '../src/commands/read.js';
import { WriteCommand } from '../src/commands/write.js';
import { TemplateCommand } from '../src/commands/template.js';
import { MatchCommand } from '../src/commands/match.js';
import { TextTransformCommand } from '../src/commands/text-transform.js';
import { JsonTransformCommand } from '../src/commands/json-transform.js';
import { JoinCommand } from '../src/commands/join.js';

describe('Built-in Commands', () => {
  let context: DirectoryOutputContext;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), '.test-output');
    await fs.mkdir(testDir, { recursive: true });
    context = new DirectoryOutputContext(process.cwd(), testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('SetCommand', () => {
    it('should store a simple string value', async () => {
      const command = new SetCommand('Hello, World!');
      const refs = await context.run(command);
      
      expect(refs).toHaveLength(1);
      const content = await context.get(refs[0]);
      expect(content).toBe('Hello, World!');
    });

    it('should store a value with a token', async () => {
      const command = new SetCommand('Test Value', 'mytoken');
      const refs = await context.run(command);
      
      expect(refs).toHaveLength(1);
      expect(refs[0].token).toBe('mytoken');
      const content = await context.get(refs[0]);
      expect(content).toBe('Test Value');
    });
  });

  describe('ReadCommand', () => {
    it('should read content from a file', async () => {
      // Create a test file
      const testFile = path.join(testDir, 'test-read.txt');
      await fs.writeFile(testFile, 'File content');

      const command = new ReadCommand(testFile);
      const refs = await context.run(command);
      
      expect(refs).toHaveLength(1);
      const content = await context.get(refs[0]);
      expect(content).toBe('File content');
    });

    it('should throw error for non-existent file', async () => {
      const command = new ReadCommand('non-existent.txt');
      await expect(context.run(command)).rejects.toThrow('File not found');
    });
  });

  describe('WriteCommand', () => {
    it('should write content to a file', async () => {
      // Create content
      const contentRefs = await context.run(new SetCommand('Write this content'));
      
      // Write to file
      const outputFile = path.join(testDir, 'output.txt');
      const writeCommand = new WriteCommand(outputFile, contentRefs[0]);
      const refs = await context.run(writeCommand);
      
      // Verify file was created
      const fileContent = await fs.readFile(outputFile, 'utf-8');
      expect(fileContent).toBe('Write this content');
    });

    it('should create directory if it does not exist', async () => {
      const contentRefs = await context.run(new SetCommand('Content'));
      
      const outputFile = path.join(testDir, 'subdir', 'file.txt');
      const writeCommand = new WriteCommand(outputFile, contentRefs[0]);
      await context.run(writeCommand);
      
      const fileContent = await fs.readFile(outputFile, 'utf-8');
      expect(fileContent).toBe('Content');
    });
  });

  describe('TemplateCommand', () => {
    it('should process template with tokens from context', async () => {
      // Set tokens in context
      await context.run(new SetCommand('World', 'name'));
      await context.run(new SetCommand('2024', 'year'));
      
      // Process template
      const templateCommand = new TemplateCommand('Hello {{name}} in {{year}}!');
      const refs = await context.run(templateCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toBe('Hello World in 2024!');
    });

    it('should process template from StringRef', async () => {
      // Create template as StringRef
      const templateRefs = await context.run(new SetCommand('Name: {{username}}'));
      await context.run(new SetCommand('Alice', 'username'));
      
      // Process template
      const templateCommand = new TemplateCommand(templateRefs[0]);
      const refs = await context.run(templateCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toBe('Name: Alice');
    });

    it('should leave unmatched tokens as-is', async () => {
      const templateCommand = new TemplateCommand('Hello {{unknown}}!');
      const refs = await context.run(templateCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toBe('Hello {{unknown}}!');
    });
  });

  describe('MatchCommand', () => {
    it('should match regex and assign to tokens', async () => {
      const textRefs = await context.run(new SetCommand('John Doe, age 30'));
      
      const matchCommand = new MatchCommand(
        textRefs[0],
        /(\w+) (\w+), age (\d+)/,
        ['firstName', 'lastName', 'age']
      );
      const refs = await context.run(matchCommand);
      
      expect(refs).toHaveLength(3);
      
      const firstName = await context.get(refs[0]);
      const lastName = await context.get(refs[1]);
      const age = await context.get(refs[2]);
      
      expect(firstName).toBe('John');
      expect(lastName).toBe('Doe');
      expect(age).toBe('30');
      expect(refs[0].token).toBe('firstName');
      expect(refs[1].token).toBe('lastName');
      expect(refs[2].token).toBe('age');
    });

    it('should work with string regex pattern', async () => {
      const textRefs = await context.run(new SetCommand('Price: $42.99'));
      
      const matchCommand = new MatchCommand(
        textRefs[0],
        '\\$([0-9.]+)',
        ['price']
      );
      const refs = await context.run(matchCommand);
      
      expect(refs).toHaveLength(1);
      const price = await context.get(refs[0]);
      expect(price).toBe('42.99');
    });

    it('should throw error when no match found', async () => {
      const textRefs = await context.run(new SetCommand('No match here'));
      
      const matchCommand = new MatchCommand(textRefs[0], /xyz/, ['token']);
      await expect(context.run(matchCommand)).rejects.toThrow('No match found');
    });
  });

  describe('TextTransformCommand', () => {
    it('should transform text to uppercase', async () => {
      const textRefs = await context.run(new SetCommand('hello world'));
      
      const transformCommand = new TextTransformCommand(
        textRefs[0],
        (s) => s.toUpperCase()
      );
      const refs = await context.run(transformCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toBe('HELLO WORLD');
    });

    it('should apply custom transformation', async () => {
      const textRefs = await context.run(new SetCommand('  trim me  '));
      
      const transformCommand = new TextTransformCommand(
        textRefs[0],
        (s) => s.trim()
      );
      const refs = await context.run(transformCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toBe('trim me');
    });
  });

  describe('JsonTransformCommand', () => {
    it('should parse JSON and transform', async () => {
      const jsonRefs = await context.run(
        new SetCommand('{"name": "John", "age": 30}')
      );
      
      const transformCommand = new JsonTransformCommand(
        jsonRefs[0],
        (obj) => obj.name
      );
      const refs = await context.run(transformCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toBe('John');
    });

    it('should serialize non-string results', async () => {
      const jsonRefs = await context.run(
        new SetCommand('{"items": [1, 2, 3]}')
      );
      
      const transformCommand = new JsonTransformCommand(
        jsonRefs[0],
        (obj) => obj.items
      );
      const refs = await context.run(transformCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toContain('[\n  1,\n  2,\n  3\n]');
    });

    it('should throw error for invalid JSON', async () => {
      const textRefs = await context.run(new SetCommand('not json'));
      
      const transformCommand = new JsonTransformCommand(
        textRefs[0],
        (obj) => obj
      );
      await expect(context.run(transformCommand)).rejects.toThrow(
        'Failed to parse JSON'
      );
    });
  });

  describe('JoinCommand', () => {
    it('should join string literals', async () => {
      const joinCommand = new JoinCommand(['Hello', ', ', 'World', '!']);
      const refs = await context.run(joinCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toBe('Hello, World!');
    });

    it('should join StringRefs', async () => {
      const part1 = await context.run(new SetCommand('Hello'));
      const part2 = await context.run(new SetCommand('World'));
      
      const joinCommand = new JoinCommand([part1[0], ' ', part2[0]]);
      const refs = await context.run(joinCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toBe('Hello World');
    });

    it('should join mixed strings and StringRefs', async () => {
      const name = await context.run(new SetCommand('Alice'));
      
      const joinCommand = new JoinCommand([
        'Hello, ',
        name[0],
        '! Welcome to ',
        'the app',
      ]);
      const refs = await context.run(joinCommand);
      
      const content = await context.get(refs[0]);
      expect(content).toBe('Hello, Alice! Welcome to the app');
    });
  });
});
