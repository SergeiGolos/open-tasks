import { describe, it, expect, beforeEach } from 'vitest';
import { CommandRouter } from '../src/router';
import { TaskHandler, ExecutionContext, ReferenceHandle } from '../src/types';

class TestCommand extends TaskHandler {
  name = 'test';
  description = 'Test command';
  examples = ['test example'];

  async execute(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    return {
      id: 'test-id',
      content: 'test result',
      timestamp: new Date(),
    };
  }
}

describe('CommandRouter', () => {
  let router: CommandRouter;

  beforeEach(() => {
    router = new CommandRouter();
  });

  it('should register a command', () => {
    const command = new TestCommand();
    router.register('test', command);
    
    const retrieved = router.get('test');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('test');
  });

  it('should return undefined for non-existent command', () => {
    const retrieved = router.get('nonexistent');
    expect(retrieved).toBeUndefined();
  });

  it('should list all commands', () => {
    const command1 = new TestCommand();
    const command2 = new TestCommand();
    command2.name = 'test2';
    command2.description = 'Test command 2';

    router.register('test1', command1);
    router.register('test2', command2);
    
    const commands = router.listCommands();
    expect(commands).toHaveLength(2);
    expect(commands[0].name).toBe('test1');
    expect(commands[1].name).toBe('test2');
  });

  it('should get command help', () => {
    const command = new TestCommand();
    router.register('test', command);
    
    const help = router.getCommandHelp('test');
    expect(help).toBeDefined();
    expect(help?.name).toBe('test');
    expect(help?.description).toBe('Test command');
    expect(help?.examples).toContain('test example');
  });

  it('should return undefined for help of non-existent command', () => {
    const help = router.getCommandHelp('nonexistent');
    expect(help).toBeUndefined();
  });
});
