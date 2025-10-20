#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { CommandRouter } from './router.js';
import { CommandLoader } from './command-loader.js';
import { loadConfig } from './config-loader.js';
import { formatError, formatCommandList } from './formatters.js';
import { OptionResolver } from './option-resolver.js';
import { ContextBuilder } from './context-builder.js';
import { ResultPresenter } from './result-presenter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version
async function getVersion(): Promise<string> {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const data = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(data);
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

async function main() {
  const version = await getVersion();
  const program = new Command();

  program
    .name('open-tasks')
    .description('CLI tool for executing tasks with explicit workflow context')
    .version(version);

  // Get current working directory
  const cwd = process.cwd();

  // Load configuration
  const config = await loadConfig(cwd);
  
  // Initialize core components
  const router = new CommandRouter();
  const loader = new CommandLoader();
    
  // Build paths for built-in and custom commands
  const __filename = fileURLToPath(import.meta.url);
  const commandsDir = path.join(path.dirname(__filename), 'commands');
  
  // Normalize customCommandsDir to array
  const customCommandsDirs = Array.isArray(config.customCommandsDir)
    ? config.customCommandsDir
    : [config.customCommandsDir];
  
  // Define built-in and custom commands  
  const loaders = [
    { dir: commandsDir, warnOnMissing: true },
    ...customCommandsDirs.map(dir => ({ dir: path.join(cwd, dir), warnOnMissing: false }))
  ];

  // Load and register commands
  for (const { dir: customCommandsDir, warnOnMissing } of loaders) {
    let loadedCommands = await loader.loadCommandSource(customCommandsDir, { warnOnMissing });
    for (const loadedCommand of loadedCommands) {
      router.register(loadedCommand.name, loadedCommand.handler);
    }
  }

  // Define global options that apply to all commands
  program
    .option('-q, --quiet', 'Minimal output (quiet mode)')
    .option('-s, --summary', 'Summary output with cards (default)')
    .option('-v, --verbose', 'Detailed output with progress')
    .option('--ref <token...>', 'Reference token(s) to load')
    .option('--dir <path>', 'Write output to custom directory path');

  // Dynamically register all loaded commands as Commander commands
  const commands = router.listCommands();
  
  // Initialize helper classes
  const optionResolver = new OptionResolver();
  const contextBuilder = new ContextBuilder(cwd, config);
  const resultPresenter = new ResultPresenter();
  
  for (const cmd of commands) {
    const help = router.getCommandHelp(cmd.name);
    const commandInstance = program
      .command(cmd.name)
      .description(cmd.description)
      .allowUnknownOption(true) // Allow command-specific options
      .action(async (...args) => {
        // The last argument is the Command object, everything before is command args
        const commandObj = args[args.length - 1];
        const commandArgs = args.slice(0, -1);
        
        // Get global options from parent (program)
        const globalOpts = commandObj.parent?.opts() || {};
        
        // Resolve options
        const verbosity = optionResolver.resolveVerbosity(globalOpts);
        const outputDir = optionResolver.resolveOutputDir(cwd, globalOpts, config);
        
        // Build execution context
        const context = contextBuilder.build(outputDir, verbosity);
        
        try {
          // Get remaining arguments (Commander puts them in commandArgs)
          const remainingArgs = commandObj.args || [];
          
          // Execute command
          const result = await router.execute(cmd.name, remainingArgs, context);

          // Display result
          resultPresenter.display(result, verbosity);
        } catch (error: any) {
          // Handle error
          await resultPresenter.handleError(error, context.outputSynk);
          process.exit(1);
        }
      });    // Add examples to help if available
    if (help && help.examples.length > 0) {
      commandInstance.addHelpText('after', '\nExamples:\n' + help.examples.map(ex => `  ${ex}`).join('\n'));
    }
  }

  // Default action when no command is specified
  program.action(() => {
    console.log('Available commands:\n');
    console.log(formatCommandList(commands));
    console.log('\nRun "open-tasks <command> --help" for more information on a command.');
  });

  // Parse command line arguments
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
