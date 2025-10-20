# Example Tasks

Learn by example. This guide provides ready-to-use task templates for common workflows including code review, news summarization, and more.

## Overview

Example tasks demonstrate how to:
- Chain multiple commands together
- Build context from multiple sources
- Integrate with AI agents
- Transform and process data
- Generate useful outputs

All examples can be copied to `.open-tasks/` and customized for your needs.

---

## Code Review Task

Automatically review code changes using AI with comprehensive context.

### Features

- Loads file content
- Analyzes code structure
- Provides improvement suggestions
- Checks for security issues
- Generates detailed report

### Implementation

Create `.open-tasks/code-review.js`:

```javascript
import { ReadCommand } from '../src/commands/read.js';
import { SetCommand } from '../src/commands/set.js';
import { JoinCommand } from '../src/commands/join.js';
import { WriteCommand } from '../src/commands/write.js';
import { ClaudeConfigBuilder } from '../src/commands/agents/claude.js';
import { AgentCommand } from '../src/commands/agent.js';

export default class CodeReviewCommand {
  name = 'code-review';
  description = 'Review code with AI assistant';
  examples = [
    'ot code-review src/app.js',
    'ot code-review src/auth.js --focus security',
  ];

  async execute(args, context) {
    const flow = context.workflowContext;
    const filePath = args[0];
    
    if (!filePath) {
      throw new Error('Please provide a file path: ot code-review <file>');
    }

    context.outputSynk.write(`Reviewing: ${filePath}`);

    // Build review focus
    const focusIndex = args.indexOf('--focus');
    const focus = focusIndex !== -1 && args[focusIndex + 1]
      ? args[focusIndex + 1]
      : 'code quality, bugs, and best practices';

    // Step 1: Read the code file
    context.outputSynk.write('Step 1: Loading code...');
    const codeRef = await flow.run(new ReadCommand(filePath));

    // Step 2: Build the review prompt
    context.outputSynk.write('Step 2: Building review prompt...');
    const promptRef = await flow.run(new SetCommand(
      `You are an expert code reviewer. Please review the following code with focus on ${focus}.\n\n` +
      `Provide:\n` +
      `1. Overall assessment\n` +
      `2. Specific issues found (with line references if possible)\n` +
      `3. Security concerns\n` +
      `4. Performance considerations\n` +
      `5. Recommended improvements\n\n` +
      `Code to review:`
    ));

    // Step 3: Combine prompt and code
    context.outputSynk.write('Step 3: Preparing context...');
    const combinedRef = await flow.run(
      new JoinCommand([promptRef[0], '\n\n', codeRef[0]])
    );

    // Step 4: Configure Claude agent
    context.outputSynk.write('Step 4: Configuring AI reviewer...');
    const agentConfig = new ClaudeConfigBuilder()
      .withModel('claude-3.5-sonnet')
      .allowingAllTools()
      .withExtendedThinking()
      .withTimeout(120000)
      .build();

    // Step 5: Execute review
    context.outputSynk.write('Step 5: Executing code review...');
    const reviewRef = await flow.run(
      new AgentCommand(agentConfig, [combinedRef[0]])
    );

    // Step 6: Save review to file
    const outputFile = `review-${Date.now()}.md`;
    context.outputSynk.write(`Step 6: Saving review to ${outputFile}...`);
    await flow.run(new WriteCommand(outputFile, reviewRef[0]));

    // Get final review content
    const reviewContent = await flow.get(reviewRef[0]);

    return {
      id: reviewRef[0].id,
      content: reviewContent,
      token: 'code-review-result',
      timestamp: new Date(),
      outputFile: `${context.workflowContext.outputDir}/${outputFile}`
    };
  }
}
```

### Usage

```bash
# Review a file
ot code-review src/app.js

# Review with specific focus
ot code-review src/auth.js --focus security

# Review API code
ot code-review src/api.js --focus "error handling and validation"
```

### Output

The task generates a markdown file with:
- Overall code quality assessment
- List of specific issues
- Security concerns
- Performance recommendations
- Suggested improvements

---

## News Summary Task

Fetch news from an API and generate a formatted summary.

### Features

- Fetches news from external API
- Extracts relevant data with JSON transformation
- Generates formatted summaries
- Creates readable output

### Implementation

Create `.open-tasks/news-summary.js`:

