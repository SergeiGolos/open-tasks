import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { DirectoryOutputContext } from '../src/directory-output-context.js';
import { SetCommand } from '../src/commands/set.js';
import { AgentCommand } from '../src/commands/agents/agent.js';
import { ClaudeConfigBuilder } from '../src/commands/agents/claude.js';
import { GeminiConfigBuilder } from '../src/commands/agents/gemini.js';

describe('Agent Commands', () => {
  let context: DirectoryOutputContext;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), '.test-output-agents');
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(testDir, { recursive: true });
    context = new DirectoryOutputContext(process.cwd(), testDir, 'summary');
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('ClaudeConfig with dry-run', () => {
    it('should generate dry-run output without executing', async () => {
      // Create a prompt
      const promptRefs = await context.run(new SetCommand('Review this code for bugs'));
      
      // Create Claude config with dry-run enabled
      const config = new ClaudeConfigBuilder()
        .withModel('claude-3.5-sonnet')
        .allowingAllTools()
        .withDryRun()
        .build();
      
      // Execute with dry-run
      const command = new AgentCommand(config, [promptRefs[0]]);
      const refs = await context.run(command);
      
      expect(refs).toHaveLength(1);
      const result = await context.get(refs[0]);
      expect(result).toContain('[DRY-RUN]');
      expect(result).toContain('claude');
      expect(result).toContain('Review this code for bugs');
      expect(result).toContain('--allow-all-tools');
      expect(result).toContain('--model');
      expect(result).toContain('claude-3.5-sonnet');
    });

    it('should include working directory in dry-run output', async () => {
      const promptRefs = await context.run(new SetCommand('Test prompt'));
      
      const config = new ClaudeConfigBuilder()
        .inDirectory('/test/dir')
        .withDryRun()
        .build();
      
      const command = new AgentCommand(config, [promptRefs[0]]);
      const refs = await context.run(command);
      
      const result = await context.get(refs[0]);
      expect(result).toContain('[DRY-RUN]');
      expect(result).toContain('cd /test/dir');
    });
  });

  describe('GeminiConfig with dry-run', () => {
    it('should generate dry-run output for Gemini', async () => {
      const promptRefs = await context.run(new SetCommand('Analyze this code'));
      
      const config = new GeminiConfigBuilder()
        .withModel('gemini-2.5-pro')
        .withDryRun()
        .build();
      
      const command = new AgentCommand(config, [promptRefs[0]]);
      const refs = await context.run(command);
      
      const result = await context.get(refs[0]);
      expect(result).toContain('[DRY-RUN]');
      expect(result).toContain('gemini');
      expect(result).toContain('Analyze this code');
      expect(result).toContain('--model');
      expect(result).toContain('gemini-2.5-pro');
    });

    it('should include context files in dry-run output', async () => {
      const promptRefs = await context.run(new SetCommand('Review'));
      
      const config = new GeminiConfigBuilder()
        .withContextFiles('file1.ts', 'file2.ts')
        .withDryRun()
        .build();
      
      const command = new AgentCommand(config, [promptRefs[0]]);
      const refs = await context.run(command);
      
      const result = await context.get(refs[0]);
      expect(result).toContain('[DRY-RUN]');
      expect(result).toContain('file1.ts');
      expect(result).toContain('file2.ts');
    });
  });

  describe('Multiple prompts', () => {
    it('should join multiple prompt refs in dry-run', async () => {
      const prompt1 = await context.run(new SetCommand('First instruction'));
      const prompt2 = await context.run(new SetCommand('Second instruction'));
      
      const config = new ClaudeConfigBuilder()
        .withDryRun()
        .build();
      
      const command = new AgentCommand(config, [prompt1[0], prompt2[0]]);
      const refs = await context.run(command);
      
      const result = await context.get(refs[0]);
      expect(result).toContain('First instruction');
      expect(result).toContain('Second instruction');
    });
  });

  describe('Verbose mode', () => {
    it('should work with verbose context', async () => {
      const verboseContext = new DirectoryOutputContext(process.cwd(), testDir, 'verbose');
      
      const promptRefs = await verboseContext.run(new SetCommand('Test with verbose'));
      
      const config = new ClaudeConfigBuilder()
        .withDryRun()
        .build();
      
      const command = new AgentCommand(config, [promptRefs[0]]);
      const refs = await verboseContext.run(command);
      
      const result = await verboseContext.get(refs[0]);
      expect(result).toContain('[DRY-RUN]');
    });
  });

  describe('Config-based dry-run', () => {
    it('should use dry-run from context config', async () => {
      // Create context with dry-run in config
      const runtimeConfig = { dryRun: true, verbosity: 'summary' };
      const configContext = new DirectoryOutputContext(process.cwd(), testDir, 'summary', runtimeConfig);
      
      const promptRefs = await configContext.run(new SetCommand('Test config dry-run'));
      
      // No need to set withDryRun() on the config builder
      const config = new ClaudeConfigBuilder()
        .withModel('claude-3.5-sonnet')
        .build();
      
      const command = new AgentCommand(config, [promptRefs[0]]);
      const refs = await configContext.run(command);
      
      const result = await configContext.get(refs[0]);
      expect(result).toContain('[DRY-RUN]');
      expect(result).toContain('claude');
      expect(result).toContain('Test config dry-run');
    });

    it('should prioritize agent config dry-run over context config', async () => {
      // Context says no dry-run, but agent config says yes
      const runtimeConfig = { dryRun: false, verbosity: 'summary' };
      const configContext = new DirectoryOutputContext(process.cwd(), testDir, 'summary', runtimeConfig);
      
      const promptRefs = await configContext.run(new SetCommand('Test priority'));
      
      const config = new ClaudeConfigBuilder()
        .withDryRun()
        .build();
      
      const command = new AgentCommand(config, [promptRefs[0]]);
      const refs = await configContext.run(command);
      
      const result = await configContext.get(refs[0]);
      expect(result).toContain('[DRY-RUN]');
    });
  });
});
