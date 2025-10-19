# IOutputBuilder: Practical Examples

This guide provides real-world examples of using the `IOutputBuilder` system in command implementations.

---

## Example 1: Simple Command with Progress

A command that performs multiple steps and reports progress.

```typescript
export default class ProcessCommand extends CommandHandler {
  name = 'process';
  description = 'Process data files';
  examples = ['open-tasks process input.txt'];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    if (args.length === 0) {
      throw new Error('Process command requires an input file');
    }

    const inputFile = args[0];
    const builder = this.createOutputBuilder(context);

    // Step 1: Read file
    builder.addProgress('Reading input file...');
    const content = await fs.readFile(inputFile, 'utf-8');

    // Step 2: Parse data
    builder.addProgress('Parsing data...');
    const data = JSON.parse(content);

    // Step 3: Process
    builder.addProgress('Processing records...');
    const results = data.map(item => transformItem(item));

    // Step 4: Save
    builder.addProgress('Saving results...');
    const outputFile = await context.outputHandler.writeOutput(
      JSON.stringify(results, null, 2),
      'processed.json'
    );

    const ref = context.referenceManager.createReference(
      'process-result',
      results,
      'processed',
      outputFile
    );

    return ref;
  }
}
```

**Output in different modes:**

**Quiet:**
```
✓ process completed in 250ms
```

**Summary:**
```
✓ process completed in 250ms
📁 Saved to: .open-tasks/outputs/processed.json
🔗 Reference: @processed
```

**Verbose:**
```
(Progress messages are buffered/ignored by VerboseOutputBuilder,
 but command can manually output them if desired)

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: process
⏱️  Duration: 250ms
📁 Output File: .open-tasks/outputs/processed.json
🔗 Reference Token: @processed
```

---

## Example 2: Command with Verbose Details

A command that adds detailed information in verbose mode.

```typescript
export default class AnalyzeCommand extends CommandHandler {
  name = 'analyze';
  description = 'Analyze code files';
  examples = ['open-tasks analyze src/'];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const directory = args[0] || '.';
    const builder = this.createOutputBuilder(context);

    // Analyze files
    builder.addProgress('Scanning directory...');
    const files = await findAllFiles(directory);

    builder.addProgress('Analyzing files...');
    const analysis = await analyzeFiles(files);

    // Verbose mode: Add detailed sections
    if (context.verbosity === 'verbose') {
      // File statistics
      builder.addSection('📁 File Statistics', `
        Total Files: ${files.length}
        TypeScript: ${analysis.stats.ts}
        JavaScript: ${analysis.stats.js}
        Total Lines: ${analysis.stats.totalLines}
        Total Size: ${formatFileSize(analysis.stats.totalBytes)}
      `.trim());

      // Complexity metrics
      builder.addSection('📊 Complexity Analysis', JSON.stringify({
        'Average Complexity': analysis.avgComplexity.toFixed(2),
        'Max Complexity': analysis.maxComplexity,
        'Most Complex File': analysis.mostComplexFile,
      }, null, 2));

      // Issues found
      if (analysis.issues.length > 0) {
        const issueList = analysis.issues
          .slice(0, 10) // Limit to first 10
          .map((issue, idx) => `${idx + 1}. ${issue.file}: ${issue.message}`)
          .join('\n');
        
        builder.addSection('⚠️  Issues Found', issueList);
      }
    }

    // Save summary report
    const report = generateReport(analysis);
    const outputFile = await context.outputHandler.writeOutput(
      report,
      'analysis-report.txt'
    );

    const ref = context.referenceManager.createReference(
      'analysis-result',
      analysis,
      'analysis',
      outputFile
    );

    return ref;
  }
}
```

**Quiet mode:**
```
✓ analyze completed in 1523ms
```

**Summary mode:**
```
✓ analyze completed in 1523ms
📁 Saved to: .open-tasks/outputs/analysis-report.txt
🔗 Reference: @analysis
```

**Verbose mode:**
```

📁 File Statistics
────────────────────────────────────────
Total Files: 42
TypeScript: 38
JavaScript: 4
Total Lines: 5,234
Total Size: 156.78 KB

📊 Complexity Analysis
────────────────────────────────────────
{
  "Average Complexity": "4.32",
  "Max Complexity": 12,
  "Most Complex File": "src/parser.ts"
}

⚠️  Issues Found
────────────────────────────────────────
1. src/utils.ts: Function 'processData' exceeds complexity threshold
2. src/parser.ts: Function 'parseExpression' has 8 parameters
3. src/validator.ts: Unused variable 'result'
...

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: analyze
⏱️  Duration: 1523ms
📁 Output File: .open-tasks/outputs/analysis-report.txt
🔗 Reference Token: @analysis
```