```javascript
import { SetCommand } from '../src/commands/set.js';
import { JsonTransformCommand } from '../src/commands/json-transform.js';
import { TemplateCommand } from '../src/commands/template.js';
import { WriteCommand } from '../src/commands/write.js';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(spawn);

export default class NewsSummaryCommand {
  name = 'news-summary';
  description = 'Fetch and summarize news articles';
  examples = [
    'ot news-summary technology',
    'ot news-summary "artificial intelligence" --count 5',
  ];

  async execute(args, context) {
    const flow = context.workflowContext;
    const topic = args[0] || 'technology';
    
    const countIndex = args.indexOf('--count');
    const count = countIndex !== -1 && args[countIndex + 1]
      ? parseInt(args[countIndex + 1])
      : 3;

    context.outputSynk.write(`Fetching news about: ${topic}`);

    // Step 1: Fetch news data (example using NewsAPI)
    context.outputSynk.write('Step 1: Fetching news from API...');
    const newsData = await this.fetchNews(topic, count);
    const newsRef = await flow.run(new SetCommand(newsData));

    // Step 2: Extract articles
    context.outputSynk.write('Step 2: Parsing articles...');
    const articlesRef = await flow.run(
      new JsonTransformCommand(newsRef[0], (data) => data.articles || [])
    );

    // Step 3: Process each article
    context.outputSynk.write('Step 3: Processing articles...');
    const articles = JSON.parse(await flow.get(articlesRef[0]));
    
    let summaries = [];
    for (let i = 0; i < Math.min(articles.length, count); i++) {
      const article = articles[i];
      
      // Store article fields as tokens
      await flow.run(new SetCommand(article.title || 'Untitled', 'title'));
      await flow.run(new SetCommand(article.description || 'No description', 'description'));
      await flow.run(new SetCommand(article.url || '', 'url'));
      await flow.run(new SetCommand(article.publishedAt || '', 'date'));
      await flow.run(new SetCommand(article.source?.name || 'Unknown', 'source'));
      
      // Create formatted summary
      const templateRef = await flow.run(new SetCommand(
        `## {{title}}\n\n` +
        `**Source:** {{source}}  \n` +
        `**Published:** {{date}}\n\n` +
        `{{description}}\n\n` +
        `[Read more]({{url}})\n\n---\n`
      ));
      
      const summaryRef = await flow.run(new TemplateCommand(templateRef[0]));
      summaries.push(await flow.get(summaryRef[0]));
    }

    // Step 4: Combine all summaries
    context.outputSynk.write('Step 4: Generating final summary...');
    const finalSummary = `# News Summary: ${topic}\n\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      summaries.join('\n');

    const finalRef = await flow.run(new SetCommand(finalSummary));

    // Step 5: Save to file
    const outputFile = `news-${topic.replace(/\s+/g, '-')}-${Date.now()}.md`;
    context.outputSynk.write(`Step 5: Saving to ${outputFile}...`);
    await flow.run(new WriteCommand(outputFile, finalRef[0]));

    return {
      id: finalRef[0].id,
      content: finalSummary,
      token: 'news-summary-result',
      timestamp: new Date(),
      outputFile: `${context.workflowContext.outputDir}/${outputFile}`
    };
  }

  async fetchNews(topic, count) {
    // Example using NewsAPI (you'll need an API key)
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      // Return mock data for demonstration
      return JSON.stringify({
        articles: [
          {
            title: `${topic} Breakthrough Announced`,
            description: `Major development in ${topic} field...`,
            url: 'https://example.com/article1',
            publishedAt: new Date().toISOString(),
            source: { name: 'Tech News' }
          },
          {
            title: `Industry Leaders Discuss ${topic}`,
            description: `Conference highlights importance of ${topic}...`,
            url: 'https://example.com/article2',
            publishedAt: new Date().toISOString(),
            source: { name: 'Industry Today' }
          }
        ]
      });
    }

    // Real API call (uncomment when you have an API key)
    // const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&pageSize=${count}&apiKey=${apiKey}`;
    // const response = await fetch(url);
    // return await response.text();
  }
}
```

### Usage

```bash
# Get technology news
ot news-summary technology

# Get AI news (5 articles)
ot news-summary "artificial intelligence" --count 5

# Get business news
ot news-summary business --count 3
```

### Setup

Set your NewsAPI key (optional, works with mock data by default):

```bash
export NEWS_API_KEY="your-api-key-here"
```

Get a free API key at [NewsAPI.org](https://newsapi.org/)

---

## Documentation Generator

Generate documentation from code files using AI.

### Implementation

Create `.open-tasks/doc-generator.js`:

```javascript
import { ReadCommand } from '../src/commands/read.js';
import { SetCommand } from '../src/commands/set.js';
import { WriteCommand } from '../src/commands/write.js';
import { GeminiConfigBuilder } from '../src/commands/agents/gemini.js';
import { AgentCommand } from '../src/commands/agent.js';
import path from 'path';

export default class DocGeneratorCommand {
  name = 'doc-generator';
  description = 'Generate documentation from code';
  examples = [
    'ot doc-generator src/utils.js',
    'ot doc-generator src/api.js --format markdown',
  ];

