# Verbosity Levels Guide

This guide explains the four verbosity levels available in open-tasks-cli and when to use each one.

## Overview

Open-tasks-cli supports four verbosity levels that control how much detail commands output:

| Level | Flag | Default | Use Case |
|-------|------|---------|----------|
| **quiet** | `--quiet`, `-q` | No | Scripts, automation, minimal output |
| **summary** | `--summary`, `-s` | **Yes** | Normal interactive usage |
| **verbose** | `--verbose`, `-v` | No | Debugging, detailed diagnostics |
| **stream** | `--stream` | No | Real-time progress, long operations |

## Verbosity Level Details

### Quiet Mode (`--quiet`, `-q`)

**Purpose:** Minimal output for scripts and automation

**What's Shown:**
- ✓ Single-line status message only
- ✗ No sections, no progress, no metadata

**Example:**
```bash
$ open-tasks store "Hello World" --token greeting --quiet
✓ store completed in 45ms
```

**When to Use:**
- **Shell scripts** that parse command output
- **CI/CD pipelines** where verbose output clutters logs
- **Automated tasks** where only success/failure matters
- **Cron jobs** that should stay quiet unless they fail

**Characteristics:**
- Returns exit code 0 on success, non-zero on failure
- Error messages still appear on stderr
- Can be captured and parsed easily

**Example Script:**
```bash
#!/bin/bash
# Store data and check if it succeeded

if open-tasks store "$DATA" --token mydata --quiet; then
  echo "Data stored successfully"
  # Continue with next step
else
  echo "Failed to store data" >&2
  exit 1
fi
```

---

### Summary Mode (`--summary`, `-s`) — DEFAULT

**Purpose:** Clean, readable output for interactive usage

**What's Shown:**
- ✓ Command status and execution time
- ✓ Output file paths
- ✓ Reference tokens for chaining
- ✗ No detailed sections or progress

**Example:**
```bash
$ open-tasks store "Hello World" --token greeting
✓ store completed in 45ms
📁 Saved to: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference: @greeting
```

**When to Use:**
- **Normal command-line usage** (this is the default)
- **Interactive sessions** where you want clean, readable output
- **Quick tasks** where you need just enough information
- **General purpose** work

**Characteristics:**
- Emojis and formatting for readability
- Shows important information without clutter
- Perfect balance of detail and brevity
- Default if no verbosity flag specified

**Example Usage:**
```bash
# Store data
$ open-tasks store "configuration data" --token config

# Load it back (summary shows what was loaded)
$ open-tasks load --ref config

# Chain commands (summary shows reference flow)
$ open-tasks store "input" --token in && open-tasks load --ref in
```

---

### Verbose Mode (`--verbose`, `-v`)

**Purpose:** Detailed diagnostics and debugging

**What's Shown:**
- ✓ All sections with detailed information
- ✓ Configuration and settings
- ✓ Processing details and metadata
- ✓ File information (size, timestamps)
- ✓ Complete execution summary
- ✗ No real-time progress (use stream for that)

**Example:**
```bash
$ open-tasks store "Hello World" --token greeting --verbose

Processing Details
──────────────────
Value Size: 11 characters (11 bytes)
Token: greeting
Reference ID: 550e8400-e29b-41d4-a716-446655440000

Output Details
──────────────
Directory: .open-tasks/outputs/20241018-130145-store
File: output.txt
Full Path: .open-tasks/outputs/20241018-130145-store/output.txt

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: store
⏱️  Duration: 45ms
📁 Output File: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference Token: @greeting
```

**When to Use:**
- **Debugging** command behavior or issues
- **Understanding** what a command does internally
- **Troubleshooting** when something doesn't work as expected
- **Learning** how the CLI works
- **Verification** that settings and configuration are correct

**Characteristics:**
- Organized into logical sections
- Shows all available metadata
- Includes file sizes, timestamps, paths
- More detail than summary, less noise than stream

**Example Debugging Session:**
```bash
# Something's not working, add --verbose to see what's happening
$ open-tasks load /path/to/file.txt --verbose

File Information
────────────────
Path: /path/to/file.txt
Size: 1.5 KB
Modified: 2024-10-18 13:01:45
Exists: true
Readable: true

Processing Details
──────────────────
Content Length: 1536 bytes
Lines: 42
Format: UTF-8 text

📊 Execution Summary
────────────────────────────────────────────────────────────────────────────────
✓ Command: load
⏱️  Duration: 12ms
📁 Output File: .open-tasks/outputs/20241018-130147-load/output.txt
```

---

### Stream Mode (`--stream`)

**Purpose:** Real-time progress for long-running operations

**What's Shown:**
- ✓ Real-time progress messages with timestamps
- ✓ Step-by-step operation updates
- ✓ Final summary at the end
- ✗ No buffering (output appears immediately)

**Example:**
```bash
$ open-tasks init --stream
[0ms] ⏳ Checking if .open-tasks directory exists...
[5ms] ⏳ Creating .open-tasks directory...
[12ms] ⏳ Creating commands subdirectory...
[18ms] ⏳ Creating outputs subdirectory...
[25ms] ⏳ Checking for package.json...
[30ms] ⏳ Writing package.json...
[45ms] ⏳ Writing .open-tasks/config.json...

[52ms] 📊 Summary
────────────────────────────────────────────────────────────────────────────────
✓ init completed in 52ms
📁 Saved to: .open-tasks/config.json
```

