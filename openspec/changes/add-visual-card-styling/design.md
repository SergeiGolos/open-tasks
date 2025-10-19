# Design Document: Add Visual Card Styling

**Change ID:** `add-visual-card-styling`  
**Created:** 2025-10-19

## Context

The `split-output-card-builders` change introduced ICardBuilder for command-controlled output formatting. Currently, cards render as plain text with simple divider lines. This change adds visual borders and styling using the `boxen` library to improve scannability and user experience.

**Stakeholders:**
- CLI users (better visual feedback)
- Command developers (easier to highlight important information)
- Framework maintainers (minimal changes to existing architecture)

**Constraints:**
- Must respect NO_COLOR environment variable (accessibility)
- Must work within terminal width limits
- Must not break existing card usage
- Must maintain performance (cards render quickly)

## Goals / Non-Goals

### Goals
1. Make cards visually distinct with borders
2. Support contextual styling (info, success, warning, error)
3. Maintain backward compatibility (optional style parameter)
4. Respect terminal constraints (width, color support)
5. Professional CLI aesthetic

### Non-Goals
1. Interactive or dynamic cards
2. Complex layouts or multi-column designs
3. Custom border characters (use boxen defaults)
4. Colored card content (only borders get color)
5. Configuration system (use sensible defaults)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Card Rendering Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Command                     VerboseCardBuilder                 │
│  ┌────────┐                 ┌──────────────────┐                │
│  │        │                 │                  │                │
│  │ addCard(title,           │  renderCard()    │                │
│  │         content,         │  ├─ Format content                │
│  │         style)  ────────>│  ├─ Get border style             │
│  │        │                 │  ├─ Get border color             │
│  │        │                 │  └─ Call boxen()                 │
│  └────────┘                 │                  │                │
│                             │  boxen()         │                │
│                             │  ├─ Add borders  │                │
│                             │  ├─ Add padding  │                │
│                             │  ├─ Add title    │                │
│                             │  └─ Respect width│                │
│                             │                  │                │
│                             │  Output          │                │
│                             │  ╭─ Title ────╮  │                │
│                             │  │  Content   │  │                │
│                             │  ╰────────────╯  │                │
│                             └──────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Decisions

### Decision 1: Use Boxen Library

**Options Considered:**
1. **Boxen** - High-level box API with padding, borders, titles
2. **cli-boxes** - Low-level border character sets
3. **terminal-kit** - Full terminal UI framework
4. **Manual** - Hand-code box drawing

**Choice:** Boxen

**Rationale:**
- Handles edge cases (padding, width, NO_COLOR) automatically
- Well-maintained, widely used
- Simple API matches our needs
- Moderate bundle size (~50KB)

**Trade-offs:**
- Additional dependency vs manual control
- Slightly larger bundle vs feature set
- **Accepted**: Convenience worth the dependency

### Decision 2: Optional Style Parameter

**Options Considered:**
1. **Required style** - Force all cards to declare style
2. **Optional style** - Default to plain/unstyled
3. **Global config** - Set style globally for all cards
4. **Auto-detect** - Infer style from content

**Choice:** Optional style parameter with 'default' fallback

**API:**
```typescript
interface ICardBuilder {
  addCard(title: string, content: CardContent, style?: CardStyle): void;
}

type CardStyle = 'info' | 'success' | 'warning' | 'error' | 'dim' | 'default';
```

**Rationale:**
- Backward compatible (existing calls work)
- Explicit control (no magic)
- Flexible (can mix styled and unstyled)

**Trade-offs:**
- More verbose vs automatic
- **Accepted**: Explicit better than implicit

### Decision 3: Border Styles and Colors

**Mapping:**
```typescript
const BORDER_STYLES = {
  info: { borderStyle: 'round', borderColor: 'blue' },
  success: { borderStyle: 'round', borderColor: 'green' },
  warning: { borderStyle: 'round', borderColor: 'yellow' },
  error: { borderStyle: 'round', borderColor: 'red' },
  dim: { borderStyle: 'round', borderColor: 'gray', dimBorder: true },
  default: { borderStyle: 'round' } // No color
};
```

**Rationale:**
- Round borders = modern aesthetic
- Colors match existing formatter conventions (success=green, error=red)
- Default = no color (respects current behavior)
- Dim = secondary information

**Trade-offs:**
- Fixed styles vs customizable
- **Accepted**: Consistency over flexibility for v1

### Decision 4: NO_COLOR Handling

