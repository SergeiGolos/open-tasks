import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';
import { getBoxenOptions } from './CardStyleUtils.js';

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
    const options = getBoxenOptions(this.title, this.style);
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
}