---

## Example 3: Progressive Output for Long Operations

A command that outputs progress in real-time during verbose mode.

```typescript
export default class DownloadCommand extends CommandHandler {
  name = 'download';
  description = 'Download files from URLs';
  examples = ['open-tasks download https://example.com/file.zip'];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const url = args[0];
    const builder = this.createOutputBuilder(context);

    // Start download
    const startTime = Date.now();
    let downloadedBytes = 0;
    let totalBytes = 0;

    builder.addProgress('Starting download...');

    const response = await fetch(url);
    totalBytes = parseInt(response.headers.get('content-length') || '0');

    const outputPath = './downloaded-file';
    const fileStream = fs.createWriteStream(outputPath);

    // Process chunks with progress reporting
    for await (const chunk of response.body) {
      downloadedBytes += chunk.length;
      fileStream.write(chunk);

      // In verbose mode, output progress in real-time
      if (context.verbosity === 'verbose') {
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
        const elapsed = Date.now() - startTime;
        const speed = (downloadedBytes / 1024 / (elapsed / 1000)).toFixed(2);
        
        // Clear line and print progress (no newline)
        process.stdout.write(
          `\r⏳ Downloaded: ${formatFileSize(downloadedBytes)} / ` +
          `${formatFileSize(totalBytes)} (${percent}%) - ${speed} KB/s`
        );
      }

      // Also add to builder (buffered)
      builder.addProgress(
        `Downloaded: ${formatFileSize(downloadedBytes)} / ${formatFileSize(totalBytes)}`
      );
    }

    fileStream.end();

    // Newline after progress bar
    if (context.verbosity === 'verbose') {
      console.log(''); // Move to next line
    }

    builder.addProgress('Download complete!');

    // Verbose details
    if (context.verbosity === 'verbose') {
      addProcessingDetails(builder, {
        'URL': url,
        'Total Size': formatFileSize(totalBytes),
        'Download Time': `${Date.now() - startTime}ms`,
        'Average Speed': `${(totalBytes / 1024 / ((Date.now() - startTime) / 1000)).toFixed(2)} KB/s`,
        'Output File': outputPath,
      });
    }

    const ref = context.referenceManager.createReference(
      'download-result',
      { url, size: totalBytes, path: outputPath },
      'downloaded',
      outputPath
    );

    return ref;
  }
}
```

**Verbose mode output (real-time):**
```
⏳ Downloaded: 1.23 MB / 5.67 MB (21.7%) - 512.34 KB/s
(this line updates in place as download progresses)

⚙️  Processing Details
────────────────────────────────────────
{
  "URL": "https://example.com/file.zip",
  "Total Size": "5.67 MB",
  "Download Time": "11234ms",
  "Average Speed": "516.78 KB/s",
  "Output File": "./downloaded-file"
}

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: download
⏱️  Duration: 11234ms
📁 Output File: ./downloaded-file
🔗 Reference Token: @downloaded
```

---

## Example 4: Error Handling with Context

A command that provides detailed error information in verbose mode.

```typescript
export default class ValidateCommand extends CommandHandler {
  name = 'validate';
  description = 'Validate configuration files';
  examples = ['open-tasks validate config.json'];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const configFile = args[0];
    const builder = this.createOutputBuilder(context);

    try {
      builder.addProgress('Reading configuration file...');
      const content = await fs.readFile(configFile, 'utf-8');

      builder.addProgress('Parsing JSON...');
      const config = JSON.parse(content);

      builder.addProgress('Validating schema...');
      const errors = validateSchema(config);

      if (errors.length > 0) {
        // Build error context
        const errorContext = {
          file: configFile,
          errorCount: errors.length,
          errors: errors.map(e => ({
            field: e.field,
            message: e.message,
            value: e.value,
          })),
        };

        // In verbose mode, add detailed error section
        if (context.verbosity === 'verbose') {
          builder.addSection('❌ Validation Errors', 
            errors.map((e, idx) => 
              `${idx + 1}. Field '${e.field}': ${e.message} (got: ${e.value})`
            ).join('\n')
          );
        }

        throw new Error(`Validation failed with ${errors.length} errors`);
      }

      builder.addProgress('Validation passed!');

      // Success details in verbose mode
      if (context.verbosity === 'verbose') {
        builder.addSection('✅ Validation Results', `
          Configuration is valid!
          
          Checked Fields: ${Object.keys(config).length}
          Schema Version: ${config.schemaVersion || 'default'}
          Environment: ${config.environment || 'production'}
        `.trim());
      }

      const ref = context.referenceManager.createReference(
        'validation-result',
        { valid: true, config },
        'validated'
      );

      return ref;

    } catch (error) {
      // CommandHandler.handleError() will add this to the builder
      // In verbose mode, full stack trace and context will be shown
      builder.addError(error as Error, {
        configFile,
        stage: 'validation',
      });
      
      throw error; // Re-throw for CommandHandler to handle
    }
  }
}
```

