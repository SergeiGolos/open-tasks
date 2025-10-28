import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel, TreeNode } from '../types.js';
import { getBoxenOptions } from './CardStyleUtils.js';

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
    const options = getBoxenOptions(this.title, this.style);
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
}
