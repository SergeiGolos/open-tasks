import { ICardBuilder, IOutputBuilder, VerbosityLevel } from "./types";

export class OutputBuilder implements IOutputBuilder {
  private cards: ICardBuilder[];
  constructor(private verbosity: VerbosityLevel) {
    this.cards = [];
  }

  write(card: ICardBuilder, verbosity: VerbosityLevel): void {
    this.cards.push(card);
  }

  build(): string {      
    return this.cards.reduce((acc, card) => {
      return acc + card.build() + '\n';
    }, '');
  }
}
