import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';

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
    const options = this.getBoxenOptions(this.title, this.style);
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
