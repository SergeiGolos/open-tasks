import { 
  ICardBuilder, 
  CardContent, 
  TableCard, 
  ListCard, 
  TreeCard,
  TreeNode,
  VerbosityLevel 
} from './types.js';

/**
 * Factory function to create appropriate CardBuilder based on verbosity level
 * Called by the framework (router/context), not by commands
 */
export function createCardBuilder(verbosity: VerbosityLevel = 'summary'): ICardBuilder {
  switch (verbosity) {
    case 'quiet':
      return new QuietCardBuilder();
    case 'summary':
      return new SummaryCardBuilder();
    case 'verbose':
      return new VerboseCardBuilder();
    default:
      console.warn(`Unknown verbosity level: ${verbosity}. Using 'summary' mode.`);
      return new SummaryCardBuilder();
  }
}

/**
 * QuietCardBuilder - ignores all cards for minimal output
 * Used when verbosity = 'quiet'
 */
export class QuietCardBuilder implements ICardBuilder {
  addProgress(_message: string): void {
    // Quiet mode ignores progress
  }

  addCard(_title: string, _content: CardContent): void {
    // Quiet mode ignores cards
  }

  build(): string {
    // No cards in quiet mode
    return '';
  }
}

/**
 * SummaryCardBuilder - ignores cards to maintain current default behavior
 * Used when verbosity = 'summary' (default)
 * May be enhanced in future to show first card or limited cards
 */
export class SummaryCardBuilder implements ICardBuilder {
  addProgress(_message: string): void {
    // Summary mode ignores progress
  }

  addCard(_title: string, _content: CardContent): void {
    // Summary mode currently ignores cards
    // Future enhancement: could show first card or limited cards
  }

  build(): string {
    // No cards in summary mode (maintains current behavior)
    return '';
  }
}

/**
 * VerboseCardBuilder - shows all cards with full formatting
 * Used when verbosity = 'verbose'
 */
export class VerboseCardBuilder implements ICardBuilder {
  private cards: Array<{ title: string; content: CardContent }> = [];
  private progressMessages: string[] = [];

  addProgress(message: string): void {
    this.progressMessages.push(message);
  }

  addCard(title: string, content: CardContent): void {
    this.cards.push({ title, content });
  }

  build(): string {
    if (this.cards.length === 0 && this.progressMessages.length === 0) {
      return '';
    }

    const lines: string[] = [];

    // Optionally add progress messages (commented out by default)
    // Progress is typically shown inline, not in final build
    // Uncomment if you want to see all progress messages in verbose mode
    /*
    if (this.progressMessages.length > 0) {
      lines.push('\n⏳ Progress');
      lines.push('─'.repeat(80));
      this.progressMessages.forEach(msg => lines.push(`  ${msg}`));
    }
    */

    // Add all cards
    for (const { title, content } of this.cards) {
      const rendered = this.renderCard(content);
      lines.push('');
      lines.push(title);
      lines.push('─'.repeat(Math.min(title.length, 80)));
      lines.push(rendered);
    }

    return lines.join('\n');
  }

  /**
   * Render a card based on its content type
   */
  private renderCard(content: CardContent): string {
    // Plain string
    if (typeof content === 'string') {
      return content;
    }

    // Check for structured card types with proper type narrowing
    if ('type' in content) {
      if (content.type === 'table') {
        return this.renderTable(content as TableCard);
      }
      if (content.type === 'list') {
        return this.renderList(content as ListCard);
      }
      if (content.type === 'tree') {
        return this.renderTree(content as TreeCard);
      }
    }

    // Default: render object as JSON
    return JSON.stringify(content, null, 2);
  }

  /**
   * Render a table card with headers and rows
   */
  private renderTable(table: TableCard): string {
    const lines: string[] = [];

    // Calculate column widths
    const colWidths = table.headers.map(h => h.length);
    for (const row of table.rows) {
      row.forEach((cell, idx) => {
        colWidths[idx] = Math.max(colWidths[idx] || 0, cell.length);
      });
    }

    // Pad a cell to the column width
    const pad = (text: string, width: number) => text.padEnd(width, ' ');

    // Headers
    const headerLine = table.headers
      .map((h, idx) => pad(h, colWidths[idx]))
      .join(' │ ');
    lines.push(headerLine);

    // Separator
    const separator = colWidths
      .map(w => '─'.repeat(w))
      .join('─┼─');
    lines.push(separator);

    // Rows
    for (const row of table.rows) {
      const rowLine = row
        .map((cell, idx) => pad(cell, colWidths[idx]))
        .join(' │ ');
      lines.push(rowLine);
    }

    // Footer
    if (table.footer) {
      lines.push('');
      lines.push(table.footer);
    }

    return lines.join('\n');
  }

  /**
   * Render a list card
   */
  private renderList(list: ListCard): string {
    return list.items.map((item, idx) => {
      const prefix = list.ordered ? `${idx + 1}.` : '•';
      return `${prefix} ${item}`;
    }).join('\n');
  }

  /**
   * Render a tree card with hierarchical structure
   */
  private renderTree(tree: TreeCard): string {
    const lines: string[] = [];

    const traverse = (node: TreeNode, prefix: string = '', isLast: boolean = true) => {
      const connector = isLast ? '└── ' : '├── ';
      const icon = node.icon ? `${node.icon} ` : '';
      lines.push(`${prefix}${connector}${icon}${node.label}`);

      if (node.children && node.children.length > 0) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        node.children.forEach((child, idx) => {
          traverse(child, childPrefix, idx === node.children!.length - 1);
        });
      }
    };

    traverse(tree.root);
    return lines.join('\n');
  }
}
