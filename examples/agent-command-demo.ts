/**
 * Agent Command Demo
 * 
 * This example demonstrates how to use the generic AgentCommand
 * with different agent configurations (Gemini, Claude, Aider, etc.)
 */

import { DirectoryOutputContext } from '../src/directory-output-context.js';
import { 
  SetCommand, 
  ReadCommand,
  AgentCommand,
  GeminiConfigBuilder,
  ClaudeConfigBuilder,
  CopilotConfigBuilder,
  AiderConfigBuilder,
  QwenConfigBuilder,
  LlmConfigBuilder,
} from '../src/commands/index.js';

async function main() {
  const context = new DirectoryOutputContext(process.cwd());

  console.log('=== Agent Command Examples ===\n');

  // Example 1: Using Gemini CLI for code explanation
  console.log('Example 1: Using Gemini CLI to explain code');
  console.log('-------------------------------------------');
  
  const geminiPrompt = await context.run(
    new SetCommand('Explain what this code does in simple terms.')
  );
  
  const codeToExplain = await context.run(
    new SetCommand(`
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
    `)
  );
  
  try {
    const geminiConfig = new GeminiConfigBuilder()
      .withModel('gemini-2.5-pro')
      .withTimeout(30000)
      .enableSearch()
      .build();
    
    const geminiResult = await context.run(
      new AgentCommand(geminiConfig, [geminiPrompt[0], codeToExplain[0]])
    );
    console.log('Gemini Response:', await context.get(geminiResult[0]));
  } catch (error) {
    console.error('Gemini execution failed:', error instanceof Error ? error.message : error);
  }
  
  console.log('\n');

  // Example 2: Using Claude Code for code review
  console.log('Example 2: Using Claude Code for code review');
  console.log('---------------------------------------------');
  
  const claudePrompt = await context.run(
    new SetCommand('Review this code for potential issues and suggest improvements.')
  );
  
  const codeToReview = await context.run(
    new SetCommand(`
async function fetchUserData(userId) {
  const response = await fetch('https://api.example.com/users/' + userId);
  const data = await response.json();
  return data;
}
    `)
  );
  
  try {
    const claudeConfig = new ClaudeConfigBuilder()
      .withModel('claude-3-sonnet')
      .allowingAllTools()
      .withTemperature(0.3)
      .build();
    
    const claudeResult = await context.run(
      new AgentCommand(claudeConfig, [claudePrompt[0], codeToReview[0]])
    );
    console.log('Claude Response:', await context.get(claudeResult[0]));
  } catch (error) {
    console.error('Claude execution failed:', error instanceof Error ? error.message : error);
  }
  
  console.log('\n');

  // Example 3: Using Aider for automated refactoring
  console.log('Example 3: Using Aider to add documentation');
  console.log('--------------------------------------------');
  
  const aiderPrompt = await context.run(
    new SetCommand('Add comprehensive JSDoc comments to all functions.')
  );
  
  try {
    const aiderConfig = new AiderConfigBuilder()
      .withModel('gpt-4')
      .withFiles('src/utils.ts')
      .withAutoCommit('docs: Add JSDoc comments via Aider')
      .build();
    
    const aiderResult = await context.run(
      new AgentCommand(aiderConfig, [aiderPrompt[0]])
    );
    console.log('Aider Response:', await context.get(aiderResult[0]));
  } catch (error) {
    console.error('Aider execution failed:', error instanceof Error ? error.message : error);
  }
  
  console.log('\n');

  // Example 4: Using GitHub Copilot CLI for repository operations
  console.log('Example 4: Using GitHub Copilot CLI');
  console.log('------------------------------------');
  
  const copilotPrompt = await context.run(
    new SetCommand('List all open pull requests in this repository and summarize their changes.')
  );
  
  try {
    const copilotConfig = new CopilotConfigBuilder()
      .withModel('gpt-4')
      .allowingAllTools()
      .build();
    
    const copilotResult = await context.run(
      new AgentCommand(copilotConfig, [copilotPrompt[0]])
    );
    console.log('Copilot Response:', await context.get(copilotResult[0]));
  } catch (error) {
    console.error('Copilot execution failed:', error instanceof Error ? error.message : error);
  }
  
  console.log('\n');

  // Example 5: Using llm for quick queries
  console.log('Example 5: Using llm for quick queries');
  console.log('---------------------------------------');
  
  const llmPrompt = await context.run(
    new SetCommand('What is the time complexity of binary search?')
  );
  
  try {
    const llmConfig = new LlmConfigBuilder()
      .withModel('gpt-4')
      .withTemperature(0.7)
      .build();
    
    const llmResult = await context.run(
      new AgentCommand(llmConfig, [llmPrompt[0]])
    );
    console.log('llm Response:', await context.get(llmResult[0]));
  } catch (error) {
    console.error('llm execution failed:', error instanceof Error ? error.message : error);
  }
  
  console.log('\n');

  // Example 6: Using Qwen Code CLI (free tier)
  console.log('Example 6: Using Qwen Code CLI');
  console.log('-------------------------------');
  
  const qwenPrompt = await context.run(
    new SetCommand('Compare the implementations of error handling in these two approaches.')
  );
  
  const approach1 = await context.run(
    new SetCommand(`
// Approach 1: try-catch
try {
  const data = await fetchData();
  processData(data);
} catch (error) {
  console.error(error);
}
    `)
  );
  
  const approach2 = await context.run(
    new SetCommand(`
// Approach 2: promise chain
fetchData()
  .then(processData)
  .catch(error => console.error(error));
    `)
  );
  
  try {
    const qwenConfig = new QwenConfigBuilder()
      .withModel('qwen3-coder')
      .withPlanningMode()
      .build();
    
    const qwenResult = await context.run(
      new AgentCommand(qwenConfig, [qwenPrompt[0], approach1[0], approach2[0]])
    );
    console.log('Qwen Response:', await context.get(qwenResult[0]));
  } catch (error) {
    console.error('Qwen execution failed:', error instanceof Error ? error.message : error);
  }
  
  console.log('\n');

  // Example 7: Complex multi-step workflow
  console.log('Example 7: Complex workflow combining file reading and agent analysis');
  console.log('----------------------------------------------------------------------');
  
  // Read actual file from the project
  const fileContent = await context.run(
    new ReadCommand('src/types.ts')
  );
  
  const analysisPrompt = await context.run(
    new SetCommand('Analyze this TypeScript file and suggest improvements for type safety and documentation.')
  );
  
  try {
    const analysisConfig = new GeminiConfigBuilder()
      .withModel('gemini-2.5-pro')
      .withTimeout(60000)
      .build();
    
    const analysisResult = await context.run(
      new AgentCommand(analysisConfig, [analysisPrompt[0], fileContent[0]])
    );
    console.log('Analysis Result:', await context.get(analysisResult[0]));
  } catch (error) {
    console.error('Analysis failed:', error instanceof Error ? error.message : error);
  }

  console.log('\n=== Demo Complete ===');
}

// Run the demo
main().catch(console.error);
