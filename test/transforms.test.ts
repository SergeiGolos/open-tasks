import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryWorkflowContext } from '../src/workflow/in-memory-context.js';
import {
  TokenReplaceCommand,
  ExtractCommand,
  RegexMatchCommand,
  SplitCommand,
  JoinCommand,
} from '../src/workflow/transforms.js';
import { TokenDecorator } from '../src/workflow/decorators.js';

describe('Transform Commands', () => {
  let context: InMemoryWorkflowContext;

  beforeEach(() => {
    context = new InMemoryWorkflowContext();
  });

  describe('TokenReplaceCommand', () => {
    it('should replace tokens in text with values from context', async () => {
      // Store some values in context
      await context.store('World', [new TokenDecorator('name')]);
      await context.store('2024', [new TokenDecorator('year')]);
      
      // Store a template
      await context.store(
        'Hello {{name}}! Welcome to {{year}}.',
        [new TokenDecorator('template')]
      );

      // Execute the replace command
      const command = new TokenReplaceCommand('template', 'result');
      const refs = await context.run(command);

      expect(refs).toHaveLength(1);
      expect(refs[0].content).toBe('Hello World! Welcome to 2024.');
      expect(refs[0].token).toBe('result');
    });

    it('should handle missing tokens by leaving them unchanged', async () => {
      await context.store(
        'Hello {{name}}! Missing: {{missing}}',
        [new TokenDecorator('template')]
      );
      await context.store('Alice', [new TokenDecorator('name')]);

      const command = new TokenReplaceCommand('template', 'result');
      const refs = await context.run(command);

      expect(refs[0].content).toBe('Hello Alice! Missing: {{missing}}');
    });

    it('should throw error if input token not found', async () => {
      const command = new TokenReplaceCommand('nonexistent', 'result');
      await expect(context.run(command)).rejects.toThrow(
        "Token 'nonexistent' not found in context"
      );
    });
  });

  describe('ExtractCommand', () => {
    it('should extract text matching a regex pattern', async () => {
      await context.store(
        'The price is $42.50 today',
        [new TokenDecorator('text')]
      );

      const command = new ExtractCommand(
        'text',
        /\$(\d+\.\d+)/,
        'price'
      );
      const refs = await context.run(command);

      expect(refs).toHaveLength(1);
      expect(refs[0].content).toBe('42.50');
      expect(refs[0].token).toBe('price');
    });

    it('should extract full match if no capture groups', async () => {
      await context.store(
        'Email: test@example.com',
        [new TokenDecorator('text')]
      );

      const command = new ExtractCommand(
        'text',
        /\S+@\S+\.\S+/,
        'email'
      );
      const refs = await context.run(command);

      expect(refs[0].content).toBe('test@example.com');
    });

    it('should throw error if pattern does not match', async () => {
      await context.store('No numbers here', [new TokenDecorator('text')]);

      const command = new ExtractCommand('text', /\d+/, 'number');
      await expect(context.run(command)).rejects.toThrow(
        "Pattern did not match in content from token 'text'"
      );
    });
  });

  describe('RegexMatchCommand', () => {
    it('should find all matches for a global pattern', async () => {
      await context.store(
        'Colors: red, blue, green, yellow',
        [new TokenDecorator('text')]
      );

      const command = new RegexMatchCommand(
        'text',
        /\b\w+(?=,|\b)/g,
        'colors'
      );
      const refs = await context.run(command);

      expect(refs).toHaveLength(1);
      const lines = refs[0].content.split('\n');
      expect(lines).toHaveLength(5); // Colors:, red, blue, green, yellow
    });

    it('should include capture groups in output', async () => {
      await context.store(
        'Version 1.2.3 and Version 4.5.6',
        [new TokenDecorator('text')]
      );

      const command = new RegexMatchCommand(
        'text',
        /Version (\d+)\.(\d+)\.(\d+)/g,
        'versions'
      );
      const refs = await context.run(command);

      expect(refs[0].content).toContain('groups:');
      expect(refs[0].content).toContain('1, 2, 3');
      expect(refs[0].content).toContain('4, 5, 6');
    });
  });

  describe('SplitCommand', () => {
    it('should split text by delimiter into multiple refs', async () => {
      await context.store(
        'apple,banana,cherry',
        [new TokenDecorator('fruits')]
      );

      const command = new SplitCommand('fruits', ',', 'fruit');
      const refs = await context.run(command);

      expect(refs).toHaveLength(3);
      expect(refs[0].content).toBe('apple');
      expect(refs[0].token).toBe('fruit-1');
      expect(refs[1].content).toBe('banana');
      expect(refs[1].token).toBe('fruit-2');
      expect(refs[2].content).toBe('cherry');
      expect(refs[2].token).toBe('fruit-3');
    });

    it('should split by regex pattern', async () => {
      await context.store(
        'one123two456three',
        [new TokenDecorator('text')]
      );

      const command = new SplitCommand('text', /\d+/, 'part');
      const refs = await context.run(command);

      expect(refs).toHaveLength(3);
      expect(refs[0].content).toBe('one');
      expect(refs[1].content).toBe('two');
      expect(refs[2].content).toBe('three');
    });
  });

  describe('JoinCommand', () => {
    it('should join multiple tokens into single output', async () => {
      await context.store('First', [new TokenDecorator('part1')]);
      await context.store('Second', [new TokenDecorator('part2')]);
      await context.store('Third', [new TokenDecorator('part3')]);

      const command = new JoinCommand(
        ['part1', 'part2', 'part3'],
        ' - ',
        'result'
      );
      const refs = await context.run(command);

      expect(refs).toHaveLength(1);
      expect(refs[0].content).toBe('First - Second - Third');
      expect(refs[0].token).toBe('result');
    });

    it('should use newline as default delimiter', async () => {
      await context.store('Line 1', [new TokenDecorator('line1')]);
      await context.store('Line 2', [new TokenDecorator('line2')]);

      const command = new JoinCommand(['line1', 'line2'], undefined, 'result');
      const refs = await context.run(command);

      expect(refs[0].content).toBe('Line 1\nLine 2');
    });

    it('should throw error if any token is missing', async () => {
      await context.store('First', [new TokenDecorator('part1')]);

      const command = new JoinCommand(['part1', 'part2'], ', ', 'result');
      await expect(context.run(command)).rejects.toThrow(
        "Token 'part2' not found in context"
      );
    });
  });

  describe('Command Chaining', () => {
    it('should chain multiple transform commands', async () => {
      // Store initial data
      await context.store(
        'Product: iPhone costs $999.99',
        [new TokenDecorator('description')]
      );

      // Extract the price
      const extractCmd = new ExtractCommand(
        'description',
        /\$(\d+\.\d+)/,
        'price'
      );
      await context.run(extractCmd);

      // Create a template using the price
      await context.store(
        'The price is {{price}} dollars',
        [new TokenDecorator('template')]
      );

      // Replace tokens
      const replaceCmd = new TokenReplaceCommand('template', 'final');
      const refs = await context.run(replaceCmd);

      expect(refs[0].content).toBe('The price is 999.99 dollars');
    });
  });

  describe('Metadata Tracking', () => {
    it('should track transform metadata in StringRef', async () => {
      // Store initial data
      await context.store('Hello World', [new TokenDecorator('greeting')]);

      // Apply a transform
      await context.store('Test: {{greeting}}', [new TokenDecorator('template')]);
      const command = new TokenReplaceCommand('template', 'result');
      const refs = await context.run(command);

      // Check metadata is present
      expect(refs[0].metadata).toBeDefined();
      expect(refs[0].metadata).toHaveLength(1);
      expect(refs[0].metadata![0].type).toBe('TokenReplace');
      expect(refs[0].metadata![0].inputs).toContain('template');
      expect(refs[0].metadata![0].timestamp).toBeInstanceOf(Date);
    });

    it('should track multiple transforms with detailed params', async () => {
      // Store some data
      await context.store('version 1.2.3 and version 4.5.6', [
        new TokenDecorator('text'),
      ]);

      // Apply regex match
      const matchCmd = new RegexMatchCommand(
        'text',
        /version (\d+)\.(\d+)\.(\d+)/gi,
        'versions'
      );
      const refs = await context.run(matchCmd);

      // Verify metadata
      expect(refs[0].metadata).toBeDefined();
      expect(refs[0].metadata![0].type).toBe('RegexMatch');
      expect(refs[0].metadata![0].params?.pattern).toBe('version (\\d+)\\.(\\d+)\\.(\\d+)');
      expect(refs[0].metadata![0].params?.flags).toBe('gi');
      expect(refs[0].metadata![0].params?.matchCount).toBe(2);
    });

    it('should track split command metadata with part info', async () => {
      await context.store('apple,banana,cherry', [new TokenDecorator('fruits')]);

      const splitCmd = new SplitCommand('fruits', ',', 'fruit');
      const refs = await context.run(splitCmd);

      // Each part should have metadata
      expect(refs[0].metadata![0].params?.partIndex).toBe(1);
      expect(refs[0].metadata![0].params?.totalParts).toBe(3);
      expect(refs[2].metadata![0].params?.partIndex).toBe(3);
    });

    it('should track join command with token count', async () => {
      await context.store('First', [new TokenDecorator('part1')]);
      await context.store('Second', [new TokenDecorator('part2')]);

      const joinCmd = new JoinCommand(['part1', 'part2'], ' - ', 'result');
      const refs = await context.run(joinCmd);

      expect(refs[0].metadata![0].type).toBe('Join');
      expect(refs[0].metadata![0].inputs).toEqual(['part1', 'part2']);
      expect(refs[0].metadata![0].params?.tokenCount).toBe(2);
    });
  });
});
