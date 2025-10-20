import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';

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
    const options = this.getBoxenOptions(this.title, this.style);
    return boxen(content, options);
  }

  private renderList(): string {
    return this.items.map((item, idx) => {
      const prefix = this.ordered ? `${idx + 1}.` : '•';
      return `${prefix} ${item}`;
    }).join('\n');
  }

  private getStyleOptions(style: CardStyle) {
    const styles = {
      info: { borderStyle: 'round' as const, borderColor: 'blue' as const },
      success: { borderStyle: 'round' as const, borderColor: 'green' as const },
      warning: { borderStyle: 'round' as const, borderColor: 'yellow' as const },
      error: { borderStyle: 'round' as const, borderColor: 'red' as const },
      dim: { borderStyle: 'round' as const, borderColor: 'gray' as const, dimBorder: true },
      default: { borderStyle: 'round' as const },
    };

    return styles[style] || styles.default;
  }

  private getBoxenOptions(title: string, style: CardStyle) {
    const baseOptions = {
      title: title,
      titleAlignment: 'left' as const,
      padding: 1,
    };

    const styleOptions = this.getStyleOptions(style);
    
    // Handle NO_COLOR
    if (process.env.NO_COLOR) {
      return {
        ...baseOptions,
        borderStyle: 'single' as const,
      };
    }

    return { ...baseOptions, ...styleOptions };
  }
}
