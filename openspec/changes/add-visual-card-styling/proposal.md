# Change Proposal: Add Visual Card Styling

**Change ID:** `add-visual-card-styling`  
**Status:** Draft  
**Created:** 2025-10-19  
**Author:** AI Assistant

## Summary

Enhance the `ICardBuilder` system with visual styling using the `boxen` library to make cards visually identifiable and distinct in terminal output. Cards will have borders, padding, and visual hierarchy to improve readability and user experience.

**Key Features:**
1. **Boxed Cards**: Wrap cards in visual borders using `boxen`
2. **Card Styles**: Different border styles for different card types (info, success, warning, error)
3. **Visual Hierarchy**: Clear visual separation between cards and framework summary
4. **Terminal-Friendly**: Respects `NO_COLOR` environment variable and terminal width
5. **Minimal Changes**: Enhance existing card builders without breaking API

## Why

### Current State

The current card implementation (from `split-output-card-builders` change) displays cards as plain text with simple divider lines:

```
⚙️ Processing Details
────────────────────────────
{
  "Value Length": 12,
  "Size": "12 B",
  "Token": "verbose"
}
```

**Issues:**
1. **Low Visual Impact**: Cards blend with other terminal output
2. **Hard to Scan**: No clear visual boundaries make it difficult to quickly identify cards
3. **Poor Hierarchy**: Cards and summary look similar, reducing scannability
4. **Limited Context**: No visual indication of card purpose (info, success, warning, error)

### Benefits

1. **Better Scannability**: Boxed cards stand out in terminal output
2. **Visual Context**: Border styles indicate card type (info = blue, success = green, etc.)
3. **Professional Appearance**: Modern CLI aesthetic improves user trust
4. **Terminal-Native**: Uses existing terminal capabilities (ANSI, box-drawing characters)
5. **Accessibility**: Respects `NO_COLOR` for accessibility

## What Changes

### 1. Add Boxen Dependency

```json
{
  "dependencies": {
    "boxen": "^8.0.1"
  }
}
```

### 2. Enhance VerboseCardBuilder

**Before:**
```typescript
private renderCard(content: CardContent): string {
  lines.push(title);
  lines.push('─'.repeat(Math.min(title.length, 80)));
  lines.push(rendered);
}
```

**After:**
```typescript
private renderCard(title: string, content: CardContent, style?: CardStyle): string {
  const rendered = this.formatContent(content);
  return boxen(rendered, {
    title: title,
    titleAlignment: 'left',
    padding: 1,
    borderStyle: this.getBorderStyle(style),
    borderColor: this.getBorderColor(style),
    dimBorder: style === 'dim'
  });
}
```

### 3. Add Card Style Types

```typescript
type CardStyle = 'info' | 'success' | 'warning' | 'error' | 'dim' | 'default';

interface ICardBuilder {
  addCard(title: string, content: CardContent, style?: CardStyle): void;
  // ... existing methods
}
```

### 4. Visual Examples

**Info Card:**
```
╭─ ⚙️ Processing Details ──────────────╮
│                                      │
│  Value Length: 12                    │
│  Size: 12 B                          │
│  Token: verbose                      │
│  Reference ID: abc123                │
│                                      │
╰──────────────────────────────────────╯
```

**Success Card:**
```
╭─ ✓ Operation Complete ───────────────╮
│                                      │
│  Files processed: 5                  │
│  Duration: 150ms                     │
│                                      │
╰──────────────────────────────────────╯
```

**Table Card:**
```
╭─ 📊 Results ─────────────────────────╮
│                                      │
│  Name    │ Status  │ Duration        │
│  ────────┼─────────┼─────────        │
│  Task 1  │ Success │ 45ms            │
│  Task 2  │ Success │ 32ms            │
│                                      │
╰──────────────────────────────────────╯
```

## Goals

