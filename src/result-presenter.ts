import { VerbosityLevel, IOutputSynk } from './types.js';
import { formatSuccess, formatReferenceHandle } from './formatters.js';
import { MessageCard } from './cards/MessageCard.js';

/**
 * Handles command execution result presentation and error handling
 */
export class ResultPresenter {
  /**
   * Displays command execution result based on verbosity level
   */
  display(result: any, verbosity?: VerbosityLevel): void {
    // Display result only in quiet mode (other modes show cards with embedded summary)
    if (verbosity === 'quiet') {
      console.log(formatSuccess('Command executed successfully'));
      console.log(formatReferenceHandle(result));

      if (result.content && typeof result.content === 'string') {
        console.log('\nOutput:');
        console.log(result.content);
      }
    }
  }

  /**
   * Handles command execution errors
   */
  async handleError(error: any, outputSynk: IOutputSynk): Promise<void> {
    await outputSynk.write(
      new MessageCard("Error", error.toString(), "error"),
      'quiet'
    );
  }
}
