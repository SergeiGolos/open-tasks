import * as readline from 'readline';
import { ICommand, IFlow, StringRef, ICardBuilder, IRefDecorator } from '../types.js';

/**
 * QuestionCommand - Prompts user for input and stores the response
 * 
 * This command displays a message (either directly or from a StringRef) and
 * reads a line from the command prompt, storing the response.
 * 
 * Usage in workflow:
 *   // Direct message
 *   const response = await flow.run(new QuestionCommand('What is your name?'));
 *   
 *   // From StringRef
 *   const promptRef = await flow.run(new SetCommand('Enter your email:'));
 *   const email = await flow.run(new QuestionCommand(promptRef[0]));
 */
export class QuestionCommand implements ICommand {
  private prompt: string | StringRef;

  /**
   * Create a new QuestionCommand
   * @param prompt - Either a message string or a StringRef containing the prompt
   */
  constructor(prompt: string | StringRef) {
    this.prompt = prompt;
  }

  async execute(
    context: IFlow,
    args: any[],
    cardBuilder?: ICardBuilder
  ): Promise<[any, IRefDecorator[]][]> {
    let promptMessage: string;

    // Determine if prompt is a string or StringRef
    if (typeof this.prompt === 'string') {
      promptMessage = this.prompt;
    } else {
      // Get from StringRef
      const content = await context.get(this.prompt);
      if (content === undefined) {
        throw new Error(`Prompt reference not found: ${this.prompt.token || this.prompt.id}`);
      }
      promptMessage = content;
    }

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Prompt user and read response
    const answer = await new Promise<string>((resolve) => {
      rl.question(promptMessage + ' ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    // Return the user's response
    return [[answer, []]];
  }
}
