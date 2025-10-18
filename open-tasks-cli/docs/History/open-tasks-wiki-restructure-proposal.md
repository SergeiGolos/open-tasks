# Open-Tasks Wiki Restructure and Update Proposal

## Executive Summary

The current `open-tasks-wiki/` folder contains documentation that is **significantly out of sync** with the actual implementation. The wiki describes a conceptual framework and preliminary specifications, while the actual codebase is a **mature, production-ready CLI tool** with sophisticated workflow processing, advanced transforms, comprehensive testing, and modern build infrastructure.

This proposal outlines a complete reorganization and update of the wiki to accurately reflect the current implementation while maintaining clarity for users and developers.

## Current State Analysis

### What's Actually Implemented ✅

**Core Infrastructure:**
- Complete CLI framework with 8 built-in commands
- Sophisticated workflow processing with metadata tracking
- Advanced transform system (Split, Join, RegexMatch, TokenReplace, Extract)
- YAML frontmatter metadata in output files
- Comprehensive testing infrastructure (unit, integration, E2E)
- Production-ready build system with TypeScript and ES modules
- Configuration management with hierarchical settings
- PowerShell and AI CLI integration
- Extensible command discovery system
- Reference management with UUIDs and tokens

**Directory Structure:**
```
open-tasks-cli/
├── src/
│   ├── commands/           # Built-in CLI commands
│   ├── workflow/          # Workflow processing system
│   ├── types/             # TypeScript definitions
│   └── core/              # Core framework
├── test/                  # Comprehensive test suite
└── dist/                  # Built CLI output
```

**Built-in Commands:**
1. `store` - Store values with reference tracking
2. `load` - Load file content into references
3. `replace` - Template substitution with `{{token}}` patterns
4. `extract` - Regex extraction with capture groups
5. `split` - Split text into multiple outputs
6. `join` - Join multiple references into single output
7. `powershell` - Execute PowerShell with token substitution
8. `ai-cli` - Integrate with external AI CLI tools
9. `init` - Initialize project structure
10. `create` - Scaffold custom command templates

### What's Documented in Wiki ❌

**Outdated Concepts:**
- Describes "task composition architecture" that doesn't match the actual CLI command structure
- References `TaskHandler` and `ICommand` interfaces that are internal workflow processing APIs
- Documents "pre-built commands" as internal workflow commands, not CLI commands
- Missing documentation of the actual CLI commands that users interact with
- No coverage of advanced transforms (Split, Join, RegexMatch)
- No documentation of YAML metadata system
- Missing information about testing framework
- No coverage of modern build system and ES modules

**Architectural Misalignment:**
- Wiki describes three-layer architecture (Context API, Tasks, Commands)
- Actual implementation is CLI-first with workflow processing as internal system
- Wiki focuses on task creation in `.open-tasks/tasks/`
- Actual implementation uses `.open-tasks/commands/` for custom commands
- Missing documentation of command discovery and auto-loading

## Identified Gaps and Issues

### 1. **Command Documentation Gap**
- **Issue**: Wiki describes theoretical "pre-built commands" but doesn't document the actual 8+ CLI commands
- **Impact**: Users cannot discover or use the CLI effectively
- **Evidence**: `Process-Functions.md` describes internal workflow commands, not CLI commands

### 2. **Architecture Misrepresentation**
- **Issue**: Wiki suggests users create "tasks" when actual workflow is CLI commands → custom commands
- **Impact**: Developer confusion and incorrect expectations
- **Evidence**: `Building-Custom-Tasks.md` describes task creation process that doesn't match actual implementation

### 3. **Missing Modern Features**
- **Issue**: No documentation of transforms, metadata, testing, build system
- **Impact**: Advanced features are undiscoverable
- **Evidence**: No mention of Split/Join commands, YAML frontmatter, comprehensive test suite

### 4. **Installation and Setup Issues**
- **Issue**: Installation instructions reference non-existent npm package
- **Impact**: Users cannot install the tool
- **Evidence**: `Installation.md` assumes published npm package

## Proposed New Structure

### Reorganized Wiki Structure

```
open-tasks-wiki/
├── README.md                    # Updated overview and quick start
├── Installation.md              # Corrected installation instructions
├── Getting-Started.md           # Updated for actual CLI workflow
├── User-Guide/
│   ├── CLI-Commands.md          # Complete command reference
│   ├── Command-Chaining.md      # How to chain commands effectively
│   ├── Reference-Management.md  # Tokens, UUIDs, and reference lifecycle
│   ├── Configuration.md         # Configuration options and hierarchy
│   ├── AI-Integration.md        # AI CLI setup and usage
│   └── Common-Patterns.md       # Workflow patterns and examples
├── Developer-Guide/
│   ├── Custom-Commands.md       # Creating custom CLI commands
│   ├── Workflow-Processing.md   # Internal workflow system (advanced)
│   ├── Testing.md               # Testing framework and practices
│   ├── Build-System.md          # Build and development setup
│   └── Contributing.md          # Development contribution guide
├── Advanced/
│   ├── Transform-Commands.md    # Split, Join, RegexMatch, etc.
│   ├── Metadata-System.md       # YAML frontmatter and tracking
│   ├── Architecture.md          # Updated technical architecture
│   └── API-Reference.md         # Complete API documentation
├── Examples/
│   ├── Workflow-Examples.md     # Real-world workflow examples
│   ├── Integration-Examples.md  # AI, PowerShell, file processing
│   └── Custom-Command-Examples.md # Custom command examples
└── Troubleshooting.md           # Common issues and solutions
```

