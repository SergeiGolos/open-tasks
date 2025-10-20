# Example Tasks

This page demonstrates real-world workflows using Open Tasks CLI to accomplish common development and automation tasks.

## Code Review Workflow

Automatically review code changes using AI with structured context.

### Basic Code Review

Review a single file for best practices:

```bash
# Load the source code
open-tasks load ./src/api.ts --token source

# Ask AI for a review
open-tasks ai-cli "Review this code for best practices, security issues, and potential bugs" --ref source --token review

# The review is now stored and can be saved or further processed
```

### Multi-File Code Review

Review multiple related files together:

```bash
# Load all related files
open-tasks load ./src/api.ts --token api
open-tasks load ./src/types.ts --token types
open-tasks load ./src/utils.ts --token utils

# Review with full context
open-tasks ai-cli "Review these files. Check how they work together and identify any inconsistencies or integration issues" --ref api --ref types --ref utils --token review
```

### Extract and Review Specific Functions

Review only specific functions from a large file:

```bash
# Load the source file
open-tasks load ./src/large-file.ts --token source

# Extract function definitions
open-tasks extract "export function ([a-zA-Z]+)\([^)]*\)[^{]*\{[^}]+\}" --ref source --all --token functions

# Review just the extracted functions
open-tasks ai-cli "Review these function signatures and implementations for correctness" --ref functions --token function-review
```

### Review with Context from Documentation

Review code against its documentation:

```bash
# Load the implementation
open-tasks load ./src/authentication.ts --token impl

# Load the documentation
open-tasks load ./docs/auth-spec.md --token spec

# Review implementation against spec
open-tasks ai-cli "Does this implementation match the specification? Identify any deviations or missing features." --ref impl --ref spec --token compliance-review
```

### Review Git Diff

Review changes in a git diff:

```bash
# Get the git diff
open-tasks powershell "git diff HEAD~1 HEAD -- src/" --token diff

# Review the changes
open-tasks ai-cli "Review these code changes. What's the impact? Are there any issues?" --ref diff --token diff-review
```

---

## News Summary Workflow

Aggregate and summarize news from multiple sources.

### Fetch and Summarize News

Fetch news from an API and create a summary:

```bash
# Fetch news from API
open-tasks powershell "Invoke-RestMethod 'https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_API_KEY'" --token news-raw

# Extract headlines
open-tasks extract '"title":"([^"]+)"' --ref news-raw --all --token headlines

# Create summary
open-tasks ai-cli "Summarize these news headlines into 3-5 key points" --ref headlines --token summary
```

### Multi-Source News Aggregation

Combine news from multiple sources:

```bash
# Fetch from source 1
open-tasks powershell "Invoke-RestMethod 'https://api.source1.com/news'" --token source1

# Fetch from source 2
open-tasks powershell "Invoke-RestMethod 'https://api.source2.com/articles'" --token source2

# Extract relevant fields from source 1
open-tasks extract '"headline":"([^"]+)"' --ref source1 --all --token headlines1

# Extract relevant fields from source 2
open-tasks extract '"title":"([^"]+)"' --ref source2 --all --token headlines2

# Combine into template
open-tasks store "Source 1 Headlines:
{{headlines1}}

Source 2 Headlines:
{{headlines2}}" --token combined-template

open-tasks replace "{{combined-template}}" --ref combined-template --ref headlines1 --ref headlines2 --token all-headlines

# Generate comprehensive summary
open-tasks ai-cli "Analyze these headlines from multiple sources. What are the common themes? Provide a balanced summary." --ref all-headlines --token final-summary
```

### Domain-Specific News Summary

Filter and summarize news for a specific domain:

```bash
# Fetch tech news
open-tasks powershell "Invoke-RestMethod 'https://newsapi.org/v2/everything?q=technology&apiKey=YOUR_API_KEY'" --token tech-news

# Extract articles about AI
open-tasks extract '"title":"([^"]*(?:AI|artificial intelligence|machine learning)[^"]*)"' --ref tech-news --all --token ai-articles

# Summarize AI-related news
open-tasks ai-cli "Create a summary of AI developments based on these headlines" --ref ai-articles --token ai-summary
```

---

## Log Analysis Workflow

Analyze application logs to identify issues.

### Extract Error Messages

```bash
# Load log file
open-tasks load ./app.log --token logs

# Extract error messages
open-tasks extract "ERROR: (.+)" --ref logs --all --token errors

# Extract timestamps of errors
open-tasks extract "(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})" --ref errors --all --token timestamps

# Generate summary
open-tasks replace "Found errors at:
{{timestamps}}" --ref timestamps --token error-summary
```

### Analyze Error Patterns

```bash
# Load log file
open-tasks load ./application.log --token logs

# Extract all errors
open-tasks extract "ERROR.*" --ref logs --all --token errors

# Ask AI to analyze patterns
open-tasks ai-cli "Analyze these error messages. What are the common patterns? What might be the root cause?" --ref errors --token error-analysis
```

---

## Documentation Generation Workflow

Generate documentation from source code.

### Extract Function Documentation

```bash
# Load source code
open-tasks load ./src/api.ts --token source

# Extract function signatures
open-tasks extract "export function ([a-zA-Z]+)\([^)]*\)" --ref source --all --token functions

# Generate documentation stub
open-tasks replace "# API Documentation

## Functions

{{functions}}" --ref functions --token docs-template

# Ask AI to enhance
open-tasks ai-cli "Create detailed API documentation for these functions" --ref source --token api-docs
```

