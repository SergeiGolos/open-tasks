import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReferenceManager, OutputHandler } from '../src/types.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ReferenceManager', () => {
  let refManager: ReferenceManager;

  beforeEach(() => {
    refManager = new ReferenceManager();
  });

  describe('createReference', () => {
    it('should create a reference with UUID', () => {
      const ref = refManager.createReference('test-id', 'test content');
      
      expect(ref.id).toBe('test-id');
      expect(ref.content).toBe('test content');
      expect(ref.token).toBeUndefined();
      expect(ref.timestamp).toBeInstanceOf(Date);
    });

    it('should create a reference with token', () => {
      const ref = refManager.createReference('test-id', 'test content', 'mytoken');
      
      expect(ref.id).toBe('test-id');
      expect(ref.token).toBe('mytoken');
      expect(ref.content).toBe('test content');
    });

    it('should create a reference with output file', () => {
      const ref = refManager.createReference('test-id', 'test content', 'mytoken', '/path/to/file.txt');
      
      expect(ref.outputFile).toBe('/path/to/file.txt');
    });

    it('should warn on token collision', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      refManager.createReference('id1', 'content1', 'token1');
      refManager.createReference('id2', 'content2', 'token1');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token "token1" already exists')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getReference', () => {
    it('should get reference by ID', () => {
      const created = refManager.createReference('test-id', 'test content');
      const retrieved = refManager.getReference('test-id');
      
      expect(retrieved).toEqual(created);
    });

    it('should get reference by token', () => {
      const created = refManager.createReference('test-id', 'test content', 'mytoken');
      const retrieved = refManager.getReference('mytoken');
      
      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent reference', () => {
      const retrieved = refManager.getReference('non-existent');
      
      expect(retrieved).toBeUndefined();
    });

    it('should prioritize direct ID lookup over token', () => {
      refManager.createReference('id1', 'content1', 'token1');
      refManager.createReference('token1', 'content2'); // ID that matches a token
      
      const retrieved = refManager.getReference('token1');
      
      // Should get the one with ID='token1', not the one with token='token1'
      expect(retrieved?.content).toBe('content2');
    });
  });

  describe('listReferences', () => {
    it('should return empty array when no references', () => {
      const list = refManager.listReferences();
      
      expect(list).toEqual([]);
    });

    it('should list all references', () => {
      refManager.createReference('id1', 'content1');
      refManager.createReference('id2', 'content2', 'token2');
      refManager.createReference('id3', 'content3');
      
      const list = refManager.listReferences();
      
      expect(list).toHaveLength(3);
      expect(list.map(r => r.id)).toContain('id1');
      expect(list.map(r => r.id)).toContain('id2');
      expect(list.map(r => r.id)).toContain('id3');
    });
  });
});

describe('OutputHandler', () => {
  const testOutputDir = path.join(__dirname, 'test-output');
  let outputHandler: OutputHandler;

  beforeEach(async () => {
    // Create test output directory
    await fs.mkdir(testOutputDir, { recursive: true });
    outputHandler = new OutputHandler(testOutputDir);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('writeOutput', () => {
    it('should write content to file', async () => {
      const content = 'Hello World';
      const fileName = 'test-file.txt';
      
      const filePath = await outputHandler.writeOutput(content, fileName);
      
      expect(filePath).toBe(path.join(testOutputDir, fileName));
      
      const written = await fs.readFile(filePath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create output directory if it does not exist', async () => {
      const nestedDir = path.join(testOutputDir, 'nested', 'deep');
      const handler = new OutputHandler(nestedDir);
      
      const filePath = await handler.writeOutput('content', 'file.txt');
      
      const written = await fs.readFile(filePath, 'utf-8');
      expect(written).toBe('content');
    });

    it('should handle special characters in file content', async () => {
      const content = 'Special chars: \n\t©™®\u0000';
      const fileName = 'special.txt';
      
      const filePath = await outputHandler.writeOutput(content, fileName);
      const written = await fs.readFile(filePath, 'utf-8');
      
      expect(written).toBe(content);
    });
  });

  describe('writeError', () => {
    it('should write error report with context', async () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at test.ts:123';
      const context = { command: 'test-command', args: ['arg1', 'arg2'] };
      
      const filePath = await outputHandler.writeError(error, context);
      
      expect(filePath).toMatch(/\d{8}T\d{6}-error\.txt$/);
      
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('ERROR REPORT');
      expect(content).toContain('Test error');
      expect(content).toContain('Stack Trace:');
      expect(content).toContain('test-command');
      expect(content).toContain('arg1');
    });

    it('should handle error without stack trace', async () => {
      const error = new Error('No stack error');
      delete error.stack;
      
      const filePath = await outputHandler.writeError(error, {});
      const content = await fs.readFile(filePath, 'utf-8');
      
      expect(content).toContain('No stack trace available');
    });

    it('should create timestamped error file names', async () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      const file1 = await outputHandler.writeError(error1, {});
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1500));
      const file2 = await outputHandler.writeError(error2, {});
      
      // Both should match the timestamp pattern
      expect(path.basename(file1)).toMatch(/\d{8}T\d{6}-error\.txt$/);
      expect(path.basename(file2)).toMatch(/\d{8}T\d{6}-error\.txt$/);
      
      // Files should exist
      const content1 = await fs.readFile(file1, 'utf-8');
      const content2 = await fs.readFile(file2, 'utf-8');
      expect(content1).toContain('Error 1');
      expect(content2).toContain('Error 2');
    });
  });

  describe('getOutputDir', () => {
    it('should return the output directory', () => {
      const dir = outputHandler.getOutputDir();
      
      expect(dir).toBe(testOutputDir);
    });
  });
});
