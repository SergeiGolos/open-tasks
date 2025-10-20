import { ICardBuilder, IOutputSynk, VerbosityLevel } from "./types";

export class ConsoleOutputBuilder implements IOutputSynk {
  private cards: ICardBuilder[];
  constructor(private verbosity: VerbosityLevel) {
    this.cards = [];
  }

  write(card: ICardBuilder | string, verbosity: VerbosityLevel): void {       
    if (typeof card === 'string') {
      if (this.shouldWrite(verbosity || 'verbose')) { 
        console.log(card);
      }
      return;      
    }

    if (this.shouldWrite(verbosity)) {
      this.cards.push(card);
      // Check if it's a card builder or a plain object
      if (typeof card.build === 'function') {
        console.log(card.build());
      } else {
        // Handle plain object cards from user commands
        console.log(JSON.stringify(card, null, 2));
      }
    }
  }

  private shouldWrite(verbosity: VerbosityLevel): boolean {
    // Verbosity hierarchy:
    // - quiet: Only show cards marked as 'quiet'
    // - summary: Show cards marked as 'summary' or 'quiet'
    // - verbose: Show all cards
    
    if (this.verbosity === 'verbose') {
      return true; // Show all cards
    }
    
    if (this.verbosity === 'summary') {
      return verbosity === 'summary' || verbosity === 'quiet';
    }
    
    if (this.verbosity === 'quiet') {
      return verbosity === 'quiet';
    }
    
    return false;
  }

  build(): string {      
    return this.cards.reduce((acc, card) => {
      return acc + card.build() + '\n';
    }, '');
  }
}