**Strategy:**
```typescript
function renderCard(title: string, content: CardContent, style?: CardStyle): string {
  const options = {
    ...this.getStyleOptions(style),
    borderStyle: process.env.NO_COLOR ? 'single' : 'round'
  };
  
  // Remove color options if NO_COLOR is set
  if (process.env.NO_COLOR) {
    delete options.borderColor;
  }
  
  return boxen(content, options);
}
```

**Rationale:**
- NO_COLOR spec compliance
- Falls back to ASCII-safe 'single' border style
- Maintains structure without color

**Trade-offs:**
- Automatic vs manual control
- **Accepted**: Automatic detection simpler

### Decision 5: Terminal Width Awareness

**Strategy:**
```typescript
import terminalSize from 'terminal-size';

function renderCard(title: string, content: CardContent, style?: CardStyle): string {
  const { columns } = terminalSize();
  const maxWidth = Math.min(columns - 4, 120); // Cap at 120 chars
  
  return boxen(content, {
    ...options,
    width: maxWidth
  });
}
```

**Rationale:**
- Prevents card overflow
- Adapts to terminal size
- Caps at 120 for readability

**Trade-offs:**
- Dynamic vs fixed width
- **Accepted**: Dynamic better for varied terminals

## Implementation Details

### File Changes

#### 1. `package.json`
```json
{
  "dependencies": {
    "boxen": "^8.0.1"
  }
}
```

#### 2. `src/types.ts`
```typescript
// Add CardStyle type
export type CardStyle = 'info' | 'success' | 'warning' | 'error' | 'dim' | 'default';

// Update ICardBuilder interface
export interface ICardBuilder {
  addProgress(message: string): void;
  addCard(title: string, content: CardContent, style?: CardStyle): void;
  build(): string;
}
```

#### 3. `src/card-builders.ts`
```typescript
import boxen from 'boxen';

export class VerboseCardBuilder implements ICardBuilder {
  private cards: Array<{ title: string; content: CardContent; style?: CardStyle }> = [];

  addCard(title: string, content: CardContent, style?: CardStyle): void {
    this.cards.push({ title, content, style });
  }

  build(): string {
    return this.cards
      .map(({ title, content, style }) => this.renderCard(title, content, style))
      .join('\n\n');
  }

  private renderCard(title: string, content: CardContent, style?: CardStyle): string {
    const formatted = this.formatContent(content);
    const options = this.getBoxenOptions(title, style);
    return boxen(formatted, options);
  }

  private getBoxenOptions(title: string, style?: CardStyle) {
    const baseOptions = {
      title: title,
      titleAlignment: 'left' as const,
      padding: 1,
    };

    const styleOptions = this.getStyleOptions(style || 'default');
    
    // Handle NO_COLOR
    if (process.env.NO_COLOR) {
      return {
        ...baseOptions,
        borderStyle: 'single' as const,
      };
    }

    return { ...baseOptions, ...styleOptions };
  }

  private getStyleOptions(style: CardStyle) {
    const styles = {
      info: { borderStyle: 'round' as const, borderColor: 'blue' as const },
      success: { borderStyle: 'round' as const, borderColor: 'green' as const },
      warning: { borderStyle: 'round' as const, borderColor: 'yellow' as const },
      error: { borderStyle: 'round' as const, borderColor: 'red' as const },
      dim: { borderStyle: 'round' as const, borderColor: 'gray' as const, dimBorder: true },
      default: { borderStyle: 'round' as const },
    };

    return styles[style] || styles.default;
  }

  private formatContent(content: CardContent): string {
    // Existing implementation (renderTable, renderList, renderTree, JSON.stringify)
    // ... unchanged ...
  }
}
```

#### 4. `src/commands/store.ts` (Example Update)
```typescript
protected async executeCommand(
  args: StoreArgs,
  refs: Record<string, MemoryRef>,
  context: ExecutionContext,
  cardBuilder: ICardBuilder
): Promise<CommandResult> {
  // Use styled card
  cardBuilder.addCard('⚙️ Processing Details', {
    'Value Length': value.length,
    'Size': formatFileSize(Buffer.byteLength(value)),
    'Token': args.token,
    'Reference ID': ref.id.substring(0, 8),
    'Output File': path.basename(ref.outputFile || ''),
  }, 'info'); // <-- Add style parameter

  return { refs: [ref], exitCode: 0 };
}
```

## Migration Plan

### Phase 1: Infrastructure (v0.1)
**Changes:**
- Add boxen to package.json
- Add CardStyle type to types.ts
- Update ICardBuilder.addCard signature (optional style param)
- NO changes to VerboseCardBuilder yet (validate API change only)

