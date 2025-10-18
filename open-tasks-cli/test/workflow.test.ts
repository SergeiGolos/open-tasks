import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryWorkflowContext } from '../src/workflow/in-memory-context';
import { TokenDecorator } from '../src/workflow/decorators';

describe('InMemoryWorkflowContext', () => {
  let context: InMemoryWorkflowContext;

  beforeEach(() => {
    context = new InMemoryWorkflowContext();
  });

  it('should store a value without decorators', async () => {
    const ref = await context.store('test value');
    
    expect(ref.id).toBeDefined();
    expect(ref.content).toBe('test value');
    expect(ref.timestamp).toBeInstanceOf(Date);
  });

  it('should store a value with token decorator', async () => {
    const decorators = [new TokenDecorator('mytoken')];
    const ref = await context.store('test value', decorators);
    
    expect(ref.token).toBe('mytoken');
    expect(ref.content).toBe('test value');
  });

  it('should retrieve value by token', async () => {
    const decorators = [new TokenDecorator('mytoken')];
    await context.store('test value', decorators);
    
    const value = context.token('mytoken');
    expect(value).toBe('test value');
  });

  it('should return undefined for non-existent token', () => {
    const value = context.token('nonexistent');
    expect(value).toBeUndefined();
  });

  it('should get reference by ID', async () => {
    const ref = await context.store('test value');
    
    const retrieved = context.get(ref.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.content).toBe('test value');
  });

  it('should get reference by token', async () => {
    const decorators = [new TokenDecorator('mytoken')];
    await context.store('test value', decorators);
    
    const retrieved = context.get('mytoken');
    expect(retrieved).toBeDefined();
    expect(retrieved?.content).toBe('test value');
  });

  it('should list all references', async () => {
    await context.store('value1');
    await context.store('value2');
    await context.store('value3');
    
    const refs = context.list();
    expect(refs).toHaveLength(3);
  });

  it('should clear all references', async () => {
    await context.store('value1');
    await context.store('value2');
    
    context.clear();
    
    const refs = context.list();
    expect(refs).toHaveLength(0);
  });

  it('should update token index when same token is used', async () => {
    const decorators1 = [new TokenDecorator('mytoken')];
    await context.store('first value', decorators1);
    
    const decorators2 = [new TokenDecorator('mytoken')];
    await context.store('second value', decorators2);
    
    // Should return the latest value for the token
    const value = context.token('mytoken');
    expect(value).toBe('second value');
  });
});