**When to Use:**
- **Long-running operations** (processing large files, network requests)
- **Batch processing** where you want to see progress
- **Interactive workflows** where immediate feedback is valuable
- **Monitoring** what a command is doing in real-time
- **Impatient users** who want to know something is happening

**Characteristics:**
- Timestamps show elapsed time for each step
- Progress appears immediately (not buffered)
- Useful for understanding command performance
- Builds logs are preserved in output

**Example with Long Operation:**
```bash
$ open-tasks process-large-file data.csv --stream
[0ms] ⏳ Opening file data.csv...
[150ms] ⏳ Reading file content (10 MB)...
[1250ms] ⏳ Parsing CSV data...
[2100ms] ⏳ Processing 100,000 rows...
[2500ms] ⏳ Row 25,000 processed...
[3000ms] ⏳ Row 50,000 processed...
[3500ms] ⏳ Row 75,000 processed...
[4000ms] ⏳ Row 100,000 processed...
[4200ms] ⏳ Writing output...
[4350ms] ⏳ Creating reference...

[4400ms] 📊 Summary
────────────────────────────────────────────────────────────────────────────────
✓ process-large-file completed in 4400ms
📁 Saved to: .open-tasks/outputs/20241018-130200-process/output.txt
🔗 Reference: @processed
```

## Choosing the Right Level

### Decision Tree

```
Are you writing a script/automation?
├─ Yes → Use --quiet
└─ No
   └─ Is this a long-running operation?
      ├─ Yes → Use --stream
      └─ No
         └─ Do you need debugging information?
            ├─ Yes → Use --verbose
            └─ No → Use default (summary)
```

### Comparison Table

| Feature | Quiet | Summary | Verbose | Stream |
|---------|-------|---------|---------|--------|
| Single-line status | ✓ | ✓ | ✓ | ✓ |
| Output file path | ✗ | ✓ | ✓ | ✓ |
| Reference token | ✗ | ✓ | ✓ | ✓ |
| Execution time | ✓ | ✓ | ✓ | ✓ |
| Detailed sections | ✗ | ✗ | ✓ | ✗ |
| Metadata display | ✗ | ✗ | ✓ | ✗ |
| Real-time progress | ✗ | ✗ | ✗ | ✓ |
| Timestamps | ✗ | ✗ | ✗ | ✓ |
| Buffered output | ✓ | ✓ | ✓ | ✗ |

## Common Patterns

### Pattern 1: Development vs Production

```bash
# During development: use verbose to understand behavior
$ open-tasks mycommand --verbose

# In production: use quiet for clean logs
$ open-tasks mycommand --quiet
```

### Pattern 2: Debugging Issues

```bash
# First try: summary (default)
$ open-tasks load data.txt

# Still confused? Add verbose
$ open-tasks load data.txt --verbose

# Need to see exact timing? Use stream
$ open-tasks load data.txt --stream
```

### Pattern 3: Script with Fallback

```bash
#!/bin/bash
# Try quiet first, use verbose on failure

if ! open-tasks mycommand --quiet; then
  echo "Command failed, running with verbose output:" >&2
  open-tasks mycommand --verbose
  exit 1
fi
```

### Pattern 4: Long Operation Monitoring

```bash
# Process large file with progress updates
$ open-tasks process bigfile.csv --stream | tee process.log

# Review timing after the fact
$ grep "⏳" process.log
```

## Environment Variable

You can set a default verbosity level using the `OPEN_TASKS_VERBOSITY` environment variable:

```bash
# Set default to verbose for debugging session
export OPEN_TASKS_VERBOSITY=verbose

# All commands now use verbose by default
$ open-tasks store "data"
# (shows verbose output)

# Override with explicit flag if needed
$ open-tasks store "data" --quiet
# (shows quiet output)
```

**Supported values:**
- `quiet`
- `summary` (default if not set)
- `verbose`
- `stream`

## Tips and Tricks

### 1. Combining with Output Routing

```bash
# Stream progress to screen, quiet summary to log
$ open-tasks mycommand --stream --log-only

# Verbose output to file for later review
$ open-tasks mycommand --verbose --file debug.log
```

### 2. Verbosity in Command Chains

```bash
# First command quiet, second verbose
$ open-tasks store "data" --token d --quiet && \
  open-tasks load --ref d --verbose
```

### 3. Grep-friendly Output

```bash
# Use quiet mode for grep
$ open-tasks mycommand --quiet | grep "✓"

# Or summary for more context
$ open-tasks mycommand | grep "Reference"
```

### 4. Progress Monitoring

```bash
# Watch progress in real-time with timestamps
$ open-tasks long-operation --stream | while read line; do
  echo "$(date '+%H:%M:%S') $line"
done
```

## See Also

- [Output Control API Reference](./Output-Control-API.md)
- [Output Targets Guide](./Output-Targets.md)
- [Migration Guide](./Migration-Guide.md)
- [CLI Reference](./CLI-Reference.md)