**Error in quiet mode:**
```
✗ validate completed in 45ms
(Error also thrown, exits with error code)
```

**Error in verbose mode:**
```

❌ Validation Errors
────────────────────────────────────────
1. Field 'apiKey': Required field is missing (got: undefined)
2. Field 'timeout': Must be a positive number (got: -5)
3. Field 'endpoints': Must be an array (got: string)

❌ Error Details
────────────────────────────────────────
Error: Validation failed with 3 errors

Stack Trace:
  at ValidateCommand.executeCommand (/path/to/command.ts:42:15)
  at CommandHandler.execute (/path/to/types.ts:256:31)
  ...

Context:
{
  "configFile": "config.json",
  "stage": "validation",
  "command": "validate",
  "executionTime": 45
}

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✗ Command: validate
⏱️  Duration: 45ms
```

---

## Example 5: Using Helper Utilities

A command that leverages the helper utilities for cleaner code.

```typescript
import { 
  addProcessingDetails, 
  addFileInfoSection,
  formatFileSize 
} from '../output-utils.js';

export default class ConvertCommand extends CommandHandler {
  name = 'convert';
  description = 'Convert files between formats';
  examples = ['open-tasks convert input.csv --format json'];

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const inputFile = args[0];
    const format = args.find((arg, i) => args[i - 1] === '--format') || 'json';
    const builder = this.createOutputBuilder(context);

    // Read input
    builder.addProgress('Reading input file...');
    const inputContent = await fs.readFile(inputFile, 'utf-8');
    const inputStats = await fs.stat(inputFile);

    // Parse CSV
    builder.addProgress('Parsing CSV...');
    const records = parseCSV(inputContent);

    // Convert to target format
    builder.addProgress(`Converting to ${format}...`);
    const converted = convertToFormat(records, format);

    // Write output
    const outputFile = `${path.parse(inputFile).name}.${format}`;
    const outputPath = await context.outputHandler.writeOutput(
      converted,
      outputFile
    );
    const outputStats = await fs.stat(outputPath);

    builder.addProgress('Conversion complete!');

    // Verbose details using helper utilities
    if (context.verbosity === 'verbose') {
      // Processing details
      addProcessingDetails(builder, {
        'Input Format': 'CSV',
        'Output Format': format.toUpperCase(),
        'Records Processed': records.length,
        'Conversion Time': Date.now() - startTime,
      });

      // Input file info
      addFileInfoSection(builder, inputFile, inputStats.size, 'text/csv');

      // Output file info  
      addFileInfoSection(builder, outputPath, outputStats.size, getMimeType(format));

      // Size comparison
      const ratio = ((outputStats.size / inputStats.size) * 100).toFixed(1);
      builder.addSection('📊 Size Comparison', `
        Input:  ${formatFileSize(inputStats.size)}
        Output: ${formatFileSize(outputStats.size)}
        Ratio:  ${ratio}% of original size
      `.trim());
    }

    const ref = context.referenceManager.createReference(
      'convert-result',
      { records, format },
      'converted',
      outputPath
    );

    return ref;
  }
}
```

**Verbose mode output:**
```

⚙️  Processing Details
────────────────────────────────────────
{
  "Input Format": "CSV",
  "Output Format": "JSON",
  "Records Processed": 1523,
  "Conversion Time": 342
}

📄 File Information
────────────────────────────────────────
{
  "path": "data.csv",
  "size": "156234 bytes",
  "sizeFormatted": "152.57 KB",
  "type": "text/csv"
}

📄 File Information
────────────────────────────────────────
{
  "path": ".open-tasks/outputs/data.json",
  "size": "234567 bytes",
  "sizeFormatted": "229.07 KB",
  "type": "application/json"
}

📊 Size Comparison
────────────────────────────────────────
Input:  152.57 KB
Output: 229.07 KB
Ratio:  150.1% of original size

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: convert
⏱️  Duration: 342ms
📁 Output File: .open-tasks/outputs/data.json
🔗 Reference Token: @converted
```

