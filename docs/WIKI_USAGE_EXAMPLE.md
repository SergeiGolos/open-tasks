/**
 * Example: How to reference wiki files from ICommand implementations
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get path to wiki file from any command
 */
function getWikiFilePath(filename: string): string {
  // Get current module directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Wiki files are in dist/wiki/
  return path.join(__dirname, 'wiki', filename);
}

/**
 * Example: Use wiki content in a command prompt
 */
async function buildPromptWithWikiContext(userPrompt: string): Promise<string> {
  // Read wiki documentation
  const coreCommandsPath = getWikiFilePath('Core-Commands.md');
  const coreCommandsDoc = await readFile(coreCommandsPath, 'utf-8');
  
  // Build enhanced prompt with wiki context
  const enhancedPrompt = `
${userPrompt}

# Available Commands Reference
${coreCommandsDoc}

Please use the above reference to help answer the user's question.
`;
  
  return enhancedPrompt;
}

/**
 * Example: Load multiple wiki files for comprehensive context
 */
async function buildComprehensiveContext(): Promise<string> {
  const wikiFiles = [
    'Core-Commands.md',
    'Core-Tasks.md',
    'Building-Custom-Commands.md',
  ];
  
  const contents = await Promise.all(
    wikiFiles.map(async (file) => {
      const filePath = getWikiFilePath(file);
      const content = await readFile(filePath, 'utf-8');
      return `## ${file}\n\n${content}`;
    })
  );
  
  return contents.join('\n\n---\n\n');
}

export { getWikiFilePath, buildPromptWithWikiContext, buildComprehensiveContext };
