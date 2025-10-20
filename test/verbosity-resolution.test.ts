import { describe, it, expect } from 'vitest';
import { TaskHandler, ExecutionContext, ReferenceHandle } from '../src/types.js';
import { createOutputBuilder } from '../src/output-builders.js';

// Mock command with no default verbosity
class BasicCommand extends TaskHandler {
  name = 'basic';
  description = 'Basic test command';
  examples = ['basic test'];

  protected async executeCommand(
    _args: string[],
    _refs: Map<string, ReferenceHandle>,
    _context: ExecutionContext
  ): Promise<ReferenceHandle> {
    return {
      id: 'test',
      content: 'test',
      timestamp: new Date(),
    };
  }
}

// Mock command with verbose default
class VerboseDefaultCommand extends TaskHandler {
  name = 'verbose-default';
  description = 'Command with verbose default';
  examples = ['verbose-default test'];
  
  protected defaultVerbosity: 'verbose' = 'verbose';

  protected async executeCommand(
    _args: string[],
    _refs: Map<string, ReferenceHandle>,
    _context: ExecutionContext
  ): Promise<ReferenceHandle> {
    return {
      id: 'test',
      content: 'test',
      timestamp: new Date(),
    };
  }
}

// Mock command with quiet default
class QuietDefaultCommand extends TaskHandler {
  name = 'quiet-default';
  description = 'Command with quiet default';
  examples = ['quiet-default test'];
  
  protected defaultVerbosity: 'quiet' = 'quiet';

  protected async executeCommand(
    _args: string[],
    _refs: Map<string, ReferenceHandle>,
    _context: ExecutionContext
  ): Promise<ReferenceHandle> {
    return {
      id: 'test',
      content: 'test',
      timestamp: new Date(),
    };
  }
}

describe('Verbosity Resolution Hierarchy', () => {
  describe('CLI flag takes precedence over command default', () => {
    it('should use quiet when CLI specifies quiet, even if command defaults to verbose', () => {
      const command = new VerboseDefaultCommand();
      const mockContext: Partial<ExecutionContext> = {
        verbosity: 'quiet', // CLI override
      };
      
      const builder = (command as any).createOutputBuilder(mockContext as ExecutionContext);
      expect(builder.constructor.name).toBe('QuietOutputBuilder');
    });

    it('should use verbose when CLI specifies verbose, even if command defaults to quiet', () => {
      const command = new QuietDefaultCommand();
      const mockContext: Partial<ExecutionContext> = {
        verbosity: 'verbose', // CLI override
      };
      
      const builder = (command as any).createOutputBuilder(mockContext as ExecutionContext);
      expect(builder.constructor.name).toBe('VerboseOutputBuilder');
    });

    it('should use summary when CLI specifies summary, overriding command default', () => {
      const command = new VerboseDefaultCommand();
      const mockContext: Partial<ExecutionContext> = {
        verbosity: 'summary', // CLI override
      };
      
      const builder = (command as any).createOutputBuilder(mockContext as ExecutionContext);
      expect(builder.constructor.name).toBe('SummaryOutputBuilder');
    });
  });

  describe('Command default is used when no CLI override', () => {
    it('should use verbose when command defaults to verbose and no CLI flag', () => {
      const command = new VerboseDefaultCommand();
      const mockContext: Partial<ExecutionContext> = {
        verbosity: undefined, // No CLI override
      };
      
      const builder = (command as any).createOutputBuilder(mockContext as ExecutionContext);
      expect(builder.constructor.name).toBe('VerboseOutputBuilder');
    });

    it('should use quiet when command defaults to quiet and no CLI flag', () => {
      const command = new QuietDefaultCommand();
      const mockContext: Partial<ExecutionContext> = {
        verbosity: undefined, // No CLI override
      };
      
      const builder = (command as any).createOutputBuilder(mockContext as ExecutionContext);
      expect(builder.constructor.name).toBe('QuietOutputBuilder');
    });
  });

  describe('Hardcoded default (summary) when nothing specified', () => {
    it('should use summary when command has no default and no CLI flag', () => {
      const command = new BasicCommand();
      const mockContext: Partial<ExecutionContext> = {
        verbosity: undefined, // No CLI override
      };
      
      const builder = (command as any).createOutputBuilder(mockContext as ExecutionContext);
      expect(builder.constructor.name).toBe('SummaryOutputBuilder');
    });

    it('should use summary when context has no verbosity property', () => {
      const command = new BasicCommand();
      const mockContext: Partial<ExecutionContext> = {};
      
      const builder = (command as any).createOutputBuilder(mockContext as ExecutionContext);
      expect(builder.constructor.name).toBe('SummaryOutputBuilder');
    });
  });

  describe('Complete hierarchy test', () => {
    it('should follow CLI → command → default hierarchy correctly', () => {
      // CLI flag wins
      const cmd1 = new VerboseDefaultCommand();
      const ctx1: Partial<ExecutionContext> = { verbosity: 'quiet' };
      expect((cmd1 as any).createOutputBuilder(ctx1 as ExecutionContext).constructor.name).toBe('QuietOutputBuilder');

      // Command default wins when no CLI flag
      const cmd2 = new VerboseDefaultCommand();
      const ctx2: Partial<ExecutionContext> = { verbosity: undefined };
      expect((cmd2 as any).createOutputBuilder(ctx2 as ExecutionContext).constructor.name).toBe('VerboseOutputBuilder');

      // Hardcoded default wins when neither CLI nor command default
      const cmd3 = new BasicCommand();
      const ctx3: Partial<ExecutionContext> = { verbosity: undefined };
      expect((cmd3 as any).createOutputBuilder(ctx3 as ExecutionContext).constructor.name).toBe('SummaryOutputBuilder');
    });
  });
});
