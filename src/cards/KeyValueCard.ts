import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';
import { getBoxenOptions } from './CardStyleUtils.js';

/**
 * KeyValueCard - displays key-value pairs in a formatted box
 */
export class KeyValueCard implements ICardBuilder {
  name: string;
  verbosity?: VerbosityLevel;

  constructor(
    private title: string,
    private data: Record<string, any>,
    private style: CardStyle = 'default',
    verbosity?: VerbosityLevel
  ) {
    this.name = `KeyValueCard:${title}`;
    this.verbosity = verbosity;
  }

  build(): string {
    const content = this.renderKeyValue();
    const options = getBoxenOptions(this.title, this.style);
    return boxen(content, options);
  }

  private renderKeyValue(): string {
    const lines: string[] = [];
    
    for (const [key, value] of Object.entries(this.data)) {
      const formattedValue = typeof value === 'object' 
        ? JSON.stringify(value, null, 2)
        : String(value);
      
      lines.push(`${key}: ${formattedValue}`);
    }

    return lines.join('\n');
  }
}