### Generate README from Code

```bash
# Load main files
open-tasks load ./src/index.ts --token main
open-tasks load ./package.json --token package

# Extract exports
open-tasks extract "export \{([^}]+)\}" --ref main --all --token exports

# Generate README
open-tasks ai-cli "Create a README.md for this package. Include installation, usage, and API reference based on the code." --ref main --ref package --token readme
```

---

## Data Transformation Pipeline

Transform data through multiple steps.

### CSV to JSON Transformation

```bash
# Load CSV data
open-tasks load ./data.csv --token raw

# Extract first column (names)
open-tasks extract "^([^,]+)," --ref raw --all --token names

# Extract second column (emails)
open-tasks extract ",[^,]+,([^,]+@[^,]+)," --ref raw --all --token emails

# Create JSON template
open-tasks store '[
  {"name": "{{names}}", "email": "{{emails}}"}
]' --token json-template

# Replace to create JSON (simplified - actual implementation would need more sophisticated handling)
open-tasks replace "{{json-template}}" --ref json-template --ref names --ref emails --token json-output
```

---

## API Integration Workflow

Work with external APIs and process responses.

### Fetch and Transform API Data

```bash
# Fetch data from API
open-tasks powershell "Invoke-RestMethod 'https://api.github.com/repos/microsoft/vscode'" --token repo-data

# Extract specific fields
open-tasks extract '"full_name":"([^"]+)"' --ref repo-data --token repo-name
open-tasks extract '"stargazers_count":([0-9]+)' --ref repo-data --token stars
open-tasks extract '"language":"([^"]+)"' --ref repo-data --token language

# Create formatted report
open-tasks replace "Repository Report:
- Name: {{repo-name}}
- Stars: {{stars}}
- Language: {{language}}" --ref repo-name --ref stars --ref language --token report
```

### Chain API Calls

```bash
# Get user data
open-tasks powershell "Invoke-RestMethod 'https://api.github.com/users/octocat'" --token user

# Extract repos URL
open-tasks extract '"repos_url":"([^"]+)"' --ref user --token repos-url

# Fetch repos (using extracted URL)
# Note: This requires a more advanced task that can use the extracted value dynamically
open-tasks powershell "Invoke-RestMethod '{{repos-url}}'" --ref repos-url --token repos

# Analyze repos
open-tasks ai-cli "Analyze this user's repositories. What are their main areas of interest?" --ref repos --token analysis
```

---

## Configuration Management

Manage configuration files and templates.

### Environment-Specific Config

```bash
# Load template config
open-tasks load ./config.template.json --token template

# Define environment variables
open-tasks store "postgres://prod-server/db" --token db-url
open-tasks store "prod-api-key-123" --token api-key

# Generate production config
open-tasks replace "{{template}}" --ref template --ref db-url --ref api-key --token prod-config
```

### Validate Configuration

```bash
# Load config file
open-tasks load ./config.json --token config

# Extract all environment variables referenced
open-tasks extract "\$\{([^}]+)\}" --ref config --all --token env-vars

# Check which are undefined
open-tasks ai-cli "Here are the environment variables required. Which standard ones are missing?" --ref env-vars --token validation
```

---

## Testing Workflow

Generate and manage test cases.

### Generate Test Cases

```bash
# Load source code
open-tasks load ./src/calculator.ts --token source

# Extract function signatures
open-tasks extract "export function ([a-zA-Z]+)\([^)]*\)" --ref source --all --token functions

# Generate test cases
open-tasks ai-cli "Generate comprehensive unit test cases for these functions. Include edge cases and error scenarios." --ref source --token test-cases
```

### Analyze Test Coverage

```bash
# Load test file
open-tasks load ./tests/api.test.ts --token tests

# Load source file
open-tasks load ./src/api.ts --token source

# Analyze coverage
open-tasks ai-cli "Compare these test cases with the source code. What functionality is not tested?" --ref tests --ref source --token coverage-analysis
```

---

## Build Automation

Automate build and release processes.

### Generate Release Notes

```bash
# Get version from package.json
open-tasks load ./package.json --token package
open-tasks extract '"version": "([^"]+)"' --ref package --token version

# Get git log since last tag
open-tasks powershell "git log $(git describe --tags --abbrev=0)..HEAD --oneline" --token commits

# Generate release notes
open-tasks ai-cli "Create release notes for version {{version}} based on these commits" --ref version --ref commits --token release-notes
```

### Update Changelog

```bash
# Get current version
open-tasks load ./package.json --token package
open-tasks extract '"version": "([^"]+)"' --ref package --token version

# Load existing changelog
open-tasks load ./CHANGELOG.md --token changelog

# Create new entry template
open-tasks replace "## [{{version}}] - $(Get-Date -Format 'yyyy-MM-dd')

### Added
- Feature 1
- Feature 2

{{changelog}}" --ref version --ref changelog --token updated-changelog
```

---

## Next Steps

These examples show the power of chaining commands together. To create your own workflows:

- **[Building Custom Tasks](./Building-Custom-Tasks.md)** - Learn how to organize commands into reusable tasks
- **[Building Custom Commands](./Building-Custom-Commands.md)** - Create custom commands for your specific needs
- **[Commands](./Commands.md)** - Full reference of all available commands
- **[Architecture](./Architecture.md)** - Understand how the system works

---

**Pro Tip:** Save frequently used workflows as shell scripts or create custom tasks for one-command execution!
