import { describe, it, expect } from 'vitest';
import {
  QuietOutputBuilder,
  SummaryOutputBuilder,
  VerboseOutputBuilder,
  StreamingOutputBuilder,
  createOutputBuilder,
} from '../src/output-builders.js';
import type { VerbosityLevel, SummaryData } from '../src/types.js';

describe('QuietOutputBuilder', () => {
  it('should create minimal single-line output', () => {
    const builder = new QuietOutputBuilder();
    builder.addSummary?.({ commandName: 'test', executionTime: 100, success: true });
    
    const output = builder.build();
    expect(output).toBe('✓ test completed in 100ms');
  });

  it('should handle error state', () => {
    const builder = new QuietOutputBuilder();
    builder.addSummary?.({ commandName: 'test', executionTime: 50, success: false });
    
    const output = builder.build();
    expect(output).toBe('✗ test completed in 50ms');
  });

  it('should ignore sections and progress (quiet mode)', () => {
    const builder = new QuietOutputBuilder();
    builder.addSection?.('Details', 'Some details');
    builder.addProgress?.('Processing...');
    builder.addSummary?.({ commandName: 'test', executionTime: 75, success: true });
    
    const output = builder.build();
    expect(output).toBe('✓ test completed in 75ms');
  });

  it('should return empty string when no summary added', () => {
    const builder = new QuietOutputBuilder();
    
    const output = builder.build();
    expect(output).toBe('');
  });
});

describe('SummaryOutputBuilder', () => {
  it('should create formatted summary output', () => {
    const builder = new SummaryOutputBuilder();
    const summary: SummaryData = {
      commandName: 'test',
      executionTime: 150,
      success: true,
      outputFile: '/path/to/output.txt',
      referenceToken: 'mytoken',
      metadata: { count: 5 },
    };
    builder.addSummary(summary);
    
    const output = builder.build();
    expect(output).toContain('✓ test');
    expect(output).toContain('150ms');
    expect(output).toContain('/path/to/output.txt');
    expect(output).toContain('mytoken');
  });

  it('should format error summary', () => {
    const builder = new SummaryOutputBuilder();
    builder.addSummary({
      commandName: 'test',
      executionTime: 50,
      success: false,
    });
    
    const output = builder.build();
    expect(output).toContain('✗ test');
    expect(output).toContain('50ms');
  });

  it('should handle optional fields', () => {
    const builder = new SummaryOutputBuilder();
    builder.addSummary({
      commandName: 'test',
      executionTime: 100,
      success: true,
    });
    
    const output = builder.build();
    expect(output).toContain('test');
    expect(output).toContain('100ms');
    // metadata field is not shown in SummaryOutputBuilder
  });

  it('should ignore sections and progress in summary mode', () => {
    const builder = new SummaryOutputBuilder();
    builder.addSection?.('Section', 'Content');
    builder.addProgress?.('Processing...');
    builder.addSummary({ commandName: 'test', executionTime: 80, success: true });
    
    const output = builder.build();
    expect(output).not.toContain('Section');
    expect(output).not.toContain('Processing');
    expect(output).toContain('test');
  });
});

describe('VerboseOutputBuilder', () => {
  it('should include sections in verbose output', () => {
    const builder = new VerboseOutputBuilder();
    builder.addSection('Configuration', 'config: value');
    builder.addSummary({ commandName: 'test', executionTime: 100, success: true });
    
    const output = builder.build();
    expect(output).toContain('Configuration');
    expect(output).toContain('config: value');
    expect(output).toContain('test');
  });

  it('should handle multiple sections', () => {
    const builder = new VerboseOutputBuilder();
    builder.addSection('Section 1', 'Content 1');
    builder.addSection('Section 2', 'Content 2');
    builder.addSummary({ commandName: 'test', executionTime: 100, success: true });
    
    const output = builder.build();
    expect(output).toContain('Section 1');
    expect(output).toContain('Content 1');
    expect(output).toContain('Section 2');
    expect(output).toContain('Content 2');
  });

  it('should format sections with dividers', () => {
    const builder = new VerboseOutputBuilder();
    builder.addSection('Details', 'Some details');
    
    const output = builder.build();
    expect(output).toContain('─────'); // Single-line box drawing character
    expect(output).toContain('Details');
  });

  it('should ignore progress in verbose mode', () => {
    const builder = new VerboseOutputBuilder();
    builder.addProgress?.('Processing...');
    builder.addSection('Section', 'Content');
    builder.addSummary({ commandName: 'test', executionTime: 100, success: true });
    
    const output = builder.build();
    expect(output).not.toContain('Processing');
    expect(output).toContain('Section');
  });

  it('should handle very long content', () => {
    const builder = new VerboseOutputBuilder();
    const longContent = 'x'.repeat(10000);
    builder.addSection('Large Section', longContent);
    builder.addSummary({ commandName: 'test', executionTime: 100, success: true });
    
    const output = builder.build();
    expect(output).toContain('Large Section');
    expect(output.length).toBeGreaterThan(10000);
  });
});

