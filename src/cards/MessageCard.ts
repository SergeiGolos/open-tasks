import boxen from 'boxen';
import { ICardBuilder, CardStyle, VerbosityLevel } from '../types.js';
import { getBoxenOptions } from './CardStyleUtils.js';

/**
 * MessageCard - displays a simple text message in a styled box
 */
export class MessageCard implements ICardBuilder {
  name: string;
  verbosity?: VerbosityLevel;

  constructor(
    private title: string,
    private content: string,
    private style: CardStyle = 'default',
    verbosity?: VerbosityLevel
  ) {
    this.name = `MessageCard:${title}`;
    this.verbosity = verbosity;
  }
  type: string = "MessageCard";

  build(): string {
    const options = getBoxenOptions(this.title, this.style);
    return boxen(this.content, options);
  }
}
