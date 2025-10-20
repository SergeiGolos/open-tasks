import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';

/**
 * TableCard - displays data in a formatted table
 */
export class TableCard implements ICardBuilder {
  name: string;
  verbosity?: VerbosityLevel;

  constructor(
    private title: string,
    private headers: string[],
    private rows: string[][],
    private footer?: string,
    private style: CardStyle = 'default',
    verbosity?: VerbosityLevel
  ) {
    this.name = `TableCard:${title}`;
    this.verbosity = verbosity;
  }

  build(): string {
    const content = this.renderTable();
    const options = this.getBoxenOptions(this.title, this.style);
    return boxen(content, options);
  }

  private renderTable(): string {
    const lines: string[] = [];

    // Calculate column widths
    const colWidths = this.headers.map(h => h.length);
    for (const row of this.rows) {
      row.forEach((cell, idx) => {
        colWidths[idx] = Math.max(colWidths[idx] || 0, cell.length);
      });
    }

    // Pad a cell to the column width
    const pad = (text: string, width: number) => text.padEnd(width, ' ');

    // Headers
    const headerLine = this.headers
      .map((h, idx) => pad(h, colWidths[idx]))
      .join(' │ ');
    lines.push(headerLine);

    // Separator
    const separator = colWidths
      .map(w => '─'.repeat(w))
      .join('─┼─');
    lines.push(separator);

    // Rows
    for (const row of this.rows) {
      const rowLine = row
        .map((cell, idx) => pad(cell, colWidths[idx]))
        .join(' │ ');
      lines.push(rowLine);
    }

    // Footer
    if (this.footer) {
      lines.push('');
      lines.push(this.footer);
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
