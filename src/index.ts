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
  const outputDir = path.join(cwd, config.outputDir);

  // Initialize core components
  const router = new CommandRouter();
  const loader = new CommandLoader(router);
  const referenceManager = new ReferenceManager();
  const outputHandler = new OutputHandler(outputDir);
  const workflowContext = new DirectoryOutputContext(outputDir);
  
  // Build paths for built-in and custom commands
  const __filename = fileURLToPath(import.meta.url);
  const commandsDir = path.join(path.dirname(__filename), 'commands');
  
  // Normalize customCommandsDir to array
  const customCommandsDirs = Array.isArray(config.customCommandsDir)
    ? config.customCommandsDir
    : [config.customCommandsDir];
  
  // Load built-in commands (warn if missing, though this shouldn't happen)
  await loader.loadCommandSource(commandsDir, { warnOnMissing: true });
  
  // Load custom commands from all configured directories (don't warn if missing, as they're optional)
  for (const customDir of customCommandsDirs) {
    const customCommandsDir = path.join(cwd, customDir);
    await loader.loadCommandSource(customCommandsDir, { warnOnMissing: false });
  }


  // Add dynamic command handling
  program.action(async () => {
    const commands = router.listCommands();
    
    console.log('Available commands:\n');
    console.log(formatCommandList(commands));
    console.log('\nRun "open-tasks <command> --help" for more information on a command.');
  });

  // Parse arguments manually for custom command routing
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    program.help();
    return;
  }

  if (args[0] === '--version' || args[0] === '-v') {
    console.log(version);
    return;
  }

  const commandName = args[0];
  const commandArgs = args.slice(1);

  // Check for command-specific help
  if (commandArgs.includes('--help') || commandArgs.includes('-h')) {
    const help = router.getCommandHelp(commandName);
    if (help) {
      console.log(formatCommandHelp(help));
      return;
    } else {
      console.error(formatError(`Unknown command: ${commandName}`));
      process.exit(1);
    }
  }

  try {
    // Parse references from arguments
    const refs = new Map<string, ReferenceHandle>();
    const cleanArgs: string[] = [];
    
    // Parse verbosity and output target flags
    let verbosity: 'quiet' | 'summary' | 'verbose' | undefined;    
    let customOutputPath: string | undefined;
    
    let verbosityFlagCount = 0;
    let outputTargetFlagCount = 0;
    
    for (let i = 0; i < commandArgs.length; i++) {
      const arg = commandArgs[i];
      
      if (arg === '--ref' && i + 1 < commandArgs.length) {
        const refToken = commandArgs[i + 1];
        const ref = referenceManager.getReference(refToken);
        if (ref) {
          refs.set(refToken, ref);
        } else {
          console.warn(formatError(`Reference not found: ${refToken}`));
        }
        i++; // Skip the token value
      } else if (arg === '--quiet' || arg === '-q') {
        verbosity = 'quiet';
        verbosityFlagCount++;
      } else if (arg === '--summary' || arg === '-s') {
        verbosity = 'summary';
        verbosityFlagCount++;
      } else if (arg === '--verbose' || arg === '-v') {
        verbosity = 'verbose';
        verbosityFlagCount++;
      } else {
        cleanArgs.push(arg);
      }
    }
    
    // Validate flag usage
    if (verbosityFlagCount > 1) {
      console.error(formatError('Error: Only one verbosity flag (--quiet, --summary, --verbose) can be specified'));
      process.exit(1);
    }
    
    if (outputTargetFlagCount > 1) {
      console.error(formatError('Error: Only one output target flag (--screen-only, --log-only, --both, --file) can be specified'));
      process.exit(1);
    }
      
    // Create execution context
    const context: ExecutionContext = {
      cwd,
      outputDir,
      referenceManager,
      outputHandler,
      workflowContext,
      config,
      verbosity,
      customOutputPath,
    };

    // Execute command
    const result = await router.execute(commandName, cleanArgs, refs, context);

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
        command: commandName,
        args: commandArgs,
        cwd,
      });
    } catch (writeError) {
      console.error('Failed to write error file:', writeError);
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
