import { describe, it, expect } from 'vitest';
import {
  TokenDecorator,
  FileNameDecorator,
  TimestampedFileNameDecorator,
} from '../src/workflow/decorators';
import { StringRef } from '../src/workflow/types';

describe('Decorators', () => {
  const baseRef: StringRef = {
    id: 'test-id',
    content: 'test content',
    timestamp: new Date('2025-10-18T12:30:45.678Z'),
  };

  describe('TokenDecorator', () => {
    it('should add a token to a reference', () => {
      const decorator = new TokenDecorator('mytoken');
      const decorated = decorator.decorate(baseRef);
      
      expect(decorated.token).toBe('mytoken');
      expect(decorated.id).toBe(baseRef.id);
      expect(decorated.content).toBe(baseRef.content);
    });
  });

  describe('FileNameDecorator', () => {
    it('should add a file name to a reference', () => {
      const decorator = new FileNameDecorator('myfile.txt');
      const decorated = decorator.decorate(baseRef);
      
      expect(decorated.fileName).toBe('myfile.txt');
      expect(decorated.id).toBe(baseRef.id);
    });
  });

  describe('TimestampedFileNameDecorator', () => {
    it('should create a timestamped file name', () => {
      const decorator = new TimestampedFileNameDecorator('mytoken');
      const decorated = decorator.decorate(baseRef);
      
      expect(decorated.fileName).toBeDefined();
      expect(decorated.fileName).toContain('mytoken');
      expect(decorated.fileName).toMatch(/^\d{8}T\d{6}-\d{3}-mytoken\.txt$/);
    });

    it('should use custom extension', () => {
      const decorator = new TimestampedFileNameDecorator('mytoken', 'json');
      const decorated = decorator.decorate(baseRef);
      
      expect(decorated.fileName).toContain('.json');
    });

    it('should format timestamp correctly', () => {
      const decorator = new TimestampedFileNameDecorator('test');
      const decorated = decorator.decorate(baseRef);
      
      // Should start with formatted date
      expect(decorated.fileName).toMatch(/^20251018T123045-678-test\.txt$/);
    });
  });

  describe('Decorator chaining', () => {
    it('should apply multiple decorators', () => {
      const tokenDecorator = new TokenDecorator('mytoken');
      const fileDecorator = new FileNameDecorator('myfile.txt');
      
      let decorated = tokenDecorator.decorate(baseRef);
      decorated = fileDecorator.decorate(decorated);
      
      expect(decorated.token).toBe('mytoken');
      expect(decorated.fileName).toBe('myfile.txt');
    });
  });
});
