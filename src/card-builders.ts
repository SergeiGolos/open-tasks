import boxen from 'boxen';
import { 
  ICardBuilder, 
  CardContent, 
  TableCard, 
  ListCard, 
  TreeCard,
  TreeNode, 
  CardStyle
} from './types.js';


/**
 * SummaryCardBuilder - shows cards without progress messages
 * Used when verbosity = 'summary' (default)
 * Shows visual cards but skips progress messages for cleaner output
 */
export class SummaryCardBuilder implements ICardBuilder {
  private cards: Array<{ title: string; content: CardContent; style?: CardStyle }> = [];
  private summary?: any;

  addProgress(_message: string): void {
    // Summary mode ignores progress messages
  }

  addCard(title: string, content: CardContent, style?: CardStyle): void {
    this.cards.push({ title, content, style });
  }

  setSummary(summary: any): void {
    this.summary = summary;
  }

  build(): string {
    if (this.cards.length === 0) {
      return '';
    }

    return this.cards
      .map(({ title, content, style }, index) => {
        // Append summary to the last card
        const isLastCard = index === this.cards.length - 1;
        return this.renderCard(title, content, style, isLastCard ? this.summary : undefined);
      })
      .join('\n\n');
  }

  private renderCard(title: string, content: CardContent, style?: CardStyle, summary?: any): string {
    let formatted = this.formatContent(content);
    
    // Append summary if provided
    if (summary) {
      const summaryLines = [
        '─'.repeat(60),
        `✓ ${summary.commandName} completed in ${summary.executionTime}ms`,
      ];
      
      if (summary.referenceToken) {
        summaryLines.push(`Token:`);
        summaryLines.push(`- ${summary.referenceToken} | ID: ${summary.metadata?.referenceId || 'N/A'} | Time: ${summary.metadata?.timestamp || 'N/A'}`);
      }
      
      formatted += '\n' + summaryLines.join('\n');
    }
    
    const options = this.getBoxenOptions(title, style);
    return boxen(formatted, options);
  }

  /**
   * Format a card's content based on its type
   */
  private formatContent(content: CardContent): string {
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

  private getBoxenOptions(title: string, style?: CardStyle) {
    const baseOptions = {
      title: title,
      titleAlignment: 'left' as const,
      padding: 1,
    };

    const styleOptions = this.getStyleOptions(style || 'default');
    
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

/**
 * VerboseCardBuilder - shows all cards with full formatting
 * Used when verbosity = 'verbose'
 */
export class VerboseCardBuilder implements ICardBuilder {
  private cards: Array<{ title: string; content: CardContent; style?: CardStyle }> = [];
  private progressMessages: string[] = [];
  private summary?: any;

  addProgress(message: string): void {
    this.progressMessages.push(message);
  }

  addCard(title: string, content: CardContent, style?: CardStyle): void {
    this.cards.push({ title, content, style });
  }

  setSummary(summary: any): void {
    this.summary = summary;
  }

  build(): string {
    if (this.cards.length === 0) {
      return '';
    }

    return this.cards
      .map(({ title, content, style }, index) => {
        // Append summary to the last card
        const isLastCard = index === this.cards.length - 1;
        return this.renderCard(title, content, style, isLastCard ? this.summary : undefined);
      })
      .join('\n\n');
  }

  private renderCard(title: string, content: CardContent, style?: CardStyle, summary?: any): string {
    let formatted = this.formatContent(content);
    
    // Append summary if provided
    if (summary) {
      const summaryLines = [
        '─'.repeat(60),
        `✓ ${summary.commandName} completed in ${summary.executionTime}ms`,
      ];
      
      if (summary.referenceToken) {
        summaryLines.push(`Token:`);
        summaryLines.push(`- ${summary.referenceToken} | ID: ${summary.metadata?.referenceId || 'N/A'} | Time: ${summary.metadata?.timestamp || 'N/A'}`);
      }
      
      formatted += '\n' + summaryLines.join('\n');
    }
    
    const options = this.getBoxenOptions(title, style);
    return boxen(formatted, options);
  }

  /**
   * Format a card's content based on its type
   */
  private formatContent(content: CardContent): string {
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

  private getBoxenOptions(title: string, style?: CardStyle) {
    const baseOptions = {
      title: title,
      titleAlignment: 'left' as const,
      padding: 1,
    };

    const styleOptions = this.getStyleOptions(style || 'default');
    
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