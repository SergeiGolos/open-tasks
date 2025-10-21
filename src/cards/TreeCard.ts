import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel, TreeNode } from '../types.js';

/**
 * TreeCard - displays hierarchical data as a tree structure
 * Cards are always SUMMARY level by specification
 */
export class TreeCard implements ICardBuilder {
  name: string;
  type: string = 'TreeCard';

  constructor(
    private title: string,
    private root: TreeNode,
    private style: CardStyle = 'default'
  ) {
    this.name = `TreeCard:${title}`;
  }

  build(): string {
    const content = this.renderTree();
    const options = this.getBoxenOptions(this.title, this.style);
    return boxen(content, options);
  }

  private renderTree(): string {
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

    traverse(this.root);
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
