# Output Targets Guide

This guide explains how to control where command output is written using output target flags.

## Overview

By default, open-tasks-cli writes output to **both** the terminal screen and log files. You can control this behavior using output target flags.

| Target | Flag | Description |
|--------|------|-------------|
| **both** | `--both` (default) | Output to screen AND log files |
| **screen-only** | `--screen-only` | Output only to terminal |
| **log-only** | `--log-only` | Output only to log files |
| **file** | `--file <path>` | Output to custom file path |

## Output Target Details

### Both (Default)

**Flag:** `--both` (explicit) or no flag

**Behavior:** Output goes to both terminal and log files

**Default Location:** `.open-tasks/outputs/{timestamp}-{command}/`

**Example:**
```bash
$ open-tasks store "Hello World" --token greeting
✓ store completed in 45ms
📁 Saved to: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference: @greeting

# Output appears on screen AND written to:
# - .open-tasks/outputs/20241018-130145-store/output.txt
# - .open-tasks/outputs/20241018-130145-store/console.log
```

**When to Use:**
- **Normal usage** (this is the default)
- **Keeping records** of command execution
- **Debugging later** by reviewing log files
- **Audit trails** for important operations

**Log Files Created:**
- `output.txt` - Primary command output/result
- `console.log` - Console output (what you see on screen)
- `metadata.json` - Command metadata (optional)

---

### Screen Only

**Flag:** `--screen-only`

**Behavior:** Output only appears in terminal, no log files created

**Example:**
```bash
$ open-tasks store "Hello World" --token greeting --screen-only
✓ store completed in 45ms
🔗 Reference: @greeting

# No files created in .open-tasks/outputs/
# Reference still works via in-memory storage
```

**When to Use:**
- **Temporary operations** you don't need to keep
- **Reducing disk usage** for frequent commands
- **Private/sensitive data** you don't want logged
- **Testing commands** during development

**Characteristics:**
- Fastest operation (no file I/O)
- No disk space used
- References work within same session
- Output not recoverable after command ends

**Example Session:**
```bash
# Quick test without creating files
$ open-tasks store "test data" --token test --screen-only
✓ store completed in 15ms
🔗 Reference: @test

# Reference works in same session
$ open-tasks load --ref test --screen-only
test data

# But no files exist
$ ls .open-tasks/outputs/
# (empty or only other commands)
```

---

### Log Only

**Flag:** `--log-only`

**Behavior:** Output written to log files only, nothing shown in terminal

**Example:**
```bash
$ open-tasks store "Hello World" --token greeting --log-only
# (no output on screen)

$ echo $?
0

# But files are created:
$ cat .open-tasks/outputs/20241018-130145-store/output.txt
Hello World

$ cat .open-tasks/outputs/20241018-130145-store/console.log
✓ store completed in 45ms
📁 Saved to: .open-tasks/outputs/20241018-130145-store/output.txt
🔗 Reference: @greeting
```

**When to Use:**
- **Background processes** that shouldn't clutter terminal
- **Cron jobs** where output goes to logs
- **Silent operations** in scripts
- **Accumulating logs** for later batch review

**Characteristics:**
- Terminal stays clean
- All output preserved in files
- Good for automation
- Can review output later

**Example Script:**
```bash
#!/bin/bash
# Process multiple files silently, log everything

for file in *.txt; do
  echo "Processing $file..."
  open-tasks process "$file" --log-only
done

echo "All files processed. Check .open-tasks/outputs/ for details."
```

---

### Custom File

**Flag:** `--file <path>`

**Behavior:** Output written to specified file path

**Example:**
```bash
$ open-tasks store "Hello World" --token greeting --file /tmp/my-output.log
# Output written to /tmp/my-output.log instead of default location
```

**When to Use:**
- **Custom logging directory** for organization
- **Specific file naming** requirements
- **Integration** with other tools expecting specific paths
- **Network drives** or shared locations

**Characteristics:**
- Full control over output location
- Parent directories must exist (or be created)
- Overwrites existing file
- Path validation prevents directory traversal

**Security:** Path validation prevents malicious paths like `../../etc/passwd`

**Example with Custom Paths:**
```bash
# Organize by project
$ mkdir -p logs/project-a
$ open-tasks store "data" --file logs/project-a/store-$(date +%Y%m%d).log

# Shared location
$ open-tasks process bigfile.csv --file /mnt/shared/processing.log

# Temp location
$ open-tasks temp-operation --file /tmp/op-$$.log
```

## Combining with Verbosity

Output targets work independently of verbosity levels. You can combine them:

```bash
# Quiet output, screen only
$ open-tasks store "data" --quiet --screen-only

# Verbose output, log only (detailed logs, clean terminal)
$ open-tasks store "data" --verbose --log-only

# Stream mode, custom file (real-time progress to file)
$ open-tasks long-operation --stream --file progress.log
```

## Common Patterns

### Pattern 1: Development vs Production

```bash
# Development: see output, don't clutter disk
$ open-tasks mycommand --screen-only

# Production: log everything, quiet terminal
$ open-tasks mycommand --log-only --quiet
```

### Pattern 2: Debugging with Full Logs

```bash
# Run with verbose output to custom file
$ open-tasks mycommand --verbose --file debug-$(date +%Y%m%d-%H%M%S).log

# Review the debug log later
$ cat debug-20241018-130145.log
```

