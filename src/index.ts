#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { CommandRouter } from './router.js';
import { CommandLoader } from './command-loader.js';
import {
  ReferenceManager,
  OutputHandler,
  ExecutionContext,
  ReferenceHandle,
} from './types.js';
import { DirectoryOutputContext } from './workflow/index.js';
import { loadConfig } from './config-loader.js';
import {
  formatSuccess,
  formatError,
  formatReferenceHandle,
  formatCommandList,
  formatCommandHelp,
} from './formatters.js';

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
  const referenceManager = new ReferenceManager();
  
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
        
        // Determine output directory (--dir overrides config)
        const outputDir = globalOpts.dir 
          ? path.resolve(cwd, globalOpts.dir)
          : path.join(cwd, config.outputDir);
        const outputHandler = new OutputHandler(outputDir);
        const workflowContext = new DirectoryOutputContext(outputDir);
        
        try {
          // Resolve verbosity (mutual exclusivity handled by checking multiple flags)
          let verbosity: 'quiet' | 'summary' | 'verbose' | undefined;
          const verbosityFlags = [globalOpts.quiet, globalOpts.summary, globalOpts.verbose].filter(Boolean);
          
          if (verbosityFlags.length > 1) {
            console.error(formatError('Error: Only one verbosity flag (--quiet, --summary, --verbose) can be specified'));
            process.exit(1);
          }
          
          if (globalOpts.quiet) verbosity = 'quiet';
          else if (globalOpts.summary) verbosity = 'summary';
          else if (globalOpts.verbose) verbosity = 'verbose';
          
          // Parse references from --ref option
          const refs = new Map<string, ReferenceHandle>();
          if (globalOpts.ref) {
            const refTokens = Array.isArray(globalOpts.ref) ? globalOpts.ref : [globalOpts.ref];
            for (const refToken of refTokens) {
              const ref = referenceManager.getReference(refToken);
              if (ref) {
                refs.set(refToken, ref);
              } else {
                console.warn(formatError(`Reference not found: ${refToken}`));
              }
            }
          }
          
          // Create execution context
          const context: ExecutionContext = {
            cwd,
            outputDir,
            referenceManager,
            outputHandler,
            workflowContext,
            config,
            verbosity            
          };

          // Get remaining arguments (Commander puts them in commandArgs)
          const remainingArgs = commandObj.args || [];
          
          // Execute command
          const result = await router.execute(cmd.name, remainingArgs, refs, context);

          // Display result only in quiet mode (other modes show cards with embedded summary)
          if (verbosity === 'quiet') {
            console.log(formatSuccess('Command executed successfully'));
            console.log(formatReferenceHandle(result));

            if (result.content && typeof result.content === 'string') {
              console.log('\nOutput:');
              console.log(result.content);
            }
          }
        } catch (error) {
          const err = error as Error;
          console.error(formatError(err.message));

          // Write error file
          try {
            await outputHandler.writeError(err, {
              command: cmd.name,
              args: commandArgs,
              cwd,
            });
          } catch (writeError) {
            console.error('Failed to write error file:', writeError);
          }

          process.exit(1);
        }
      });
    
    // Add examples to help if available
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