1. **Enhance VerboseCardBuilder**: Add boxen integration for visual borders
2. **Add Card Styles**: Support info, success, warning, error, dim styles
3. **Maintain Compatibility**: Existing card usage continues to work (default style)
4. **Respect Environment**: Honor NO_COLOR and terminal width constraints
5. **Update Examples**: Migrate StoreCommand to use styled cards
6. **Document Patterns**: Add examples to card builder documentation

## Non-Goals

- Changing QuietCardBuilder or SummaryCardBuilder (they ignore cards anyway)
- Adding interactive elements or dynamic updates
- Supporting custom border characters (use boxen defaults)
- Adding color to card content (content stays monochrome, borders add color)
- Changing ICardBuilder interface (only add optional style parameter)

## Impact

### Affected Specs

This change modifies the `card-builder` capability introduced in `split-output-card-builders`:
- **MODIFIED**: Card rendering to include visual borders
- **ADDED**: Card style support for visual context

### Affected Code

- `src/card-builders.ts` - VerboseCardBuilder implementation
- `src/types.ts` - Add CardStyle type to ICardBuilder.addCard signature
- `src/commands/store.ts` - Update to use styled cards (example)
- `package.json` - Add boxen dependency

### Dependencies

- **Requires**: `split-output-card-builders` change to be implemented first
- **Blocks**: None

## Open Questions

1. **Default Style**: Should cards default to 'info' or 'default' (no color)?
   - **Recommendation**: 'default' (no color) to maintain current look unless explicitly styled

2. **Terminal Width**: Should cards auto-resize based on terminal width?
   - **Recommendation**: Yes, use `terminal-size` package and limit to 80% of terminal width

3. **Border Style**: Should we use `boxen.BorderStyle.Round` or `boxen.BorderStyle.Classic`?
   - **Recommendation**: Round for modern CLIs, respect user preference via config later

4. **NO_COLOR Handling**: How should boxed cards look without color?
   - **Recommendation**: Use ASCII borders (`+---+`) instead of box-drawing characters

## Migration Plan

### Phase 1: Add Infrastructure (Low Risk)
1. Install boxen dependency
2. Add CardStyle type to types.ts
3. Add optional style parameter to ICardBuilder.addCard()
4. Update VerboseCardBuilder with boxen integration (default style = plain)

**Validation**: Existing tests pass, cards still render (no visual change yet)

### Phase 2: Migrate Examples (Medium Risk)
1. Update StoreCommand to use styled cards
2. Add visual regression tests (capture terminal output)
3. Document card styling patterns

**Validation**: Store command shows boxed cards in verbose mode

### Phase 3: Documentation (Low Risk)
1. Update Output-Control-API.md with card styling examples
2. Add visual examples to README
3. Update example-command.ts template

**Validation**: Documentation accurate and complete

## Alternatives Considered

### 1. Use `cli-boxes` directly
- **Pro**: Lighter weight, more manual control
- **Con**: Need to implement padding, title alignment, width calculation ourselves
- **Decision**: Use boxen for batteries-included experience

### 2. Use `terminal-kit` for advanced features
- **Pro**: More features (colors, layouts, widgets)
- **Con**: Much larger dependency, over-engineered for our needs
- **Decision**: Too complex for simple card boxing

### 3. Manual box-drawing characters
- **Pro**: No dependency
- **Con**: Need to handle padding, width, alignment, NO_COLOR ourselves
- **Decision**: Not worth reinventing boxen

### 4. ANSI escape codes for borders
- **Pro**: Maximum control
- **Con**: Complex, error-prone, poor terminal compatibility
- **Decision**: Boxen handles this better

## Success Criteria

1. **Visual Distinction**: Cards clearly stand out from other output
2. **Style Context**: Different card types visually distinguishable (info vs success vs error)
3. **Accessibility**: Works with NO_COLOR environment variable
4. **Performance**: No noticeable slowdown in card rendering
5. **Compatibility**: Existing card usage works without changes

## References

- `split-output-card-builders` change proposal
- Boxen documentation: https://github.com/sindresorhus/boxen
- Terminal styling best practices: NO_COLOR spec (https://no-color.org/)

