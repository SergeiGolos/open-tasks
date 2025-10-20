import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { DirectoryOutputContext } from '../src/directory-output-context.js';
import {
  TokenReplaceCommand,
  ExtractCommand,
  JoinCommand,
  SplitCommand,
} from '../src/workflow/transforms.js';
import { TokenDecorator } from '../src/decorators.js';

describe('End-to-End Workflow Tests', () => {
  const testOutputDir = path.join(process.cwd(), 'test-outputs-e2e');
  let context: DirectoryOutputContext;

  beforeEach(async () => {
    // Create fresh output directory for each test
    await fse.ensureDir(testOutputDir);
    context = new DirectoryOutputContext(testOutputDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fse.remove(testOutputDir);
  });

  describe('File I/O Operations', () => {
    it('should store data to files with timestamps', async () => {
      const ref = await context.store('Hello World', [
        new TokenDecorator('greeting'),
      ]);

      // Verify file was created
      expect(ref.fileName).toBeDefined();
      const filePath = path.join(testOutputDir, ref.fileName!);
      const exists = await fse.pathExists(filePath);
      expect(exists).toBe(true);

      // Verify content
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Hello World');
    });

    it('should load data from files', async () => {
      // Create a test file
      const testFile = path.join(testOutputDir, 'test-data.txt');
      await fs.writeFile(testFile, 'Loaded content', 'utf-8');

      // Load it
      const ref = await context.load(testFile, 'loaded');

      // Verify content is accessible
      expect(ref.content).toBe('Loaded content');
      expect(ref.token).toBe('loaded');
      expect(context.token('loaded')).toBe('Loaded content');
    });

    it('should persist metadata as YAML frontmatter', async () => {
      // Store initial data
      await context.store('Template: {{value}}', [
        new TokenDecorator('template'),
      ]);
      await context.store('42', [new TokenDecorator('value')]);

      // Apply transform
      const cmd = new TokenReplaceCommand('template', 'result');
      const refs = await context.run(cmd);

      // Read file and check for metadata
      const filePath = path.join(testOutputDir, refs[0].fileName!);
      const content = await fs.readFile(filePath, 'utf-8');

      expect(content).toContain('---');
      expect(content).toContain('transforms:');
      expect(content).toContain('type: TokenReplace');
      expect(content).toContain('inputs: [template]');
      expect(content).toContain('Template: 42');
    });
  });

  describe('Complete Workflow Chains', () => {
    it('should execute data extraction and formatting workflow', async () => {
      // Step 1: Store raw data
      await context.store(
        'Order #12345: Total $299.99, Discount $50.00',
        [new TokenDecorator('order')]
      );

      // Step 2: Extract order number
      const extractOrderCmd = new ExtractCommand(
        'order',
        /#(\d+)/,
        'orderNumber'
      );
      await context.run(extractOrderCmd);

      // Step 3: Extract total
      const extractTotalCmd = new ExtractCommand(
        'order',
        /Total \$(\d+\.\d+)/,
        'total'
      );
      await context.run(extractTotalCmd);

      // Step 4: Create formatted output
      await context.store(
        'Order {{orderNumber}} - Amount: ${{total}}',
        [new TokenDecorator('template')]
      );

      const formatCmd = new TokenReplaceCommand('template', 'formatted');
      const refs = await context.run(formatCmd);

      // Verify result
      expect(refs[0].content).toBe('Order 12345 - Amount: $299.99');

      // Verify file exists
      const filePath = path.join(testOutputDir, refs[0].fileName!);
      const exists = await fse.pathExists(filePath);
      expect(exists).toBe(true);
    });

    it('should handle split and rejoin workflow', async () => {
      // Step 1: Store CSV data
      await context.store('apple,banana,cherry,date', [
        new TokenDecorator('fruits'),
      ]);

      // Step 2: Split into parts
      const splitCmd = new SplitCommand('fruits', ',', 'fruit');
      const parts = await context.run(splitCmd);

      // Verify split created multiple files
      expect(parts).toHaveLength(4);
      for (const part of parts) {
        const filePath = path.join(testOutputDir, part.fileName!);
        const exists = await fse.pathExists(filePath);
        expect(exists).toBe(true);
      }

      // Step 3: Rejoin with different delimiter
      const joinCmd = new JoinCommand(
        ['fruit-1', 'fruit-2', 'fruit-3', 'fruit-4'],
        ' | ',
        'joined'
      );
      const refs = await context.run(joinCmd);

      expect(refs[0].content).toBe('apple | banana | cherry | date');
    });

    it('should process multi-step data transformation pipeline', async () => {
      // Simulate a data processing pipeline

      // Step 1: Load input data
      await context.store(
        JSON.stringify({
          users: ['alice@example.com', 'bob@example.com', 'charlie@example.com'],
        }),
        [new TokenDecorator('rawData')]
      );

      // Step 2: Extract JSON (simulated)
      const rawData = context.token('rawData');
      const parsed = JSON.parse(rawData);
      await context.store(parsed.users.join('\n'), [
        new TokenDecorator('emailList'),
      ]);

      // Step 3: Split emails
      const splitCmd = new SplitCommand('emailList', '\n', 'email');
      const emailRefs = await context.run(splitCmd);

      expect(emailRefs).toHaveLength(3);

      // Step 4: Extract domains from first email
      const firstEmail = context.token('email-1');
      await context.store(firstEmail, [new TokenDecorator('firstEmailValue')]);
      
      const extractDomainCmd = new ExtractCommand(
        'firstEmailValue',
        /@(.+)/,
        'domain'
      );
      await context.run(extractDomainCmd);

      // Verify domain was extracted
      expect(context.token('domain')).toBe('example.com');

      // Verify all files exist
      const files = await fs.readdir(testOutputDir);
      expect(files.length).toBeGreaterThan(5); // Multiple transform outputs
    });
  });

  describe('Error Handling', () => {
    it('should handle missing files gracefully', async () => {
      const nonExistentFile = path.join(testOutputDir, 'does-not-exist.txt');

      await expect(
        context.load(nonExistentFile, 'test')
      ).rejects.toThrow();
    });

    it('should handle missing tokens in transforms', async () => {
      await context.store('Template: {{missing}}', [
        new TokenDecorator('template'),
      ]);

      const cmd = new TokenReplaceCommand('template', 'result');
      const refs = await context.run(cmd);

      // Token not found, pattern remains unchanged
      expect(refs[0].content).toContain('{{missing}}');
    });

    it('should throw error when required token not found', async () => {
      const cmd = new ExtractCommand('nonexistent', /test/, 'output');

      await expect(context.run(cmd)).rejects.toThrow(
        "Token 'nonexistent' not found in context"
      );
    });
  });

  describe('Metadata Persistence', () => {
    it('should persist multiple transform metadata across chain', async () => {
      // Create multi-step transformation
      await context.store('Price: $100', [new TokenDecorator('text')]);

      // Transform 1: Extract price
      const extractCmd = new ExtractCommand('text', /\$(\d+)/, 'price');
      await context.run(extractCmd);

      // Transform 2: Format price
      await context.store('Cost is {{price}} dollars', [
        new TokenDecorator('template'),
      ]);
      const replaceCmd = new TokenReplaceCommand('template', 'formatted');
      const refs = await context.run(replaceCmd);

      // Read file and verify metadata
      const filePath = path.join(testOutputDir, refs[0].fileName!);
      const content = await fs.readFile(filePath, 'utf-8');

      expect(content).toContain('transforms:');
      expect(content).toContain('type: TokenReplace');
      expect(content).toContain('timestamp:');
    });
  });

  describe('Token Lookup and Reuse', () => {
    it('should maintain token references across operations', async () => {
      // Store multiple values
      await context.store('Value A', [new TokenDecorator('a')]);
      await context.store('Value B', [new TokenDecorator('b')]);
      await context.store('Value C', [new TokenDecorator('c')]);

      // Retrieve via token lookup
      expect(context.token('a')).toBe('Value A');
      expect(context.token('b')).toBe('Value B');
      expect(context.token('c')).toBe('Value C');

      // Use in template
      await context.store('{{a}} - {{b}} - {{c}}', [
        new TokenDecorator('template'),
      ]);
      const cmd = new TokenReplaceCommand('template', 'result');
      const refs = await context.run(cmd);

      expect(refs[0].content).toBe('Value A - Value B - Value C');

      // Verify all files were created
      const files = await fs.readdir(testOutputDir);
      expect(files.length).toBeGreaterThanOrEqual(5);
    });
  });
});