## Detailed Content Updates

### 1. **README.md** - Complete Rewrite
- Remove speculative "project status" language
- Focus on what's actually implemented
- Update quick start to use actual commands
- Realistic feature descriptions
- Link to working examples

### 2. **Installation.md** - Major Corrections
- Remove npm package installation (not published)
- Focus on local development setup
- Build from source instructions
- Development environment setup
- Prerequisites for development

### 3. **Getting-Started.md** - Updated Workflow
- Start with actual CLI commands (`store`, `load`, `replace`)
- Real working examples
- Correct directory structure
- Actual output format descriptions

### 4. **New: CLI-Commands.md**
Complete reference for all implemented commands:
- **Core Commands**: `store`, `load`, `replace`, `extract`
- **Transform Commands**: `split`, `join`, `regex-match`, `token-replace`
- **System Commands**: `powershell`, `ai-cli`, `init`, `create`
- Syntax, examples, and use cases for each

### 5. **New: Custom-Commands.md**
Correct process for creating custom commands:
- Use `.open-tasks/commands/` directory (not `tasks/`)
- Extend `CommandHandler` base class
- Command discovery and auto-loading
- Real examples that work with current implementation

### 6. **New: Transform-Commands.md**
Documentation of advanced transform system:
- SplitCommand: Split text into multiple outputs
- JoinCommand: Combine multiple references
- RegexMatchCommand: Pattern matching with formatted output
- TokenReplaceCommand: Variable substitution
- Metadata tracking and YAML frontmatter

### 7. **Updated: Architecture.md**
Reflect actual implementation:
- CLI-first architecture
- Command discovery system
- Reference management
- Workflow processing as internal system
- Modern build system and testing

### 8. **New: Testing.md**
Comprehensive testing documentation:
- Unit tests with Vitest
- Integration tests
- E2E workflow testing
- Mock testing patterns
- Test coverage and practices

## Content Migration Plan

### Phase 1: Critical Updates (Week 1)
1. Update README.md with accurate overview
2. Fix Installation.md for development setup
3. Rewrite Getting-Started.md with actual CLI workflow
4. Create CLI-Commands.md with complete command reference

### Phase 2: Structure Reorganization (Week 2)
1. Create new directory structure
2. Migrate existing content to appropriate locations
3. Update internal links and references
4. Remove outdated/inaccurate content

### Phase 3: Advanced Content (Week 3)
1. Document transform commands and metadata system
2. Create custom command development guide
3. Add testing and build system documentation
4. Create comprehensive examples and tutorials

### Phase 4: Polish and Review (Week 4)
1. Review all content for accuracy
2. Add screenshots and real examples
3. Internal consistency checks
4. Final review and testing

## Key Changes Summary

### From Current Wiki → Proposed Wiki

**Architecture Description:**
- **Before**: Three-layer task composition architecture
- **After**: CLI-first with workflow processing as internal system

**Command Documentation:**
- **Before**: Theoretical pre-built workflow commands
- **After**: Actual CLI commands with real examples

**Development Workflow:**
- **Before**: Create tasks in `.open-tasks/tasks/`
- **After**: Create commands in `.open-tasks/commands/`

**Feature Coverage:**
- **Before**: Basic command chaining
- **After**: Advanced transforms, metadata, testing, AI integration

**Installation:**
- **Before**: npm package installation
- **After**: Development setup from source

## Success Metrics

### Immediate Indicators
- Users can successfully install and run the CLI following documentation
- All documented commands work as described
- Examples produce expected output

### Long-term Indicators
- Reduced confusion in issue reports
- More community contributions
- Better user onboarding experience
- Accurate developer expectations

## Risk Mitigation

### Technical Risks
- **Risk**: Documentation becomes outdated again
- **Mitigation**: Include content validation in CI/CD pipeline
- **Risk**: Examples break with implementation changes
- **Mitigation**: Automated testing of documentation examples

### Content Risks
- **Risk**: Incomplete migration of useful information
- **Mitigation**: Content audit and mapping before changes
- **Risk**: Broken internal links
- **Mitigation**: Link validation and testing

## Implementation Timeline

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 1 | Critical content updates | Updated README, Installation, Getting Started, CLI Commands |
| 2 | Structure reorganization | New directory structure, content migration |
| 3 | Advanced documentation | Transforms, custom commands, testing, examples |
| 4 | Review and polish | Final review, validation, publication |

## Conclusion

The current wiki significantly misrepresents the actual implementation, creating confusion for users and developers. This reorganization proposal aligns the documentation with the mature, production-ready CLI tool that has been implemented, while maintaining clarity and usefulness for all stakeholders.

The proposed structure provides:
- **Accurate representation** of the actual implementation
- **Clear separation** between user and developer documentation
- **Comprehensive coverage** of all features and capabilities
- **Practical examples** that work with the current codebase
- **Sustainable maintenance** through clear organization and validation

This restructure will transform the wiki from a theoretical specification into practical documentation that enables users to effectively leverage the sophisticated Open Tasks CLI tool.