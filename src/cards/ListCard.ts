import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';
import { getBoxenOptions } from './CardStyleUtils.js';

/**
 * ListCard - displays items as a bulleted or numbered list
 * Cards are always SUMMARY level by specification
 */
export class ListCard implements ICardBuilder {
  name: string;
  type: string = 'ListCard';

  constructor(
    private title: string,
    private items: string[],
    private ordered: boolean = false,
    private style: CardStyle = 'default'
  ) {
    this.name = `ListCard:${title}`;
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
