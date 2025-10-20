import { 
  ICardBuilder, 
  CardContent, 
  CardStyle,
  VerbosityLevel
} from './types.js';
import { BoxCard } from './cards/index.js';


/**
 * SummaryCardBuilder - shows cards without progress messages
 * Used when verbosity = 'summary' (default)
 * Shows visual cards but skips progress messages for cleaner output
 */
export class SummaryCardBuilder implements ICardBuilder {
  name = 'SummaryCardBuilder';
  verbosity: VerbosityLevel = 'summary';
  
  private cards: BoxCard[] = [];
  private summary?: any;

  addProgress(_message: string): void {
    // Summary mode ignores progress messages
  }

  addCard(title: string, content: CardContent, style?: CardStyle): void {
    const card = new BoxCard(
      `${this.name}-card-${this.cards.length}`,
      title,
      content,
      style,
      this.verbosity
    );
    this.cards.push(card);
  }

  setSummary(summary: any): void {
    this.summary = summary;
  }

  build(): string {
    if (this.cards.length === 0) {
      return '';
    }

    return this.cards
      .map((card, index) => {
        // Append summary to the last card
        const isLastCard = index === this.cards.length - 1;
        if (isLastCard && this.summary) {
          card.setSummary(this.summary);
        }
        return card.build();
      })
      .join('\n\n');
  }
}

/**
 * VerboseCardBuilder - shows all cards with full formatting
 * Used when verbosity = 'verbose'
 */
export class VerboseCardBuilder implements ICardBuilder {
  name = 'VerboseCardBuilder';
  verbosity: VerbosityLevel = 'verbose';
  
  private cards: BoxCard[] = [];
  private progressMessages: string[] = [];
  private summary?: any;

  addProgress(message: string): void {
    this.progressMessages.push(message);
  }

  addCard(title: string, content: CardContent, style?: CardStyle): void {
    const card = new BoxCard(
      `${this.name}-card-${this.cards.length}`,
      title,
      content,
      style,
      this.verbosity
    );
    this.cards.push(card);
  }

  setSummary(summary: any): void {
    this.summary = summary;
  }

  build(): string {
    const parts: string[] = [];

    // Add progress messages if any
    if (this.progressMessages.length > 0) {
      parts.push(this.progressMessages.map(msg => `⏳ ${msg}`).join('\n'));
    }

    // Add cards
    if (this.cards.length > 0) {
      const cardOutput = this.cards
        .map((card, index) => {
          // Append summary to the last card
          const isLastCard = index === this.cards.length - 1;
          if (isLastCard && this.summary) {
            card.setSummary(this.summary);
          }
          return card.build();
        })
        .join('\n\n');
      
      parts.push(cardOutput);
    }

    return parts.join('\n\n');
  }
}