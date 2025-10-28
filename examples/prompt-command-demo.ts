/**
 * Demo: Using PromptCommand to execute GitHub Copilot prompts
 * 
 * This example shows how to use the PromptCommand to load and execute
 * prompts from `.github/prompts/*.prompt.md` files using the default LLM CLI.
 */

import { DirectoryOutputContext } from '../src/directory-output-context.js';
import { PromptCommand } from '../src/commands/prompt.js';

async function demoPromptCommand() {
  console.log('=== PromptCommand Demo ===\n');

  // Create a workflow context
  const context = new DirectoryOutputContext(process.cwd(), '.output');

  try {
    // Example 1: Execute openspec-proposal prompt with arguments
    console.log('Example 1: Execute openspec-proposal with arguments');
    console.log('---');
    
    const promptWithArgs = new PromptCommand(
      'openspec-proposal',
      'Add user authentication with OAuth2 support'
    );
    
    const result1 = await context.run(promptWithArgs);
    const output1 = await context.get(result1[0]);
    
    console.log('Prompt executed successfully!');
    console.log('Result preview:', output1?.substring(0, 200) + '...\n');

    // Example 2: Execute prompt without arguments
    console.log('Example 2: Execute openspec-apply without arguments');
    console.log('---');
    
    const promptNoArgs = new PromptCommand('openspec-apply');
    
    const result2 = await context.run(promptNoArgs);
    const output2 = await context.get(result2[0]);
    
    console.log('Prompt executed successfully!');
    console.log('Result preview:', output2?.substring(0, 200) + '...\n');

    // Example 3: Execute prompt with custom LLM options
    console.log('Example 3: Execute prompt with custom model and temperature');
    console.log('---');
    
    const promptWithOptions = new PromptCommand(
      'openspec-proposal',
      'Implement real-time notifications',
      {
        model: 'gpt-4',
        temperature: 0.7,
        system: 'You are an expert software architect.'
      }
    );
    
    const result3 = await context.run(promptWithOptions);
    const output3 = await context.get(result3[0]);
    
    console.log('Prompt executed with custom options!');
    console.log('Result preview:', output3?.substring(0, 200) + '...\n');

    // Example 4: List available prompts
    console.log('Example 4: Discovering available prompts');
    console.log('---');
    console.log('To see available prompts, check:');
    console.log('  .github/prompts/*.prompt.md');
    console.log('\nCurrent prompts in this repository:');
    console.log('  - openspec-proposal.prompt.md');
    console.log('  - openspec-apply.prompt.md');
    console.log('  - openspec-archive.prompt.md');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demoPromptCommand().catch(console.error);
}

export { demoPromptCommand };
