import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';
import { getBoxenOptions } from './CardStyleUtils.js';

/**
 * MessageCard - displays a simple text message in a styled box
 * Cards are always SUMMARY level by specification
 */
export class MessageCard implements ICardBuilder {
  name: string;

  constructor(
    private title: string,
    private content: string,
    private style: CardStyle = 'default'
  ) {
    this.name = `MessageCard:${title}`;
  }
  type: string = "MessageCard";

  build(): string {
    const options = getBoxenOptions(this.title, this.style);
    return boxen(this.content, options);
  }
}