  async execute(args, context) {
    const flow = context.workflowContext;
    const filePath = args[0];
    
    if (!filePath) {
      throw new Error('Please provide a file path');
    }

    const format = args.includes('--format')
      ? args[args.indexOf('--format') + 1]
      : 'markdown';

    context.outputSynk.write(`Generating docs for: ${filePath}`);

    // Step 1: Read code
    const codeRef = await flow.run(new ReadCommand(filePath));

    // Step 2: Build prompt
    const promptRef = await flow.run(new SetCommand(
      `Generate comprehensive ${format} documentation for this code. Include:\n\n` +
      `1. Overview and purpose\n` +
      `2. Function/class descriptions\n` +
      `3. Parameters and return types\n` +
      `4. Usage examples\n` +
      `5. Edge cases and notes\n\n` +
      `Code:`
    ));

    // Step 3: Configure agent
    const agentConfig = new GeminiConfigBuilder()
      .withModel('gemini-2.5-pro')
      .enableSearch()
      .build();

    // Step 4: Generate documentation
    context.outputSynk.write('Generating documentation...');
    const docsRef = await flow.run(
      new AgentCommand(agentConfig, [promptRef[0], codeRef[0]])
    );

    // Step 5: Save documentation
    const baseName = path.basename(filePath, path.extname(filePath));
    const outputFile = `${baseName}-docs.md`;
    await flow.run(new WriteCommand(outputFile, docsRef[0]));

    return {
      id: docsRef[0].id,
      content: await flow.get(docsRef[0]),
      timestamp: new Date(),
      outputFile: `${context.workflowContext.outputDir}/${outputFile}`
    };
  }
}
```

### Usage

```bash
# Generate docs for a file
ot doc-generator src/utils.js

# Generate in specific format
ot doc-generator src/api.js --format markdown
```

---

## Test Generator

Generate unit tests for code files.

### Implementation

Create `.open-tasks/test-generator.js`:

```javascript
import { ReadCommand } from '../src/commands/read.js';
import { SetCommand } from '../src/commands/set.js';
import { WriteCommand } from '../src/commands/write.js';
import { ClaudeConfigBuilder } from '../src/commands/agents/claude.js';
import { AgentCommand } from '../src/commands/agent.js';
import path from 'path';

export default class TestGeneratorCommand {
  name = 'test-generator';
  description = 'Generate unit tests for code';
  examples = [
    'ot test-generator src/utils.js',
    'ot test-generator src/api.js --framework vitest',
  ];

  async execute(args, context) {
    const flow = context.workflowContext;
    const filePath = args[0];
    
    if (!filePath) {
      throw new Error('Please provide a file path');
    }

    const framework = args.includes('--framework')
      ? args[args.indexOf('--framework') + 1]
      : 'jest';

    context.outputSynk.write(`Generating tests for: ${filePath}`);

    // Read source code
    const codeRef = await flow.run(new ReadCommand(filePath));

    // Build prompt
    const promptRef = await flow.run(new SetCommand(
      `Generate comprehensive unit tests using ${framework} for this code.\n\n` +
      `Include:\n` +
      `1. Test cases for all functions\n` +
      `2. Edge cases and error scenarios\n` +
      `3. Mocking where appropriate\n` +
      `4. Clear test descriptions\n\n` +
      `Code:`
    ));

    // Configure agent
    const agentConfig = new ClaudeConfigBuilder()
      .withModel('claude-3.5-sonnet')
      .allowingAllTools()
      .build();

    // Generate tests
    context.outputSynk.write('Generating unit tests...');
    const testsRef = await flow.run(
      new AgentCommand(agentConfig, [promptRef[0], codeRef[0]])
    );

    // Save tests
    const baseName = path.basename(filePath, path.extname(filePath));
    const outputFile = `${baseName}.test.js`;
    await flow.run(new WriteCommand(outputFile, testsRef[0]));

    return {
      id: testsRef[0].id,
      content: await flow.get(testsRef[0]),
      timestamp: new Date(),
      outputFile: `${context.workflowContext.outputDir}/${outputFile}`
    };
  }
}
```

### Usage

```bash
# Generate Jest tests
ot test-generator src/utils.js

# Generate Vitest tests
ot test-generator src/api.js --framework vitest

# Generate Mocha tests
ot test-generator src/db.js --framework mocha
```

---

## Quick Start

### 1. Copy Example to Your Project

```bash
# Initialize if needed
ot init

# Copy example code to .open-tasks/
# (Copy any example from above)

# Run the task
ot code-review src/app.js
```

### 2. Customize for Your Needs

Edit the task file to:
- Change AI models
- Adjust prompts
- Add new processing steps
- Customize output format

### 3. Share with Your Team

Commit `.open-tasks/` to your repository:

```bash
git add .open-tasks/
git commit -m "Add custom code review task"
```

---

## Next Steps

- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Learn to create your own
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Build reusable commands
- **[Core Agents Command Builder](./Core-Agents-Command-Builder.md)** - Agent configuration details

## See Also

- **[Core Commands](./Core-Commands.md)** - Available command reference
- **[Core Tasks](./Core-Tasks.md)** - Built-in tasks
- **[Architecture](./Architecture.md)** - System design