---

## Example 6: Command with Default Verbosity

Some commands are inherently detailed and should default to verbose mode.

```typescript
export default class DiagnosticsCommand extends CommandHandler {
  name = 'diagnostics';
  description = 'Run system diagnostics';
  examples = ['open-tasks diagnostics'];

  // This command defaults to verbose mode
  protected defaultVerbosity: VerbosityLevel = 'verbose';

  protected async executeCommand(
    args: string[],
    refs: Map<string, ReferenceHandle>,
    context: ExecutionContext
  ): Promise<ReferenceHandle> {
    const builder = this.createOutputBuilder(context);

    // Check Node.js version
    builder.addProgress('Checking Node.js version...');
    const nodeVersion = process.version;
    builder.addSection('🟢 Node.js', `Version: ${nodeVersion}`);

    // Check npm
    builder.addProgress('Checking npm...');
    const npmVersion = await execCommand('npm --version');
    builder.addSection('📦 npm', `Version: ${npmVersion.trim()}`);

    // Check disk space
    builder.addProgress('Checking disk space...');
    const diskSpace = await checkDiskSpace();
    builder.addSection('💾 Disk Space', `
      Total: ${formatFileSize(diskSpace.total)}
      Used: ${formatFileSize(diskSpace.used)}
      Free: ${formatFileSize(diskSpace.free)}
      Usage: ${((diskSpace.used / diskSpace.total) * 100).toFixed(1)}%
    `.trim());

    // Check project structure
    builder.addProgress('Checking project structure...');
    const projectChecks = await checkProjectStructure();
    builder.addSection('📁 Project Structure', projectChecks.join('\n'));

    const diagnostics = {
      nodeVersion,
      npmVersion,
      diskSpace,
      projectChecks,
    };

    const ref = context.referenceManager.createReference(
      'diagnostics-result',
      diagnostics,
      'diagnostics'
    );

    return ref;
  }
}
```

**When user runs: `open-tasks diagnostics`**
- Uses **verbose** mode by default (command's `defaultVerbosity`)
- Shows all sections automatically

**When user runs: `open-tasks diagnostics --quiet`**
- CLI flag **overrides** command default
- Uses **quiet** mode (minimal output)

---

## Best Practices Summary

### ✅ DO:

1. **Always use `builder.addProgress()`** for step indicators
2. **Use `builder.addSection()`** for verbose details
3. **Check `context.verbosity`** only when you need custom behavior
4. **Use helper utilities** (`addProcessingDetails`, etc.)
5. **Let the framework handle summary** (automatic via `CommandHandler`)
6. **Provide meaningful section titles** (with emojis for visual clarity)
7. **Format data consistently** (use JSON for objects, plain text for simple values)

### ❌ DON'T:

1. **Don't use `console.log()`** directly (breaks verbosity control)
   - Exception: Real-time progress in verbose mode
2. **Don't duplicate summary info** (framework handles it)
3. **Don't output in quiet/summary modes** (builder ignores it anyway)
4. **Don't add too many sections** (keep it focused and relevant)
5. **Don't assume verbosity level** (use the builder API)

### 💡 Tips:

- **Progress messages**: Describe what's **about to happen** or **just happened**
- **Sections**: Group related information under clear headings
- **Verbose checks**: Only when you need expensive computations for verbose output
- **Error context**: Always provide context when throwing errors
- **Real-time output**: Only in verbose mode, and sparingly

---

## Testing Your Command Output

Test all three verbosity levels:

```bash
# Test quiet mode
open-tasks mycommand --quiet

# Test summary mode (default)
open-tasks mycommand
open-tasks mycommand --summary

# Test verbose mode
open-tasks mycommand --verbose
```

**What to verify:**

- **Quiet**: Single line, essential info only
- **Summary**: Clean, formatted, shows file and token
- **Verbose**: All sections visible, detailed information

---

## See Also

- [IOutputBuilder Architecture Guide](./IOutputBuilder-Architecture.md)
- [Flow Diagrams](./IOutputBuilder-Flow-Diagrams.md)
- [Output Control API Reference](./Output-Control-API.md)
