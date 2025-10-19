import { describe, it, expect } from 'vitest';
import {
  createCardBuilder,
  QuietCardBuilder,
  SummaryCardBuilder,
  VerboseCardBuilder,
} from '../src/card-builders.js';
import type { CardContent, CardStyle } from '../src/types.js';

describe('createCardBuilder factory', () => {
  it('should create QuietCardBuilder for quiet level', () => {
    const builder = createCardBuilder('quiet');
    expect(builder).toBeInstanceOf(QuietCardBuilder);
  });

  it('should create SummaryCardBuilder for summary level', () => {
    const builder = createCardBuilder('summary');
    expect(builder).toBeInstanceOf(SummaryCardBuilder);
  });

  it('should create VerboseCardBuilder for verbose level', () => {
    const builder = createCardBuilder('verbose');
    expect(builder).toBeInstanceOf(VerboseCardBuilder);
  });
});

describe('VerboseCardBuilder', () => {
  it('should render a table card with borders', () => {
    const builder = new VerboseCardBuilder();
    const tableContent: CardContent = {
      type: 'table',
      headers: ['Name', 'Status'],
      rows: [
        ['Task 1', 'Success'],
        ['Task 2', 'Failed'],
      ],
    };
    builder.addCard('Test Table', tableContent, 'info');
    const output = builder.build();
    expect(output).toContain('Test Table');
    expect(output).toContain('Name');
    expect(output).toContain('Status');
    expect(output).toContain('Task 1');
    expect(output).toContain('Success');
    expect(output).toContain('Task 2');
    expect(output).toContain('Failed');
    // Check for boxen characters
    expect(output).toMatch(/╭.*╮/);
    expect(output).toMatch(/╰.*╯/);
  });

  it('should render a list card with borders', () => {
    const builder = new VerboseCardBuilder();
    const listContent: CardContent = {
      type: 'list',
      items: ['Item 1', 'Item 2'],
    };
    builder.addCard('Test List', listContent, 'success');
    const output = builder.build();
    expect(output).toContain('Test List');
    expect(output).toContain('Item 1');
    expect(output).toContain('Item 2');
    // Check for boxen characters
    expect(output).toMatch(/╭.*╮/);
    expect(output).toMatch(/╰.*╯/);
  });

  it('should render a tree card with borders', () => {
    const builder = new VerboseCardBuilder();
    const treeContent: CardContent = {
      type: 'tree',
      root: {
        label: 'root',
        children: [
          { label: 'child1' },
          { label: 'child2' },
        ],
      },
    };
    builder.addCard('Test Tree', treeContent, 'warning');
    const output = builder.build();
    expect(output).toContain('Test Tree');
    expect(output).toContain('root');
    expect(output).toContain('child1');
    expect(output).toContain('child2');
    // Check for boxen characters
    expect(output).toMatch(/╭.*╮/);
    expect(output).toMatch(/╰.*╯/);
  });
});

describe('VerboseCardBuilder private methods', () => {
  it('getStyleOptions should return correct styles', () => {
    const builder = new VerboseCardBuilder();
    // @ts-ignore
    expect(builder.getStyleOptions('info')).toEqual({ borderStyle: 'round', borderColor: 'blue' });
    // @ts-ignore
    expect(builder.getStyleOptions('success')).toEqual({ borderStyle: 'round', borderColor: 'green' });
    // @ts-ignore
    expect(builder.getStyleOptions('warning')).toEqual({ borderStyle: 'round', borderColor: 'yellow' });
    // @ts-ignore
    expect(builder.getStyleOptions('error')).toEqual({ borderStyle: 'round', borderColor: 'red' });
    // @ts-ignore
    expect(builder.getStyleOptions('dim')).toEqual({ borderStyle: 'round', borderColor: 'gray', dimBorder: true });
    // @ts-ignore
    expect(builder.getStyleOptions('default')).toEqual({ borderStyle: 'round' });
  });

  it('getBoxenOptions should handle NO_COLOR', () => {
    const builder = new VerboseCardBuilder();
    process.env.NO_COLOR = 'true';
    // @ts-ignore
    const options = builder.getBoxenOptions('Test', 'info');
    expect(options.borderStyle).toBe('single');
    expect(options.borderColor).toBeUndefined();
    delete process.env.NO_COLOR;
  });
});

describe('VerboseCardBuilder snapshots', () => {
  const styles: CardStyle[] = ['info', 'success', 'warning', 'error', 'dim', 'default'];
  for (const style of styles) {
    it(`should match snapshot for ${style} style`, () => {
      const builder = new VerboseCardBuilder();
      builder.addCard(`Test ${style}`, 'This is a test card', style);
      const output = builder.build();
      expect(output).toMatchSnapshot();
    });
  }
});