describe('StreamingOutputBuilder', () => {
  it('should output progress messages immediately', () => {
    const builder = new StreamingOutputBuilder();
    
    // Note: In real execution, addProgress prints to console immediately
    // For testing, we can verify the method is callable
    expect(() => {
      builder.addProgress('Step 1...');
      builder.addProgress('Step 2...');
    }).not.toThrow();
  });

  it('should not accumulate sections', () => {
    const builder = new StreamingOutputBuilder();
    builder.addSection?.('Section', 'Content');
    
    // Streaming builder doesn't accumulate, so build returns empty
    const output = builder.build();
    expect(output).toBe('');
  });

  it('should build final summary', () => {
    const builder = new StreamingOutputBuilder();
    builder.addProgress('Processing...');
    builder.addSummary({ commandName: 'test', executionTime: 100, success: true });
    
    // StreamingOutputBuilder outputs immediately to console and returns empty string
    const output = builder.build();
    expect(output).toBe('');
  });
});

describe('createOutputBuilder factory', () => {
  it('should create QuietOutputBuilder for quiet level', () => {
    const builder = createOutputBuilder('quiet');
    expect(builder).toBeInstanceOf(QuietOutputBuilder);
  });

  it('should create SummaryOutputBuilder for summary level', () => {
    const builder = createOutputBuilder('summary');
    expect(builder).toBeInstanceOf(SummaryOutputBuilder);
  });

  it('should create VerboseOutputBuilder for verbose level', () => {
    const builder = createOutputBuilder('verbose');
    expect(builder).toBeInstanceOf(VerboseOutputBuilder);
  });

  it('should create StreamingOutputBuilder for stream level', () => {
    const builder = createOutputBuilder('stream');
    expect(builder).toBeInstanceOf(StreamingOutputBuilder);
  });

  it('should default to SummaryOutputBuilder for undefined', () => {
    const builder = createOutputBuilder(undefined as any);
    expect(builder).toBeInstanceOf(SummaryOutputBuilder);
  });
});

describe('OutputBuilder edge cases', () => {
  it('should handle minimal summary data', () => {
    const builder = new SummaryOutputBuilder();
    builder.addSummary({ commandName: 'test', executionTime: 50, success: true });
    
    const output = builder.build();
    expect(output).toContain('test');
    expect(output).toContain('50ms');
  });

  it('should handle missing execution time gracefully', () => {
    const builder = new QuietOutputBuilder();
    builder.addSummary?.({ commandName: 'minimal', executionTime: 0, success: true });
    
    const output = builder.build();
    expect(output).toContain('minimal');
  });

  it('should handle multiple addSummary calls (last wins)', () => {
    const builder = new SummaryOutputBuilder();
    builder.addSummary({ commandName: 'test1', executionTime: 100, success: false });
    builder.addSummary({ commandName: 'test2', executionTime: 200, success: true });
    
    const output = builder.build();
    expect(output).toContain('test2');
    expect(output).toContain('200ms');
    expect(output).not.toContain('test1');
  });

  it('should handle special characters in content', () => {
    const builder = new VerboseOutputBuilder();
    builder.addSection('Special', 'Content with "quotes" and \\backslashes\\');
    builder.addSummary({ commandName: 'test', executionTime: 100, success: true });
    
    const output = builder.build();
    expect(output).toContain('"quotes"');
    expect(output).toContain('\\backslashes\\');
  });

  it('should handle unicode characters', () => {
    const builder = new SummaryOutputBuilder();
    builder.addSummary({ 
      commandName: '测试', 
      executionTime: 100, 
      success: true,
      referenceToken: 'Unicode ✨ test 🎉'
    });
    
    const output = builder.build();
    expect(output).toContain('测试');
    expect(output).toContain('✨');
    expect(output).toContain('🎉');
  });
});
