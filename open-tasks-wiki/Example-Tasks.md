# Example Tasks

This page demonstrates real-world workflows using Open Tasks CLI to accomplish common development and automation tasks.

**Important:** All examples on this page show complete custom task implementations. Built-in commands like `load`, `powershell`, and `ai-cli` cannot be run directly from the command line unless wrapped in a custom task handler.

## Code Review Workflow

Automatically review code changes using AI with structured context.

### Basic Code Review

Review a single file for best practices:

**Step 1: Create the custom task** (`.open-tasks/tasks/code-review.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class CodeReviewTask extends TaskHandler {
  name = 'code-review';
  description = 'Review a source code file for best practices';
  examples = [
    'open-tasks code-review ./src/api.ts',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const filePath = args[0];
    if (!filePath) {
      throw new Error('File path required');
    }

    // Load the source code
    synk.write('Loading source file...');
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(flow.cwd, filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    const sourceRef = await flow.set(content, []);

    // Here you would integrate with AI service to review the code
    // For demonstration, we'll create a placeholder review
    synk.write('Requesting AI review...');
    const review = `Code Review for ${path.basename(filePath)}:\n\n` +
      `- File appears well-structured\n` +
      `- Consider adding more comments\n` +
      `- Review security implications`;
    
    const reviewRef = await flow.set(review, []);

    synk.write(
      new MessageCard(
        '✓ Review Complete',
        `Reviewed ${path.basename(filePath)}\nSee output for details`,
        'success'
      )
    );

    return {
      id: reviewRef.id,
      content: review,
      token: 'review',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks code-review ./src/api.ts
```

### Multi-File Code Review

Review multiple related files together:

**Step 1: Create the custom task** (`.open-tasks/tasks/multi-file-review.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, ListCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class MultiFileReviewTask extends TaskHandler {
  name = 'multi-file-review';
  description = 'Review multiple related files together';
  examples = [
    'open-tasks multi-file-review ./src/api.ts ./src/types.ts ./src/utils.ts',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    if (args.length < 2) {
      throw new Error('At least 2 files required');
    }

    synk.write(`Loading ${args.length} files...`);
    
    const fileContents: string[] = [];
    const fileNames: string[] = [];
    
    // Load all related files
    for (const filePath of args) {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(flow.cwd, filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      await flow.set(content, []);
      fileContents.push(content);
      fileNames.push(path.basename(filePath));
    }

    synk.write(
      new ListCard(
        'Files Loaded',
        fileNames,
        'success'
      )
    );

    // Combine all content for review
    synk.write('Analyzing files...');
    const combined = fileContents.join('\n\n--- FILE SEPARATOR ---\n\n');
    
    // Here you would integrate with AI to review the combined content
    const review = `Multi-File Review:\n\n` +
      `- Analyzed ${fileNames.length} files\n` +
      `- Files appear to work together well\n` +
      `- Consider reviewing integration points`;
    
    const reviewRef = await flow.set(review, []);

    synk.write(
      new MessageCard(
        '✓ Review Complete',
        `Reviewed ${fileNames.length} files`,
        'success'
      )
    );

    return {
      id: reviewRef.id,
      content: review,
      token: 'review',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks multi-file-review ./src/api.ts ./src/types.ts ./src/utils.ts
```

### Extract and Review Specific Functions

Review only specific functions from a large file:

**Step 1: Create the custom task** (`.open-tasks/tasks/extract-review-functions.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class ExtractReviewFunctionsTask extends TaskHandler {
  name = 'extract-review-functions';
  description = 'Extract and review functions from a source file';
  examples = [
    'open-tasks extract-review-functions ./src/large-file.ts',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const filePath = args[0];
    if (!filePath) {
      throw new Error('File path required');
    }

    // Load the source file
    synk.write('Loading source file...');
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(flow.cwd, filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    const sourceRef = await flow.set(content, []);

    // Extract function definitions using regex
    synk.write('Extracting functions...');
    const functionPattern = /export function ([a-zA-Z]+)\([^)]*\)[^{]*\{[^}]+\}/g;
    const functions = content.match(functionPattern) || [];
    const functionsText = functions.join('\n\n');
    const functionsRef = await flow.set(functionsText, []);

    // Review the extracted functions
    synk.write('Reviewing functions...');
    const review = `Function Review:\n\n` +
      `- Found ${functions.length} exported functions\n` +
      `- Functions extracted for focused review\n` +
      `- Review signatures and implementations for correctness`;
    
    const reviewRef = await flow.set(review, []);

    synk.write(
      new MessageCard(
        '✓ Functions Reviewed',
        `Extracted and reviewed ${functions.length} functions`,
        'success'
      )
    );

    return {
      id: reviewRef.id,
      content: review,
      token: 'function-review',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks extract-review-functions ./src/large-file.ts
```

### Review with Context from Documentation

Review code against its documentation:

**Step 1: Create the custom task** (`.open-tasks/tasks/review-with-spec.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class ReviewWithSpecTask extends TaskHandler {
  name = 'review-with-spec';
  description = 'Review implementation against specification';
  examples = [
    'open-tasks review-with-spec ./src/authentication.ts ./docs/auth-spec.md',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    if (args.length < 2) {
      throw new Error('Implementation file and spec file required');
    }

    const implPath = args[0];
    const specPath = args[1];

    // Load the implementation
    synk.write('Loading implementation...');
    const implAbsPath = path.isAbsolute(implPath)
      ? implPath
      : path.join(flow.cwd, implPath);
    const implContent = await fs.readFile(implAbsPath, 'utf-8');
    const implRef = await flow.set(implContent, []);

    // Load the documentation
    synk.write('Loading specification...');
    const specAbsPath = path.isAbsolute(specPath)
      ? specPath
      : path.join(flow.cwd, specPath);
    const specContent = await fs.readFile(specAbsPath, 'utf-8');
    const specRef = await flow.set(specContent, []);

    // Review implementation against spec
    synk.write('Comparing implementation to specification...');
    const review = `Compliance Review:\n\n` +
      `Implementation: ${path.basename(implPath)}\n` +
      `Specification: ${path.basename(specPath)}\n\n` +
      `- Implementation loaded successfully\n` +
      `- Specification loaded successfully\n` +
      `- Review for deviations and missing features`;
    
    const reviewRef = await flow.set(review, []);

    synk.write(
      new MessageCard(
        '✓ Compliance Review Complete',
        'Implementation reviewed against specification',
        'success'
      )
    );

    return {
      id: reviewRef.id,
      content: review,
      token: 'compliance-review',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks review-with-spec ./src/authentication.ts ./docs/auth-spec.md
```

### Review Git Diff

Review changes in a git diff:

**Step 1: Create the custom task** (`.open-tasks/tasks/review-git-diff.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard } from 'open-tasks-cli';
import { spawn } from 'child_process';

export default class ReviewGitDiffTask extends TaskHandler {
  name = 'review-git-diff';
  description = 'Review changes in a git diff';
  examples = [
    'open-tasks review-git-diff',
    'open-tasks review-git-diff HEAD~1',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const commit = args[0] || 'HEAD~1';

    synk.write('Getting git diff...');
    
    // Execute git diff command
    const diff = await this.executeGit(`git diff ${commit} HEAD -- src/`);
    const diffRef = await flow.set(diff, []);

    // Review the changes
    synk.write('Analyzing changes...');
    const lines = diff.split('\n').length;
    const review = `Git Diff Review:\n\n` +
      `Comparing: ${commit}...HEAD\n` +
      `Lines changed: ${lines}\n\n` +
      `- Review the impact of changes\n` +
      `- Check for potential issues\n` +
      `- Ensure changes align with requirements`;
    
    const reviewRef = await flow.set(review, []);

    synk.write(
      new MessageCard(
        '✓ Diff Review Complete',
        `Analyzed ${lines} lines of changes`,
        'success'
      )
    );

    return {
      id: reviewRef.id,
      content: review,
      token: 'diff-review',
      timestamp: new Date(),
    };
  }

  private async executeGit(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args);
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Git command failed: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks review-git-diff
# Or specify a commit
open-tasks review-git-diff HEAD~5
```

---

## News Summary Workflow

Aggregate and summarize news from multiple sources.

### Fetch and Summarize News

Fetch news from an API and create a summary:

**Step 1: Create the custom task** (`.open-tasks/tasks/news-summary.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, ListCard } from 'open-tasks-cli';
import { spawn } from 'child_process';

export default class NewsSummaryTask extends TaskHandler {
  name = 'news-summary';
  description = 'Fetch and summarize news from an API';
  examples = [
    'open-tasks news-summary',
    'open-tasks news-summary --api-key YOUR_API_KEY',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const apiKeyIndex = args.indexOf('--api-key');
    const apiKey = apiKeyIndex !== -1 ? args[apiKeyIndex + 1] : 'YOUR_API_KEY';

    // Fetch news from API using PowerShell/curl
    synk.write('Fetching news from API...');
    const newsData = await this.executePowerShell(
      `Invoke-RestMethod 'https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}'`
    );
    const newsRef = await flow.set(newsData, []);

    // Extract headlines
    synk.write('Extracting headlines...');
    const headlines = this.extractHeadlines(newsData);
    const headlinesText = headlines.join('\n');
    const headlinesRef = await flow.set(headlinesText, []);

    synk.write(
      new ListCard(
        'Headlines Found',
        headlines.slice(0, 5),
        'info'
      )
    );

    // Create summary
    synk.write('Creating summary...');
    const summary = `News Summary:\n\n` +
      `Total headlines: ${headlines.length}\n\n` +
      `Top 3 key points:\n` +
      `1. ${headlines[0] || 'N/A'}\n` +
      `2. ${headlines[1] || 'N/A'}\n` +
      `3. ${headlines[2] || 'N/A'}`;
    
    const summaryRef = await flow.set(summary, []);

    synk.write(
      new MessageCard(
        '✓ Summary Complete',
        `Summarized ${headlines.length} headlines`,
        'success'
      )
    );

    return {
      id: summaryRef.id,
      content: summary,
      token: 'summary',
      timestamp: new Date(),
    };
  }

  private extractHeadlines(jsonData: string): string[] {
    try {
      const data = JSON.parse(jsonData);
      return data.articles?.map((a: any) => a.title) || [];
    } catch {
      // Fallback: extract using regex
      const pattern = /"title":"([^"]+)"/g;
      const matches = [...jsonData.matchAll(pattern)];
      return matches.map(m => m[1]);
    }
  }

  private async executePowerShell(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'powershell.exe' : 'pwsh';
      const child = spawn(command, ['-NoProfile', '-NonInteractive', '-Command', script]);
      
      let stdout = '';
      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.on('close', (code) => {
        code === 0 ? resolve(stdout) : reject(new Error('PowerShell failed'));
      });
    });
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks news-summary --api-key YOUR_API_KEY
```

### Multi-Source News Aggregation

Combine news from multiple sources:

**Step 1: Create the custom task** (`.open-tasks/tasks/multi-source-news.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, TableCard } from 'open-tasks-cli';
import { spawn } from 'child_process';

export default class MultiSourceNewsTask extends TaskHandler {
  name = 'multi-source-news';
  description = 'Aggregate news from multiple sources';
  examples = [
    'open-tasks multi-source-news',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const sources = [
      { name: 'Source 1', url: 'https://api.source1.com/news', field: 'headline' },
      { name: 'Source 2', url: 'https://api.source2.com/articles', field: 'title' },
    ];

    synk.write('Fetching from multiple sources...');
    
    const allHeadlines: string[] = [];
    const tableRows: string[][] = [];

    for (const source of sources) {
      try {
        synk.write(`Fetching from ${source.name}...`);
        const data = await this.fetchUrl(source.url);
        const headlines = this.extractField(data, source.field);
        
        allHeadlines.push(...headlines);
        tableRows.push([source.name, headlines.length.toString()]);
      } catch (error) {
        tableRows.push([source.name, 'Failed']);
      }
    }

    synk.write(
      new TableCard(
        'Sources Summary',
        ['Source', 'Headlines'],
        tableRows,
        `Total headlines: ${allHeadlines.length}`,
        'info'
      )
    );

    // Combine and analyze
    const combined = `Source 1 Headlines:\n${allHeadlines.slice(0, 5).join('\n')}\n\n` +
      `Source 2 Headlines:\n${allHeadlines.slice(5, 10).join('\n')}`;
    
    const combinedRef = await flow.set(combined, []);

    const summary = `Multi-Source News Summary:\n\n` +
      `Total sources: ${sources.length}\n` +
      `Total headlines: ${allHeadlines.length}\n\n` +
      `Common themes: Technology, Business, Politics\n` +
      `Balanced summary: Multiple perspectives analyzed`;
    
    const summaryRef = await flow.set(summary, []);

    synk.write(
      new MessageCard(
        '✓ Aggregation Complete',
        `Aggregated ${allHeadlines.length} headlines from ${sources.length} sources`,
        'success'
      )
    );

    return {
      id: summaryRef.id,
      content: summary,
      token: 'final-summary',
      timestamp: new Date(),
    };
  }

  private async fetchUrl(url: string): Promise<string> {
    // Placeholder for actual API fetch
    return JSON.stringify({ articles: [] });
  }

  private extractField(jsonData: string, field: string): string[] {
    try {
      const data = JSON.parse(jsonData);
      return data.articles?.map((a: any) => a[field]) || [];
    } catch {
      return [];
    }
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks multi-source-news
```

### Domain-Specific News Summary

Filter and summarize news for a specific domain:

**Step 1: Create the custom task** (`.open-tasks/tasks/tech-news-summary.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, ListCard } from 'open-tasks-cli';

export default class TechNewsSummaryTask extends TaskHandler {
  name = 'tech-news-summary';
  description = 'Fetch and summarize technology news';
  examples = [
    'open-tasks tech-news-summary --api-key YOUR_API_KEY',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const apiKeyIndex = args.indexOf('--api-key');
    const apiKey = apiKeyIndex !== -1 ? args[apiKeyIndex + 1] : 'YOUR_API_KEY';

    synk.write('Fetching tech news...');
    // Fetch and filter for AI-related articles
    const aiArticles = ['AI breakthrough in healthcare', 'Machine learning advances', 'New AI model released'];
    
    synk.write(
      new ListCard(
        'AI-Related Articles',
        aiArticles,
        'info'
      )
    );

    const summary = `AI News Summary:\n\n${aiArticles.join('\n')}`;
    const summaryRef = await flow.set(summary, []);

    synk.write(
      new MessageCard(
        '✓ Summary Complete',
        `Found ${aiArticles.length} AI-related articles`,
        'success'
      )
    );

    return {
      id: summaryRef.id,
      content: summary,
      token: 'ai-summary',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks tech-news-summary --api-key YOUR_API_KEY
```

---

## Log Analysis Workflow

Analyze application logs to identify issues.

### Extract Error Messages

**Step 1: Create the custom task** (`.open-tasks/tasks/extract-errors.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, TableCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class ExtractErrorsTask extends TaskHandler {
  name = 'extract-errors';
  description = 'Extract error messages from log files';
  examples = [
    'open-tasks extract-errors ./app.log',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const logPath = args[0];
    if (!logPath) {
      throw new Error('Log file path required');
    }

    synk.write('Loading log file...');
    const absolutePath = path.isAbsolute(logPath)
      ? logPath
      : path.join(flow.cwd, logPath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    await flow.set(content, []);

    // Extract error messages
    synk.write('Extracting error messages...');
    const errorPattern = /ERROR: (.+)/g;
    const errors = [...content.matchAll(errorPattern)].map(m => m[1]);
    
    // Extract timestamps
    const timestampPattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/g;
    const timestamps = [...content.matchAll(timestampPattern)].map(m => m[1]);

    const summary = `Found errors at:\n${timestamps.slice(0, 10).join('\n')}`;
    const summaryRef = await flow.set(summary, []);

    synk.write(
      new MessageCard(
        '✓ Errors Extracted',
        `Found ${errors.length} errors`,
        errors.length > 0 ? 'warning' : 'success'
      )
    );

    return {
      id: summaryRef.id,
      content: summary,
      token: 'error-summary',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks extract-errors ./app.log
```

### Analyze Error Patterns

**Step 1: Create the custom task** (`.open-tasks/tasks/analyze-errors.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, TableCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class AnalyzeErrorsTask extends TaskHandler {
  name = 'analyze-errors';
  description = 'Analyze error patterns in log files';
  examples = [
    'open-tasks analyze-errors ./application.log',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const logPath = args[0];
    if (!logPath) {
      throw new Error('Log file path required');
    }

    synk.write('Loading log file...');
    const absolutePath = path.isAbsolute(logPath)
      ? logPath
      : path.join(flow.cwd, logPath);
    const content = await fs.readFile(absolutePath, 'utf-8');

    // Extract all errors
    synk.write('Extracting errors...');
    const errorPattern = /ERROR.*/g;
    const errors = content.match(errorPattern) || [];
    const errorsRef = await flow.set(errors.join('\n'), []);

    // Analyze patterns
    synk.write('Analyzing error patterns...');
    const analysis = `Error Pattern Analysis:\n\n` +
      `Total errors: ${errors.length}\n\n` +
      `Common patterns:\n` +
      `- Database connection failures\n` +
      `- Timeout errors\n` +
      `- Null reference exceptions\n\n` +
      `Root cause analysis:\n` +
      `- Check database connection pool\n` +
      `- Review timeout configurations\n` +
      `- Add null checks in code`;
    
    const analysisRef = await flow.set(analysis, []);

    synk.write(
      new MessageCard(
        '✓ Analysis Complete',
        `Analyzed ${errors.length} error messages`,
        'success'
      )
    );

    return {
      id: analysisRef.id,
      content: analysis,
      token: 'error-analysis',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks analyze-errors ./application.log
```

---

## Documentation Generation Workflow

Generate documentation from source code.

### Extract Function Documentation

**Step 1: Create the custom task** (`.open-tasks/tasks/generate-api-docs.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, ListCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class GenerateApiDocsTask extends TaskHandler {
  name = 'generate-api-docs';
  description = 'Generate API documentation from source code';
  examples = [
    'open-tasks generate-api-docs ./src/api.ts',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const sourcePath = args[0];
    if (!sourcePath) {
      throw new Error('Source file path required');
    }

    synk.write('Loading source code...');
    const absolutePath = path.isAbsolute(sourcePath)
      ? sourcePath
      : path.join(flow.cwd, sourcePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    await flow.set(content, []);

    // Extract function signatures
    synk.write('Extracting function signatures...');
    const functionPattern = /export function ([a-zA-Z]+)\([^)]*\)/g;
    const functions = [...content.matchAll(functionPattern)].map(m => m[1]);

    synk.write(
      new ListCard(
        'Functions Found',
        functions,
        'info'
      )
    );

    // Generate documentation
    const docs = `# API Documentation\n\n## Functions\n\n${functions.map(f => `### ${f}\n\nDescription: TODO\n`).join('\n')}`;
    const docsRef = await flow.set(docs, []);

    synk.write(
      new MessageCard(
        '✓ Documentation Generated',
        `Created docs for ${functions.length} functions`,
        'success'
      )
    );

    return {
      id: docsRef.id,
      content: docs,
      token: 'api-docs',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks generate-api-docs ./src/api.ts
```

### Generate README from Code

**Step 1: Create the custom task** (`.open-tasks/tasks/generate-readme.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class GenerateReadmeTask extends TaskHandler {
  name = 'generate-readme';
  description = 'Generate README from package.json and source';
  examples = [
    'open-tasks generate-readme',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    synk.write('Loading package.json...');
    const pkgPath = path.join(flow.cwd, 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);

    synk.write('Loading main source file...');
    const mainPath = path.join(flow.cwd, 'src/index.ts');
    const mainContent = await fs.readFile(mainPath, 'utf-8');

    // Extract exports
    const exportPattern = /export \{([^}]+)\}/g;
    const exports = [...mainContent.matchAll(exportPattern)].map(m => m[1].trim());

    // Generate README
    synk.write('Generating README...');
    const readme = `# ${pkg.name}\n\n${pkg.description}\n\n` +
      `## Installation\n\n\`\`\`bash\nnpm install ${pkg.name}\n\`\`\`\n\n` +
      `## Usage\n\nSee API reference below.\n\n` +
      `## API Reference\n\n${exports.join(', ')}`;
    
    const readmeRef = await flow.set(readme, []);

    synk.write(
      new MessageCard(
        '✓ README Generated',
        'README.md created successfully',
        'success'
      )
    );

    return {
      id: readmeRef.id,
      content: readme,
      token: 'readme',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks generate-readme
```

---

## Data Transformation Pipeline

Transform data through multiple steps.

### CSV to JSON Transformation

**Step 1: Create the custom task** (`.open-tasks/tasks/csv-to-json.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, TableCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class CsvToJsonTask extends TaskHandler {
  name = 'csv-to-json';
  description = 'Transform CSV data to JSON format';
  examples = [
    'open-tasks csv-to-json ./data.csv',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const csvPath = args[0];
    if (!csvPath) {
      throw new Error('CSV file path required');
    }

    synk.write('Loading CSV data...');
    const absolutePath = path.isAbsolute(csvPath)
      ? csvPath
      : path.join(flow.cwd, csvPath);
    const content = await fs.readFile(absolutePath, 'utf-8');

    // Parse CSV
    synk.write('Parsing CSV...');
    const lines = content.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');
    const rows = lines.slice(1);

    // Transform to JSON
    synk.write('Transforming to JSON...');
    const jsonData = rows.map(row => {
      const values = row.split(',');
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header.trim()] = values[i]?.trim() || '';
      });
      return obj;
    });

    const jsonOutput = JSON.stringify(jsonData, null, 2);
    const jsonRef = await flow.set(jsonOutput, []);

    synk.write(
      new TableCard(
        'Transformation Summary',
        ['Metric', 'Value'],
        [
          ['Rows', rows.length.toString()],
          ['Columns', headers.length.toString()],
          ['Output Size', `${jsonOutput.length} bytes`],
        ],
        'Transformation complete',
        'success'
      )
    );

    return {
      id: jsonRef.id,
      content: jsonOutput,
      token: 'json-output',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks csv-to-json ./data.csv
```

---

## API Integration Workflow

Work with external APIs and process responses.

### Fetch and Transform API Data

**Step 1: Create the custom task** (`.open-tasks/tasks/fetch-repo-data.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, KeyValueCard } from 'open-tasks-cli';

export default class FetchRepoDataTask extends TaskHandler {
  name = 'fetch-repo-data';
  description = 'Fetch and format GitHub repository data';
  examples = [
    'open-tasks fetch-repo-data microsoft/vscode',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const repo = args[0] || 'microsoft/vscode';

    synk.write('Fetching repository data...');
    // In production, use actual API call
    const mockData = {
      full_name: repo,
      stargazers_count: 150000,
      language: 'TypeScript'
    };

    // Extract specific fields
    const report = `Repository Report:\n` +
      `- Name: ${mockData.full_name}\n` +
      `- Stars: ${mockData.stargazers_count}\n` +
      `- Language: ${mockData.language}`;
    
    const reportRef = await flow.set(report, []);

    synk.write(
      new KeyValueCard(
        'Repository Info',
        {
          'Name': mockData.full_name,
          'Stars': mockData.stargazers_count.toString(),
          'Language': mockData.language
        },
        'info'
      )
    );

    return {
      id: reportRef.id,
      content: report,
      token: 'report',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks fetch-repo-data microsoft/vscode
```

### Chain API Calls

**Step 1: Create the custom task** (`.open-tasks/tasks/chain-api-calls.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, ListCard } from 'open-tasks-cli';

export default class ChainApiCallsTask extends TaskHandler {
  name = 'chain-api-calls';
  description = 'Chain multiple API calls together';
  examples = [
    'open-tasks chain-api-calls octocat',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const username = args[0] || 'octocat';

    synk.write('Fetching user data...');
    // Mock user data
    const userData = {
      login: username,
      repos_url: `https://api.github.com/users/${username}/repos`
    };

    synk.write('Fetching repositories...');
    // Mock repo data
    const repos = [
      { name: 'hello-world', language: 'JavaScript' },
      { name: 'octocat-profile', language: 'HTML' },
      { name: 'test-repo', language: 'Python' }
    ];

    const repoNames = repos.map(r => `${r.name} (${r.language})`);
    
    synk.write(
      new ListCard(
        'User Repositories',
        repoNames,
        'info'
      )
    );

    // Analyze repos
    const analysis = `Repository Analysis for ${username}:\n\n` +
      `Total repositories: ${repos.length}\n` +
      `Main languages: JavaScript, HTML, Python\n` +
      `Areas of interest: Web development, scripting`;
    
    const analysisRef = await flow.set(analysis, []);

    synk.write(
      new MessageCard(
        '✓ Analysis Complete',
        `Analyzed ${repos.length} repositories`,
        'success'
      )
    );

    return {
      id: analysisRef.id,
      content: analysis,
      token: 'analysis',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks chain-api-calls octocat
```

---

## Configuration Management

Manage configuration files and templates.

### Environment-Specific Config

**Step 1: Create the custom task** (`.open-tasks/tasks/generate-config.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, KeyValueCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class GenerateConfigTask extends TaskHandler {
  name = 'generate-config';
  description = 'Generate environment-specific configuration';
  examples = [
    'open-tasks generate-config production',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const environment = args[0] || 'production';

    synk.write('Loading template config...');
    const templatePath = path.join(flow.cwd, 'config.template.json');
    let template = '{"database": "{{db-url}}", "apiKey": "{{api-key}}"}';
    
    try {
      template = await fs.readFile(templatePath, 'utf-8');
    } catch {
      synk.write('Template not found, using default');
    }

    // Define environment variables
    const dbUrl = `postgres://${environment}-server/db`;
    const apiKey = `${environment}-api-key-123`;

    synk.write(
      new KeyValueCard(
        'Environment Variables',
        {
          'Environment': environment,
          'Database URL': dbUrl,
          'API Key': apiKey
        },
        'info'
      )
    );

    // Generate config
    synk.write('Generating configuration...');
    const prodConfig = template
      .replace('{{db-url}}', dbUrl)
      .replace('{{api-key}}', apiKey);
    
    const configRef = await flow.set(prodConfig, []);

    synk.write(
      new MessageCard(
        '✓ Config Generated',
        `${environment} configuration created`,
        'success'
      )
    );

    return {
      id: configRef.id,
      content: prodConfig,
      token: 'prod-config',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks generate-config production
```

### Validate Configuration

**Step 1: Create the custom task** (`.open-tasks/tasks/validate-config.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, ListCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class ValidateConfigTask extends TaskHandler {
  name = 'validate-config';
  description = 'Validate configuration file';
  examples = [
    'open-tasks validate-config ./config.json',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const configPath = args[0] || './config.json';

    synk.write('Loading config file...');
    const absolutePath = path.isAbsolute(configPath)
      ? configPath
      : path.join(flow.cwd, configPath);
    const content = await fs.readFile(absolutePath, 'utf-8');

    // Extract environment variables
    synk.write('Extracting environment variables...');
    const envVarPattern = /\$\{([^}]+)\}/g;
    const envVars = [...content.matchAll(envVarPattern)].map(m => m[1]);

    // Check for standard vars
    const standardVars = ['NODE_ENV', 'PORT', 'DATABASE_URL'];
    const missing = standardVars.filter(v => !envVars.includes(v));

    synk.write(
      new ListCard(
        'Required Variables',
        envVars.length > 0 ? envVars : ['None found'],
        'info'
      )
    );

    const validation = missing.length > 0
      ? `Missing standard environment variables: ${missing.join(', ')}`
      : 'All standard environment variables are present';
    
    const validationRef = await flow.set(validation, []);

    synk.write(
      new MessageCard(
        missing.length > 0 ? '⚠ Validation Warning' : '✓ Validation Passed',
        validation,
        missing.length > 0 ? 'warning' : 'success'
      )
    );

    return {
      id: validationRef.id,
      content: validation,
      token: 'validation',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks validate-config ./config.json
```

---

## Testing Workflow

Generate and manage test cases.

### Generate Test Cases

**Step 1: Create the custom task** (`.open-tasks/tasks/generate-tests.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, ListCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class GenerateTestsTask extends TaskHandler {
  name = 'generate-tests';
  description = 'Generate test cases for source code';
  examples = [
    'open-tasks generate-tests ./src/calculator.ts',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    const sourcePath = args[0];
    if (!sourcePath) {
      throw new Error('Source file path required');
    }

    synk.write('Loading source code...');
    const absolutePath = path.isAbsolute(sourcePath)
      ? sourcePath
      : path.join(flow.cwd, sourcePath);
    const content = await fs.readFile(absolutePath, 'utf-8');

    // Extract function signatures
    synk.write('Extracting function signatures...');
    const functionPattern = /export function ([a-zA-Z]+)\([^)]*\)/g;
    const functions = [...content.matchAll(functionPattern)].map(m => m[1]);

    synk.write(
      new ListCard(
        'Functions to Test',
        functions,
        'info'
      )
    );

    // Generate test cases
    synk.write('Generating test cases...');
    const testCases = functions.map(fn => 
      `describe('${fn}', () => {\n` +
      `  it('should handle valid input', () => { });\n` +
      `  it('should handle edge cases', () => { });\n` +
      `  it('should handle errors', () => { });\n` +
      `});\n`
    ).join('\n');
    
    const testRef = await flow.set(testCases, []);

    synk.write(
      new MessageCard(
        '✓ Test Cases Generated',
        `Created tests for ${functions.length} functions`,
        'success'
      )
    );

    return {
      id: testRef.id,
      content: testCases,
      token: 'test-cases',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks generate-tests ./src/calculator.ts
```

### Analyze Test Coverage

**Step 1: Create the custom task** (`.open-tasks/tasks/analyze-coverage.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, TableCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class AnalyzeCoverageTask extends TaskHandler {
  name = 'analyze-coverage';
  description = 'Analyze test coverage';
  examples = [
    'open-tasks analyze-coverage ./tests/api.test.ts ./src/api.ts',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    if (args.length < 2) {
      throw new Error('Test file and source file required');
    }

    const testPath = args[0];
    const sourcePath = args[1];

    synk.write('Loading test file...');
    const testAbsPath = path.isAbsolute(testPath)
      ? testPath
      : path.join(flow.cwd, testPath);
    const testContent = await fs.readFile(testAbsPath, 'utf-8');

    synk.write('Loading source file...');
    const sourceAbsPath = path.isAbsolute(sourcePath)
      ? sourcePath
      : path.join(flow.cwd, sourcePath);
    const sourceContent = await fs.readFile(sourceAbsPath, 'utf-8');

    // Analyze coverage
    synk.write('Analyzing coverage...');
    const sourceFunctions = sourceContent.match(/export function \w+/g) || [];
    const testedFunctions = testContent.match(/describe\('(\w+)'/g) || [];
    
    const coverage = (testedFunctions.length / sourceFunctions.length * 100).toFixed(1);

    synk.write(
      new TableCard(
        'Coverage Analysis',
        ['Metric', 'Value'],
        [
          ['Source Functions', sourceFunctions.length.toString()],
          ['Tested Functions', testedFunctions.length.toString()],
          ['Coverage', `${coverage}%`],
        ],
        'Coverage analysis complete',
        'info'
      )
    );

    const analysis = `Test Coverage Analysis:\n\n` +
      `Source functions: ${sourceFunctions.length}\n` +
      `Tested functions: ${testedFunctions.length}\n` +
      `Coverage: ${coverage}%\n\n` +
      `Untested functionality: Review source for missing tests`;
    
    const analysisRef = await flow.set(analysis, []);

    synk.write(
      new MessageCard(
        '✓ Analysis Complete',
        `Coverage: ${coverage}%`,
        'success'
      )
    );

    return {
      id: analysisRef.id,
      content: analysis,
      token: 'coverage-analysis',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks analyze-coverage ./tests/api.test.ts ./src/api.ts
```

---

## Build Automation

Automate build and release processes.

### Generate Release Notes

**Step 1: Create the custom task** (`.open-tasks/tasks/generate-release-notes.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard, ListCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

export default class GenerateReleaseNotesTask extends TaskHandler {
  name = 'generate-release-notes';
  description = 'Generate release notes from git commits';
  examples = [
    'open-tasks generate-release-notes',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    synk.write('Reading package.json...');
    const pkgPath = path.join(flow.cwd, 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    const version = pkg.version;

    synk.write('Getting git log...');
    const commits = await this.getGitLog();
    const commitLines = commits.split('\n').filter(l => l.trim());

    synk.write(
      new ListCard(
        'Recent Commits',
        commitLines.slice(0, 5),
        'info'
      )
    );

    // Generate release notes
    const releaseNotes = `# Release Notes - v${version}\n\n` +
      `## Changes\n\n${commitLines.map(c => `- ${c}`).join('\n')}\n\n` +
      `## Installation\n\n\`\`\`bash\nnpm install ${pkg.name}@${version}\n\`\`\``;
    
    const notesRef = await flow.set(releaseNotes, []);

    synk.write(
      new MessageCard(
        '✓ Release Notes Generated',
        `Generated for version ${version}`,
        'success'
      )
    );

    return {
      id: notesRef.id,
      content: releaseNotes,
      token: 'release-notes',
      timestamp: new Date(),
    };
  }

  private async getGitLog(): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('git', ['log', '--oneline', '-10']);
      let stdout = '';
      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.on('close', (code) => {
        code === 0 ? resolve(stdout) : reject(new Error('Git command failed'));
      });
    });
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks generate-release-notes
```

### Update Changelog

**Step 1: Create the custom task** (`.open-tasks/tasks/update-changelog.ts`):

```typescript
import { TaskHandler } from 'open-tasks-cli';
import { MessageCard } from 'open-tasks-cli';
import { promises as fs } from 'fs';
import path from 'path';

export default class UpdateChangelogTask extends TaskHandler {
  name = 'update-changelog';
  description = 'Update CHANGELOG.md with new version entry';
  examples = [
    'open-tasks update-changelog',
  ];

  protected async executeCommand(
    config: Record<string, any>,
    args: string[],
    flow: any,
    synk: any
  ): Promise<any> {
    synk.write('Reading current version...');
    const pkgPath = path.join(flow.cwd, 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    const version = pkg.version;

    synk.write('Loading existing changelog...');
    const changelogPath = path.join(flow.cwd, 'CHANGELOG.md');
    let changelog = '# Changelog\n\n';
    
    try {
      changelog = await fs.readFile(changelogPath, 'utf-8');
    } catch {
      synk.write('Changelog not found, creating new');
    }

    // Create new entry
    synk.write('Creating new changelog entry...');
    const date = new Date().toISOString().split('T')[0];
    const newEntry = `## [${version}] - ${date}\n\n` +
      `### Added\n- Feature 1\n- Feature 2\n\n` +
      `### Changed\n- Update 1\n\n` +
      `### Fixed\n- Bug fix 1\n\n`;

    const updatedChangelog = changelog.includes('# Changelog')
      ? changelog.replace('# Changelog\n\n', `# Changelog\n\n${newEntry}`)
      : `# Changelog\n\n${newEntry}\n${changelog}`;
    
    const changelogRef = await flow.set(updatedChangelog, []);

    synk.write(
      new MessageCard(
        '✓ Changelog Updated',
        `Added entry for version ${version}`,
        'success'
      )
    );

    return {
      id: changelogRef.id,
      content: updatedChangelog,
      token: 'updated-changelog',
      timestamp: new Date(),
    };
  }
}
```

**Step 2: Run the custom task**:

```bash
open-tasks update-changelog
```

---

## Next Steps

These examples demonstrate how to create custom task handlers that wrap commands into complete workflows. Each example shows:

1. **Creating a custom task handler** - Implementing `ITaskHandler` or extending `TaskHandler`
2. **Loading and processing data** - Using the workflow context to manage state
3. **Creating visual output** - Using MessageCard, TableCard, ListCard, etc.
4. **Running from command line** - Using `open-tasks your-task-name`

To create your own workflows:

- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Learn how to organize commands into reusable tasks
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Create custom commands for your specific needs
- **[Commands](./Commands.md)** - Full reference of all available commands
- **[Architecture](./Architecture.md)** - Understand how the system works

---

**Pro Tip:** All examples shown here create custom tasks in the `.open-tasks/tasks/` directory. Use `open-tasks create your-task-name --typescript` to scaffold a new task quickly!
