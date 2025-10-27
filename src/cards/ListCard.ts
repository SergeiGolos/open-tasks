import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';
import { getBoxenOptions } from './CardStyleUtils.js';

/**
 * ListCard - displays items as a bulleted or numbered list
 */
export class ListCard implements ICardBuilder {
  name: string;
  verbosity?: VerbosityLevel;

  constructor(
    private title: string,
    private items: string[],
    private ordered: boolean = false,
    private style: CardStyle = 'default',
    verbosity?: VerbosityLevel
  ) {
    this.name = `ListCard:${title}`;
    this.verbosity = verbosity;
  }

  build(): string {
    const content = this.renderList();
    const options = getBoxenOptions(this.title, this.style);
    return boxen(content, options);
  }

  private renderList(): string {
    return this.items.map((item, idx) => {
      const prefix = this.ordered ? `${idx + 1}.` : '•';
      return `${prefix} ${item}`;
    }).join('\n');
  }
}
