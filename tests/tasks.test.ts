import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import fse from 'fs-extra';
import CleanCommand from '../src/tasks/clean.js';
import PromoteCommand from '../src/tasks/promote.js';
import { ExecutionContext } from '../src/types.js';
import { DirectoryOutputContext } from '../src/directory-output-context.js';
import { ConsoleOutputBuilder } from '../src/output-builders.js';

describe('New Built-in Task Commands', () => {
  let testDir: string;
  let context: ExecutionContext;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), '.test-output-tasks');
    await fs.mkdir(testDir, { recursive: true });
    
    // Create a basic execution context
    const workflowContext = new DirectoryOutputContext(testDir, path.join(testDir, 'logs'));
    const outputSynk = new ConsoleOutputBuilder('quiet');
    
    context = {
      cwd: testDir,
      outputDir: path.join(testDir, 'logs'),
      config: {},
      verbosity: 'quiet' as const,
      workflowContext,
      outputSynk,
      referenceManager: null as any, // Not needed for these tests
    };
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('CleanCommand', () => {
    it('should clean up old log directories', async () => {
      const command = new CleanCommand();
      const logsDir = path.join(testDir, '.open-tasks', 'logs');
      
      // Create logs directory structure
      await fse.ensureDir(logsDir);
      
      // Create old directories (older than 7 days)
      const oldDir1 = path.join(logsDir, '20200101-120000-old1');
      const oldDir2 = path.join(logsDir, '20200115-120000-old2');
      await fse.ensureDir(oldDir1);
      await fse.ensureDir(oldDir2);
      await fs.writeFile(path.join(oldDir1, 'test.txt'), 'test content');
      await fs.writeFile(path.join(oldDir2, 'test.txt'), 'test content');
      
      // Create a recent directory (should not be deleted)
      const recentDir = path.join(logsDir, new Date().toISOString().replace(/[:.]/g, '-'));
      await fse.ensureDir(recentDir);
      await fs.writeFile(path.join(recentDir, 'test.txt'), 'test content');
      
      // Set modification time to old date for old directories
      const oldDate = new Date('2020-01-01');
      await fs.utimes(oldDir1, oldDate, oldDate);
      await fs.utimes(oldDir2, oldDate, oldDate);
      
      // Run clean command
      const result = await command.execute(['--days', '7'], context);
      
      // Verify old directories were deleted
      expect(await fse.pathExists(oldDir1)).toBe(false);
      expect(await fse.pathExists(oldDir2)).toBe(false);
      
      // Verify recent directory still exists
      expect(await fse.pathExists(recentDir)).toBe(true);
      
      // Verify result
      expect(result.content).toContain('Cleaned 2 old log directories');
    });

    it('should handle non-existent logs directory', async () => {
      const command = new CleanCommand();
      
      // Run clean command without creating logs directory
      const result = await command.execute(['--days', '7'], context);
      
      // Verify result
      expect(result.content).toContain('No logs directory found');
    });

    it('should accept custom retention days', async () => {
      const command = new CleanCommand();
      const logsDir = path.join(testDir, '.open-tasks', 'logs');
      
      await fse.ensureDir(logsDir);
      
      // Run clean command with custom retention
      const result = await command.execute(['--days', '30'], context);
      
      // Verify retention was applied
      expect(result.content).toContain('Retention: 30 days');
    });

    it('should reject invalid retention days', async () => {
      const command = new CleanCommand();
      
      // Test negative value
      await expect(
        command.execute(['--days', '-5'], context)
      ).rejects.toThrow('Invalid --days value');
      
      // Test non-numeric value
      await expect(
        command.execute(['--days', 'invalid'], context)
      ).rejects.toThrow('Invalid --days value');
    });
  });

  describe('PromoteCommand', () => {
    it('should promote a task to user profile directory', async () => {
      const command = new PromoteCommand();
      const projectDir = path.join(testDir, '.open-tasks');
      const userDir = path.join(testDir, 'fake-home', '.open-tasks');
      
      // Mock os.homedir for this test
      const originalHomedir = os.homedir;
      (os as any).homedir = () => path.join(testDir, 'fake-home');
      
      try {
        // Create project directory and task file
        await fse.ensureDir(projectDir);
        const taskPath = path.join(projectDir, 'my-task.ts');
        const taskContent = `export default class MyTask { name = 'my-task'; }`;
        await fs.writeFile(taskPath, taskContent);
        
        // Run promote command
        const result = await command.execute(['my-task'], context);
        
        // Verify task was copied to user directory
        const userTaskPath = path.join(userDir, 'my-task.ts');
        expect(await fse.pathExists(userTaskPath)).toBe(true);
        
        // Verify content matches
        const copiedContent = await fs.readFile(userTaskPath, 'utf-8');
        expect(copiedContent).toBe(taskContent);
        
        // Verify result
        expect(result.content).toContain('Promoted task: my-task');
      } finally {
        // Restore original homedir
        (os as any).homedir = originalHomedir;
      }
    });

    it('should handle JavaScript tasks', async () => {
      const command = new PromoteCommand();
      const projectDir = path.join(testDir, '.open-tasks');
      const userDir = path.join(testDir, 'fake-home', '.open-tasks');
      
      const originalHomedir = os.homedir;
      (os as any).homedir = () => path.join(testDir, 'fake-home');
      
      try {
        await fse.ensureDir(projectDir);
        const taskPath = path.join(projectDir, 'my-task.js');
        await fs.writeFile(taskPath, 'module.exports = {}');
        
        const result = await command.execute(['my-task'], context);
        
        const userTaskPath = path.join(userDir, 'my-task.js');
        expect(await fse.pathExists(userTaskPath)).toBe(true);
        expect(result.content).toContain('Promoted task: my-task');
      } finally {
        (os as any).homedir = originalHomedir;
      }
    });

    it('should create backup if task already exists in user directory', async () => {
      const command = new PromoteCommand();
      const projectDir = path.join(testDir, '.open-tasks');
      const userDir = path.join(testDir, 'fake-home', '.open-tasks');
      
      const originalHomedir = os.homedir;
      (os as any).homedir = () => path.join(testDir, 'fake-home');
      
      try {
        // Create project task
        await fse.ensureDir(projectDir);
        const taskPath = path.join(projectDir, 'my-task.ts');
        await fs.writeFile(taskPath, 'new content');
        
        // Create existing user task
        await fse.ensureDir(userDir);
        const userTaskPath = path.join(userDir, 'my-task.ts');
        await fs.writeFile(userTaskPath, 'old content');
        
        // Run promote command
        await command.execute(['my-task'], context);
        
        // Verify backup was created
        const backupPath = path.join(userDir, 'my-task.ts.backup');
        expect(await fse.pathExists(backupPath)).toBe(true);
        
        // Verify backup has old content
        const backupContent = await fs.readFile(backupPath, 'utf-8');
        expect(backupContent).toBe('old content');
        
        // Verify task has new content
        const newContent = await fs.readFile(userTaskPath, 'utf-8');
        expect(newContent).toBe('new content');
      } finally {
        (os as any).homedir = originalHomedir;
      }
    });

    it('should copy spec files if they exist', async () => {
      const command = new PromoteCommand();
      const projectDir = path.join(testDir, '.open-tasks');
      const userDir = path.join(testDir, 'fake-home', '.open-tasks');
      
      const originalHomedir = os.homedir;
      (os as any).homedir = () => path.join(testDir, 'fake-home');
      
      try {
        await fse.ensureDir(projectDir);
        
        // Create task and spec file
        await fs.writeFile(path.join(projectDir, 'my-task.ts'), 'task content');
        await fs.writeFile(path.join(projectDir, 'my-task.md'), '# Spec');
        
        const result = await command.execute(['my-task'], context);
        
        // Verify spec was copied
        const userSpecPath = path.join(userDir, 'my-task.md');
        expect(await fse.pathExists(userSpecPath)).toBe(true);
        expect(result.content).toContain('Spec files copied: 1');
      } finally {
        (os as any).homedir = originalHomedir;
      }
    });

    it('should validate task name format', async () => {
      const command = new PromoteCommand();
      
      // Test invalid task name
      await expect(
        command.execute(['Invalid_Task'], context)
      ).rejects.toThrow('must be kebab-case');
    });

    it('should handle missing task file', async () => {
      const command = new PromoteCommand();
      const projectDir = path.join(testDir, '.open-tasks');
      await fse.ensureDir(projectDir);
      
      // Try to promote non-existent task
      await expect(
        command.execute(['non-existent'], context)
      ).rejects.toThrow('Task "non-existent" not found');
    });

    it('should require task name argument', async () => {
      const command = new PromoteCommand();
      
      await expect(
        command.execute([], context)
      ).rejects.toThrow('requires a task name argument');
    });
  });
});
