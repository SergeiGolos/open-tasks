import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskLogger } from '../src/logging/TaskLogger.js';
import { ConsoleOutputBuilder } from '../src/output-builders.js';
import { MessageCard } from '../src/cards/MessageCard.js';
import { IOutputSynk } from '../src/types.js';

describe('TaskLogger', () => {
  let mockSynk: IOutputSynk;

  beforeEach(() => {
    mockSynk = {
      write: vi.fn() as any,
      writeCommandStart: vi.fn(),
      writeCommandEnd: vi.fn(),
      writeFileCreated: vi.fn(),
      writeCard: vi.fn(),
      writeProgress: vi.fn(),
      writeInfo: vi.fn(),
      writeWarning: vi.fn(),
      writeError: vi.fn(),
    };
  });

  it('should log command start on creation', () => {
    new TaskLogger(mockSynk as IOutputSynk, 'test-command');
    
    expect(mockSynk.writeCommandStart).toHaveBeenCalledWith('test-command');
  });

  it('should track file creation', () => {
    const logger = new TaskLogger(mockSynk as IOutputSynk, 'test');
    
    logger.fileCreated('/path/to/file.txt');
    
    expect(mockSynk.writeFileCreated).toHaveBeenCalledWith('/path/to/file.txt');
  });

  it('should write cards', () => {
    const logger = new TaskLogger(mockSynk as IOutputSynk, 'test');
    const card = new MessageCard('Test', 'Content');
    
    logger.card(card);
    
    expect(mockSynk.writeCard).toHaveBeenCalledWith(card);
  });

  it('should write progress messages', () => {
    const logger = new TaskLogger(mockSynk as IOutputSynk, 'test');
    
    logger.progress('Processing...');
    
    expect(mockSynk.writeProgress).toHaveBeenCalledWith('Processing...');
  });

  it('should write info messages', () => {
    const logger = new TaskLogger(mockSynk as IOutputSynk, 'test');
    
    logger.info('Information');
    
    expect(mockSynk.writeInfo).toHaveBeenCalledWith('Information');
  });

  it('should write warning messages', () => {
    const logger = new TaskLogger(mockSynk as IOutputSynk, 'test');
    
    logger.warning('Be careful!');
    
    expect(mockSynk.writeWarning).toHaveBeenCalledWith('Be careful!');
  });

  it('should write error messages', () => {
    const logger = new TaskLogger(mockSynk as IOutputSynk, 'test');
    
    logger.error('Something went wrong');
    
    expect(mockSynk.writeError).toHaveBeenCalledWith('Something went wrong');
  });

  it('should log command end with duration on complete', () => {
    const logger = new TaskLogger(mockSynk as IOutputSynk, 'test');
    
    logger.complete();
    
    expect(mockSynk.writeCommandEnd).toHaveBeenCalled();
    const duration = (mockSynk.writeCommandEnd as any).mock.calls[0][0];
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});

describe('ConsoleOutputBuilder Verbosity Levels', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('quiet mode', () => {
    it('should show only quiet-level output', () => {
      const synk = new ConsoleOutputBuilder('quiet');
      const consoleSpy = vi.spyOn(console, 'log');
      
      synk.writeCommandStart('test');        // ✓ Should show
      synk.writeFileCreated('file.txt');     // ✓ Should track
      synk.writeCommandEnd(100);             // ✓ Should show
      synk.writeCard(new MessageCard('', ''));  // ✗ Should NOT show
      synk.writeProgress('Loading...');      // ✗ Should NOT show
      
      // Should only see command start and end
      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('summary mode', () => {
    it('should show quiet + summary output', () => {
      const synk = new ConsoleOutputBuilder('summary');
      const consoleSpy = vi.spyOn(console, 'log');
      
      synk.writeCommandStart('test');        // ✓ Should show
      synk.writeCard(new MessageCard('Title', 'Content'));  // ✓ Should show
      synk.writeCommandEnd(100);             // ✓ Should show
      synk.writeProgress('Loading...');      // ✗ Should NOT show
      
      // Should see: start + card + end = 3
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('verbose mode', () => {
    it('should show all output', () => {
      const synk = new ConsoleOutputBuilder('verbose');
      const consoleSpy = vi.spyOn(console, 'log');
      
      synk.writeCommandStart('test');        // ✓ Should show
      synk.writeProgress('Step 1...');       // ✓ Should show
      synk.writeInfo('Information');         // ✓ Should show
      synk.writeWarning('Careful!');         // ✓ Should show
      synk.writeCard(new MessageCard('Title', 'Content'));  // ✓ Should show
      synk.writeCommandEnd(100);             // ✓ Should show
      
      // Should see: start + 3 messages + card + end = 6
      expect(consoleSpy).toHaveBeenCalledTimes(6);
    });
  });
});