**Validation:**
```bash
npm install
npm run build
# Existing tests pass
# No visual changes yet
```

**Risk:** Low - only type changes, backward compatible

### Phase 2: Visual Rendering (v0.2)
**Changes:**
- Implement renderCard with boxen in VerboseCardBuilder
- Add getBoxenOptions, getStyleOptions helpers
- Add NO_COLOR handling
- Keep default style = 'default' (no color)

**Validation:**
```bash
npm run build
npm run dev-deploy
open-tasks store "test" --token test --verbose
# Cards show borders (no color yet)

NO_COLOR=1 open-tasks store "test" --token test --verbose
# Cards show ASCII borders
```

**Risk:** Medium - visual changes, could affect terminal compatibility

### Phase 3: Styled Examples (v0.3)
**Changes:**
- Update StoreCommand to use 'info' style
- Add examples to other commands (LoadCommand, etc.)
- Add visual regression tests

**Validation:**
```bash
open-tasks store "test" --token test --verbose
# Card shows blue border

open-tasks store "error" --token err --verbose
# (Hypothetical error card) Shows red border
```

**Risk:** Low - isolated to command implementations

### Phase 4: Documentation (v0.4)
**Changes:**
- Update Output-Control-API.md with card styling examples
- Add visual examples to README
- Update example-command.ts template

**Validation:** Review docs for accuracy

**Risk:** Low - documentation only

## Risks & Mitigation

### Risk 1: Terminal Compatibility
**Impact:** Medium - Some terminals may not support box-drawing characters  
**Likelihood:** Low - Most modern terminals support Unicode  
**Mitigation:**
- NO_COLOR detection falls back to ASCII
- Test on Windows CMD, PowerShell, WSL, Linux terminal, macOS Terminal

### Risk 2: Performance Impact
**Impact:** Low - Cards render ~1-2ms slower  
**Likelihood:** Medium - Boxen adds processing  
**Mitigation:**
- Only affects verbose mode (opt-in)
- Cards are built once at end of command
- Acceptable for improved UX

### Risk 3: Bundle Size
**Impact:** Low - ~50KB increase  
**Likelihood:** High - boxen has dependencies  
**Mitigation:**
- Acceptable for CLI tool (not browser bundle)
- Users install globally, size less critical

### Risk 4: Breaking Changes
**Impact:** High if broken - Commands fail to compile  
**Likelihood:** Low - style parameter is optional  
**Mitigation:**
- Make style parameter optional
- Default to 'default' (current behavior)
- Extensive testing before release

## Open Questions & Decisions Needed

### Q1: Should we add terminal-size dependency?
**Current:** Hard-coded width limits  
**Proposal:** Use terminal-size package for dynamic width  
**Decision:** YES - Better UX worth small dependency

### Q2: Should we support custom border styles later?
**Current:** Fixed styles per CardStyle  
**Proposal:** Add optional borderStyle parameter  
**Decision:** NO for v1 - Keep simple, add if requested

### Q3: Should error cards auto-style based on content?
**Current:** Explicit style parameter required  
**Proposal:** Detect Error objects and auto-apply 'error' style  
**Decision:** NO - Explicit better than implicit, avoids magic

### Q4: Should we add card width parameter?
**Current:** Auto-width based on terminal  
**Proposal:** `addCard(title, content, { style, width })`  
**Decision:** NO for v1 - Auto-width sufficient, add if needed

## Future Enhancements (Out of Scope)

1. **Custom Border Styles**: User-defined border patterns
2. **Compact Mode**: Minimal padding for dense output
3. **Multi-Column Layouts**: Side-by-side cards
4. **Progress Cards**: Live-updating cards with spinners
5. **Color Themes**: User-configurable color schemes
6. **Card Nesting**: Cards within cards for hierarchy

## Success Metrics

1. **Visual Clarity**: 90%+ user feedback positive on card visibility
2. **Terminal Compatibility**: Works on Windows/Linux/macOS
3. **Performance**: <5ms overhead per card
4. **Adoption**: 50%+ of built-in commands use styled cards within 3 months
5. **Accessibility**: NO_COLOR compliance 100%

## References

- Boxen: https://github.com/sindresorhus/boxen
- NO_COLOR spec: https://no-color.org/
- Terminal box-drawing: https://en.wikipedia.org/wiki/Box-drawing_character
- CLI styling guide: https://clig.dev/#styling
