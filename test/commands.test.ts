import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  OutputHandler,
  ExecutionContext,
  ReferenceHandle,
} from '../src/types.js';
import { ReferenceManager } from '../src/ReferenceManager.js';
import { DirectoryOutputContext } from '../src/workflow/index.js';
import StoreCommand from '../src/commands/store.js';
import LoadCommand from '../src/commands/load.js';
import ReplaceCommand from '../src/commands/replace.js';
import ExtractCommand from '../src/commands/extract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Built-in Commands Integration Tests', () => {
  const testOutputDir = path.join(__dirname, 'test-commands-output');
  let context: ExecutionContext;
  let refManager: ReferenceManager;
  let outputHandler: OutputHandler;
  let workflowContext: DirectoryOutputContext;

  beforeEach(async () => {
    // Create test output directory
    await fs.mkdir(testOutputDir, { recursive: true });
    
    // Initialize context
    refManager = new ReferenceManager();
    outputHandler = new OutputHandler(testOutputDir);
    workflowContext = new DirectoryOutputContext(testOutputDir);
    
    context = {
      cwd: process.cwd(),
      outputDir: testOutputDir,
      referenceManager: refManager,
      outputHandler,
      workflowContext,
      config: {},
    };
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('StoreCommand', () => {
    const storeCmd = new StoreCommand();

    it('should store a simple string value', async () => {
      const result = await storeCmd.execute(
        ['Hello World'],
        new Map(),
        context
      );

      expect(result.content).toBe('Hello World');
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should store value with token', async () => {
      const result = await storeCmd.execute(
        ['Test Value', '--token', 'mytoken'],
        new Map(),
        context
      );

      expect(result.content).toBe('Test Value');
      expect(result.token).toBe('mytoken');
      
      // Verify token is registered
      const retrieved = refManager.getReference('mytoken');
      expect(retrieved?.content).toBe('Test Value');
    });

    it('should create output file', async () => {
      const result = await storeCmd.execute(
        ['File content', '--token', 'filetoken'],
        new Map(),
        context
      );

      expect(result.outputFile).toBeDefined();
      expect(result.outputFile).toContain(testOutputDir);
      
      // Verify file exists
      const fileExists = await fs.access(result.outputFile!)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should throw error when no value provided', async () => {
      await expect(
        storeCmd.execute([], new Map(), context)
      ).rejects.toThrow('Store command requires a value argument');
    });
  });

  describe('LoadCommand', () => {
    const loadCmd = new LoadCommand();

    it('should load file content', async () => {
      // Create test file
      const testFile = path.join(testOutputDir, 'test.txt');
      const content = 'Test file content';
      await fs.writeFile(testFile, content);

      const result = await loadCmd.execute(
        [testFile],
        new Map(),
        context
      );

      expect(result.content).toBe(content);
    });

    it('should load file with token', async () => {
      const testFile = path.join(testOutputDir, 'test.txt');
      await fs.writeFile(testFile, 'Content');

      const result = await loadCmd.execute(
        [testFile, '--token', 'loadtoken'],
        new Map(),
        context
      );

      expect(result.token).toBe('loadtoken');
      
      const retrieved = refManager.getReference('loadtoken');
      expect(retrieved?.content).toBe('Content');
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        loadCmd.execute(['/nonexistent/file.txt'], new Map(), context)
      ).rejects.toThrow();
    });

    it('should throw error when no file path provided', async () => {
      await expect(
        loadCmd.execute([], new Map(), context)
      ).rejects.toThrow('Load command requires a file path');
    });
  });

  describe('ReplaceCommand', () => {
    const replaceCmd = new ReplaceCommand();

    it('should replace single token in template', async () => {
      // Create reference
      const ref = refManager.createReference('ref1', 'World');
      const refs = new Map<string, ReferenceHandle>();
      refs.set('ref1', ref);

      const result = await replaceCmd.execute(
        ['Hello {{ref1}}!', '--ref', 'ref1'],
        refs,
        context
      );

      expect(result.content).toBe('Hello World!');
    });

    it('should replace multiple tokens', async () => {
      const ref1 = refManager.createReference('ref1', 'Hello');
      const ref2 = refManager.createReference('ref2', 'World');
      const refs = new Map<string, ReferenceHandle>();
      refs.set('ref1', ref1);
      refs.set('ref2', ref2);

      const result = await replaceCmd.execute(
        ['{{ref1}} {{ref2}}!', '--ref', 'ref1', '--ref', 'ref2'],
        refs,
        context
      );

      expect(result.content).toBe('Hello World!');
    });

    it('should handle missing references gracefully', async () => {
      const refs = new Map<string, ReferenceHandle>();

      const result = await replaceCmd.execute(
        ['Hello {{missing}}'],
        refs,
        context
      );

      // Should keep the token unchanged
      expect(result.content).toBe('Hello {{missing}}');
    });

    it('should support named token references', async () => {
      const ref = refManager.createReference('id1', 'Value', 'namedtoken');
      const refs = new Map<string, ReferenceHandle>();
      refs.set('namedtoken', ref);

      const result = await replaceCmd.execute(
        ['Result: {{namedtoken}}', '--ref', 'namedtoken'],
        refs,
        context
      );

      expect(result.content).toBe('Result: Value');
    });

    it('should throw error when no template provided', async () => {
      await expect(
        replaceCmd.execute([], new Map(), context)
      ).rejects.toThrow('Replace command requires a template string');
    });
  });

  describe('ExtractCommand', () => {
    const extractCmd = new ExtractCommand();

    it('should extract using regex pattern', async () => {
      const ref = refManager.createReference('input', 'The price is $42.99');
      const refs = new Map<string, ReferenceHandle>();
      refs.set('input', ref);

      const result = await extractCmd.execute(
        ['\\$([0-9.]+)', '--ref', 'input'],
        refs,
        context
      );

      expect(result.content).toContain('42.99');
    });

    it('should extract first match by default', async () => {
      const ref = refManager.createReference('input', 'Numbers: 10, 20, 30');
      const refs = new Map<string, ReferenceHandle>();
      refs.set('input', ref);

      const result = await extractCmd.execute(
        ['\\d+', '--ref', 'input'],
        refs,
        context
      );

      expect(result.content).toBe('10');
    });

    it('should extract all matches with --all flag', async () => {
      const ref = refManager.createReference('input', 'Numbers: 10, 20, 30');
      const refs = new Map<string, ReferenceHandle>();
      refs.set('input', ref);

      const result = await extractCmd.execute(
        ['\\d+', '--ref', 'input', '--all'],
        refs,
        context
      );

      // Results are newline-separated
      expect(result.content).toBe('10\n20\n30');
    });

    it('should extract capture groups', async () => {
      const ref = refManager.createReference('input', 'Name: John Doe');
      const refs = new Map<string, ReferenceHandle>();
      refs.set('input', ref);

      const result = await extractCmd.execute(
        ['Name: ([A-Z][a-z]+) ([A-Z][a-z]+)', '--ref', 'input'],
        refs,
        context
      );

      expect(result.content).toContain('John');
      expect(result.content).toContain('Doe');
    });

    it('should throw error when no pattern provided', async () => {
      await expect(
        extractCmd.execute([], new Map(), context)
      ).rejects.toThrow('Extract command requires a regex pattern');
    });

    it('should throw error when no input reference provided', async () => {
      await expect(
        extractCmd.execute(['\\d+'], new Map(), context)
      ).rejects.toThrow();
    });

    it('should throw error for invalid regex', async () => {
      const ref = refManager.createReference('input', 'text');
      const refs = new Map<string, ReferenceHandle>();
      refs.set('input', ref);

      await expect(
        extractCmd.execute(['[invalid(', '--ref', 'input'], refs, context)
      ).rejects.toThrow();
    });
  });

  describe('Command Chaining', () => {
    it('should chain store → load → replace', async () => {
      const storeCmd = new StoreCommand();
      const loadCmd = new LoadCommand();
      const replaceCmd = new ReplaceCommand();

      // Step 1: Store a value
      const stored = await storeCmd.execute(
        ['World', '--token', 'greeting'],
        new Map(),
        context
      );

      // Step 2: Create a template file
      const templatePath = path.join(testOutputDir, 'template.txt');
      await fs.writeFile(templatePath, 'Hello {{greeting}}!');

      // Step 3: Load the template
      const loaded = await loadCmd.execute(
        [templatePath, '--token', 'template'],
        new Map(),
        context
      );

      // Step 4: Replace tokens
      const refs = new Map<string, ReferenceHandle>();
      refs.set('greeting', stored);
      const result = await replaceCmd.execute(
        [loaded.content, '--ref', 'greeting'],
        refs,
        context
      );

      expect(result.content).toBe('Hello World!');
    });

    it('should chain store → extract → replace', async () => {
      const storeCmd = new StoreCommand();
      const extractCmd = new ExtractCommand();
      const replaceCmd = new ReplaceCommand();

      // Step 1: Store text with email
      const stored = await storeCmd.execute(
        ['Contact us at support@example.com', '--token', 'contact'],
        new Map(),
        context
      );

      // Step 2: Extract email
      const refs1 = new Map<string, ReferenceHandle>();
      refs1.set('contact', stored);
      const extracted = await extractCmd.execute(
        ['([a-z]+@[a-z.]+)', '--ref', 'contact'],
        refs1,
        context
      );

      // Step 3: Use in template
      const refs2 = new Map<string, ReferenceHandle>();
      refs2.set(extracted.id, extracted);
      const result = await replaceCmd.execute(
        [`Email: {{${extracted.id}}}`, '--ref', extracted.id],
        refs2,
        context
      );

      expect(result.content).toContain('support@example.com');
    });
  });
});