### Pattern 3: Silent Background Processing

```bash
# Process in background, log to file
$ open-tasks long-operation --log-only &

# Monitor the log file
$ tail -f .open-tasks/outputs/*/console.log
```

### Pattern 4: Accumulate Multiple Runs

```bash
# Append mode using custom file
$ for i in {1..10}; do
  open-tasks process "item-$i" --file batch-run.log
done

# Review all output together
$ cat batch-run.log
```

## File Structure

### Default Output (--both)

```
.open-tasks/outputs/
└── 20241018-130145-store/
    ├── output.txt          # Primary command result
    ├── console.log         # What appeared on screen
    └── metadata.json       # Command metadata (optional)
```

### Screen Only (--screen-only)

```
.open-tasks/outputs/
# (no files created)
```

### Log Only (--log-only)

```
.open-tasks/outputs/
└── 20241018-130145-store/
    ├── output.txt          # Primary command result
    └── console.log         # What would have appeared on screen
```

### Custom File (--file)

```
/path/to/custom/
└── my-output.log           # All output in specified file
```

## Environment Variable

Set default output target with `OPEN_TASKS_OUTPUT_TARGET`:

```bash
# Set default to screen-only
export OPEN_TASKS_OUTPUT_TARGET=screen-only

# All commands now use screen-only by default
$ open-tasks store "data"
# (no files created)

# Override with explicit flag if needed
$ open-tasks store "data" --log-only
# (creates log files)
```

**Supported values:**
- `both` (default if not set)
- `screen-only`
- `log-only`
- `file` (must also set `OPEN_TASKS_OUTPUT_FILE` path)

## Performance Considerations

| Target | Speed | Disk Usage | Recovery |
|--------|-------|------------|----------|
| `--screen-only` | Fastest | None | ✗ |
| `--log-only` | Fast | Medium | ✓ |
| `--both` | Normal | High | ✓ |
| `--file` | Normal | Low | ✓ |

### Benchmarks

```bash
# Screen only (no I/O)
$ time open-tasks store "data" --screen-only
real    0m0.045s

# Log only (write once)
$ time open-tasks store "data" --log-only
real    0m0.067s

# Both (write twice)
$ time open-tasks store "data" --both
real    0m0.089s
```

**Recommendation:** Use `--screen-only` for development and frequent operations, `--both` for production.

## Security Considerations

### Path Validation

The `--file` flag validates paths to prevent security issues:

```bash
# Safe paths
$ open-tasks store "data" --file /tmp/output.log       # ✓ OK
$ open-tasks store "data" --file logs/output.log       # ✓ OK
$ open-tasks store "data" --file ./output.log          # ✓ OK

# Blocked paths
$ open-tasks store "data" --file ../../etc/passwd      # ✗ Blocked
$ open-tasks store "data" --file /etc/shadow           # ✗ Blocked (permissions)
```

### Path Validation Rules

1. ✓ **Relative paths** within project are allowed
2. ✓ **Absolute paths** in `/tmp`, `/var/log`, user directories are allowed
3. ✗ **Directory traversal** (`../`) is blocked
4. ✗ **System paths** (`/etc`, `/sys`, etc.) require appropriate permissions

### Sensitive Data

Be mindful when logging sensitive data:

```bash
# Screen only for sensitive operations
$ open-tasks process-secrets --screen-only

# Or use custom file with restricted permissions
$ touch sensitive.log
$ chmod 600 sensitive.log
$ open-tasks process-secrets --file sensitive.log
```

## Troubleshooting

### Issue: Files not created with --both

**Check:**
1. Disk space available
2. Permissions on `.open-tasks/outputs/` directory
3. Directory exists (`open-tasks init` to create)

```bash
$ df -h .                    # Check disk space
$ ls -ld .open-tasks/outputs # Check permissions
```

### Issue: --file path not working

**Check:**
1. Parent directory exists
2. Write permissions
3. Not using directory traversal (`../`)

```bash
# Create parent directories first
$ mkdir -p logs/subdir
$ open-tasks store "data" --file logs/subdir/output.log
```

### Issue: Can't find log files

**Default location:**
```bash
$ ls -lt .open-tasks/outputs/ | head
```

**Find recent logs:**
```bash
$ find .open-tasks/outputs -name "console.log" -mmin -60
```

**Search logs:**
```bash
$ grep -r "error" .open-tasks/outputs/*/console.log
```

## Best Practices

1. **Use `--screen-only` for development** - Faster, cleaner
2. **Use `--both` for production** - Keeps audit trail
3. **Use `--log-only` for cron jobs** - Silent operation
4. **Use `--file` for integration** - Custom log locations
5. **Combine with `--verbose`** - Detailed logs, clean terminal
6. **Clean old logs periodically** - Prevent disk usage issues

```bash
# Clean logs older than 7 days
$ find .open-tasks/outputs -type d -mtime +7 -exec rm -rf {} +
```

## See Also

- [Verbosity Levels Guide](./Verbosity-Levels.md)
- [Output Control API Reference](./Output-Control-API.md)
- [Migration Guide](./Migration-Guide.md)
- [CLI Reference](./CLI-Reference.md)
