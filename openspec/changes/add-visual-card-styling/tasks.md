# Implementation Tasks: Add Visual Card Styling

**Change ID:** `add-visual-card-styling`  
**Dependencies:** `split-output-card-builders` must be implemented first

## Task Checklist

### Phase 1: Infrastructure Setup (Type-Safe Foundation)

- [ ] **Task 1.1: Add boxen dependency**
  - Add `"boxen": "^8.0.1"` to package.json dependencies
  - Run `npm install`
  - **Validation:** `npm list boxen` shows installed package
  - **Dependency:** None

- [ ] **Task 1.2: Add CardStyle type definition**
  - Add `export type CardStyle = 'info' | 'success' | 'warning' | 'error' | 'dim' | 'default';` to `src/types.ts`
  - **Validation:** TypeScript compilation succeeds
  - **Dependency:** None

- [ ] **Task 1.3: Update ICardBuilder interface signature**
  - Modify `addCard(title: string, content: CardContent): void` to `addCard(title: string, content: CardContent, style?: CardStyle): void` in `src/types.ts`
  - Add JSDoc comment explaining style parameter
  - **Validation:** TypeScript compilation succeeds, existing code still compiles
  - **Dependency:** Task 1.2

- [ ] **Task 1.4: Update QuietCardBuilder.addCard signature**
  - Update method signature to match new ICardBuilder interface
  - Keep implementation as no-op (quiet mode ignores cards)
  - **Validation:** TypeScript compilation succeeds
  - **Dependency:** Task 1.3

- [ ] **Task 1.5: Update SummaryCardBuilder.addCard signature**
  - Update method signature to match new ICardBuilder interface
  - Keep implementation as no-op (summary mode ignores cards)
  - **Validation:** TypeScript compilation succeeds
  - **Dependency:** Task 1.3

- [ ] **Task 1.6: Update VerboseCardBuilder.addCard signature**
  - Update method signature to accept optional style parameter
  - Store style in cards array: `this.cards.push({ title, content, style })`
  - Update cards array type: `Array<{ title: string; content: CardContent; style?: CardStyle }>`
  - **Validation:** TypeScript compilation succeeds
  - **Dependency:** Task 1.3

- [ ] **Task 1.7: Build and verify no regressions**
  - Run `npm run build`
  - Run `npm run test`
  - **Validation:** All tests pass, no runtime errors
  - **Dependency:** Tasks 1.1-1.6

### Phase 2: Visual Rendering Implementation

- [ ] **Task 2.1: Import boxen in card-builders.ts**
  - Add `import boxen from 'boxen';` at top of file
  - **Validation:** TypeScript compilation succeeds, no import errors
  - **Dependency:** Task 1.7

- [ ] **Task 2.2: Implement getStyleOptions helper**
  - Create private method `getStyleOptions(style: CardStyle)` in VerboseCardBuilder
  - Return boxen options object based on style (borderStyle, borderColor, dimBorder)
  - Map: info=blue, success=green, warning=yellow, error=red, dim=gray, default=no color
  - **Validation:** Unit test for each style returns correct options
  - **Dependency:** Task 2.1

- [ ] **Task 2.3: Implement getBoxenOptions helper**
  - Create private method `getBoxenOptions(title: string, style?: CardStyle)`
  - Combine base options (title, titleAlignment, padding) with style options
  - Handle NO_COLOR environment variable (fall back to 'single' borderStyle, remove borderColor)
  - **Validation:** Unit test with/without NO_COLOR set
  - **Dependency:** Task 2.2

- [ ] **Task 2.4: Update renderCard to use boxen**
  - Modify `renderCard()` method to call `boxen(formattedContent, options)`
  - Remove old title/divider line rendering code
  - Use `this.formatContent()` to prepare content string
  - **Validation:** Manual test shows boxed cards in verbose mode
  - **Dependency:** Task 2.3

- [ ] **Task 2.5: Update build() method**
  - Modify to call `renderCard(title, content, style)` with style parameter
  - Join cards with `\n\n` (two newlines for spacing)
  - **Validation:** Multiple cards render with spacing
  - **Dependency:** Task 2.4

- [ ] **Task 2.6: Test with NO_COLOR environment**
  - Set `NO_COLOR=1` and run verbose command
  - Verify ASCII borders used instead of Unicode
  - Verify no ANSI color codes in output
  - **Validation:** Visual inspection shows ASCII box chars
  - **Dependency:** Task 2.5

- [ ] **Task 2.7: Build and deploy for testing**
  - Run `npm run build`
  - Run `npm run dev-deploy`
  - **Validation:** CLI installed globally, no errors
  - **Dependency:** Task 2.6

### Phase 3: Command Migration (Examples)

- [ ] **Task 3.1: Update StoreCommand to use 'info' style**
  - Modify `cardBuilder.addCard()` call in `src/commands/store.ts` to pass `'info'` as style parameter
  - **Validation:** `open-tasks store "test" --token test --verbose` shows blue-bordered card
  - **Dependency:** Task 2.7

- [ ] **Task 3.2: Test StoreCommand with different styles**
  - Temporarily test with 'success', 'warning', 'error', 'dim' styles
  - Verify border colors match expectations
  - Revert to 'info' style
  - **Validation:** All styles render correctly
  - **Dependency:** Task 3.1

- [ ] **Task 3.3: Test table card rendering with borders**
  - Create test card with TableCard type
  - Verify table renders inside border correctly
  - Check alignment and padding
  - **Validation:** Table fits within border, readable
  - **Dependency:** Task 2.7

- [ ] **Task 3.4: Test list card rendering with borders**
  - Create test card with ListCard type
  - Verify list items render inside border correctly
  - **Validation:** List fits within border, readable
  - **Dependency:** Task 2.7

- [ ] **Task 3.5: Test tree card rendering with borders**
  - Create test card with TreeCard type
  - Verify tree structure renders inside border correctly
  - **Validation:** Tree fits within border, readable
  - **Dependency:** Task 2.7

### Phase 4: Testing & Validation

- [ ] **Task 4.1: Add unit tests for getStyleOptions**
  - Test each CardStyle returns correct borderStyle and borderColor
  - Test 'default' returns no borderColor
  - **Validation:** All tests pass
  - **Dependency:** Task 2.2

- [ ] **Task 4.2: Add unit tests for NO_COLOR handling**
  - Mock process.env.NO_COLOR
  - Verify getBoxenOptions returns 'single' borderStyle
  - Verify no borderColor in result
  - **Validation:** Tests pass with/without NO_COLOR
  - **Dependency:** Task 2.3

- [ ] **Task 4.3: Add visual regression tests**
  - Create test snapshots of card output for each style
  - Use `vitest` snapshot testing
  - **Validation:** Snapshots match expected output
  - **Dependency:** Task 2.7

- [ ] **Task 4.4: Test terminal compatibility**
  - Test on Windows PowerShell
  - Test on Windows CMD
  - Test on WSL
  - Test on macOS Terminal
  - Test on Linux terminal (Ubuntu)
  - **Validation:** Cards render correctly on all platforms
  - **Dependency:** Task 2.7

- [ ] **Task 4.5: Performance testing**
  - Measure card rendering time (should be <5ms per card)
  - Test with 10+ cards in single command
  - **Validation:** No noticeable slowdown
  - **Dependency:** Task 2.7

### Phase 5: Documentation

- [ ] **Task 5.1: Update Output-Control-API.md**
  - Add CardStyle type documentation
  - Add examples of styled cards
  - Document NO_COLOR behavior
  - **Validation:** Documentation accurate and clear
  - **Dependency:** Task 3.1

- [ ] **Task 5.2: Update example-command.ts template**
  - Add example of using styled cards
  - Show different style types
  - Add comments explaining when to use each style
  - **Validation:** Template compiles and demonstrates card styling
  - **Dependency:** Task 5.1

- [ ] **Task 5.3: Add visual examples to README**
  - Add screenshots or ASCII art of styled cards
  - Show info, success, warning, error examples
  - **Validation:** Examples accurate and helpful
  - **Dependency:** Task 5.1

- [ ] **Task 5.4: Update IOutputBuilder-Architecture.md**
  - Add section on card styling
  - Explain style parameter usage
  - **Validation:** Architecture docs reflect new styling capability
  - **Dependency:** Task 5.1

### Phase 6: Final Validation

- [ ] **Task 6.1: Run full test suite**
  - `npm run test`
  - `npm run test:coverage` (ensure coverage maintained)
  - **Validation:** All tests pass, coverage ≥90%
  - **Dependency:** Phase 4 complete

- [ ] **Task 6.2: Run linter**
  - `npm run lint`
  - Fix any style issues
  - **Validation:** No linting errors
  - **Dependency:** Phase 5 complete

- [ ] **Task 6.3: Build production**
  - `npm run build`
  - Verify no TypeScript errors
  - Check bundle size (should be +~50KB)
  - **Validation:** Clean build, acceptable size
  - **Dependency:** Task 6.1, 6.2

- [ ] **Task 6.4: Manual end-to-end testing**
  - Test all verbosity levels (quiet, summary, verbose)
  - Test with NO_COLOR=1
  - Test with --screen-only, --log-only
  - Test with multiple cards
  - **Validation:** All combinations work as expected
  - **Dependency:** Task 6.3

- [ ] **Task 6.5: Update CHANGELOG (if exists)**
  - Add entry for visual card styling feature
  - Document breaking changes (none expected)
  - **Validation:** CHANGELOG accurate
  - **Dependency:** Task 6.4

## Task Dependencies Graph

```
Phase 1 (Infrastructure)
1.1 (boxen) ──┬──> 1.7 (build & verify)
1.2 (type)    │
1.3 (interface) ─┬─> 1.4 (Quiet)
                 ├─> 1.5 (Summary)
                 └─> 1.6 (Verbose)

Phase 2 (Rendering)
1.7 ──> 2.1 (import) ──> 2.2 (getStyleOptions) ──> 2.3 (getBoxenOptions)
                                                     ──> 2.4 (renderCard)
                                                     ──> 2.5 (build)
                                                     ──> 2.6 (NO_COLOR test)
                                                     ──> 2.7 (deploy)

Phase 3 (Examples)
2.7 ──> 3.1 (StoreCommand) ──> 3.2 (style tests)
     └──> 3.3 (table test)
     └──> 3.4 (list test)
     └──> 3.5 (tree test)

Phase 4 (Testing)
2.2 ──> 4.1 (style tests)
2.3 ──> 4.2 (NO_COLOR tests)
2.7 ──> 4.3 (visual tests)
     └──> 4.4 (platform tests)
     └──> 4.5 (performance tests)

Phase 5 (Docs)
3.1 ──> 5.1 (API docs) ──> 5.2 (template)
                        ──> 5.3 (README)
                        ──> 5.4 (architecture)

Phase 6 (Final)
Phase 4 ──> 6.1 (tests)
Phase 5 ──> 6.2 (lint) ──> 6.3 (build) ──> 6.4 (e2e) ──> 6.5 (changelog)
```

## Estimated Effort

- **Phase 1:** 1 hour (straightforward type changes)
- **Phase 2:** 2-3 hours (core implementation)
- **Phase 3:** 1 hour (example migration)
- **Phase 4:** 2 hours (testing)
- **Phase 5:** 1-2 hours (documentation)
- **Phase 6:** 1 hour (final validation)

**Total:** 8-10 hours

## Parallel Work Opportunities

Can work in parallel:
- Phase 1 tasks (1.1-1.6) can be done simultaneously by different devs
- Phase 3 tasks (3.1-3.5) can be done in parallel once Phase 2 complete
- Phase 4 tasks (4.1-4.5) can be done in parallel
- Phase 5 tasks (5.1-5.4) can be done in parallel

## Rollback Plan

If issues discovered:
1. **Type errors**: Revert Task 1.3, make style required instead of optional
2. **Rendering issues**: Revert Phase 2, fall back to plain text rendering
3. **Performance issues**: Add caching or lazy rendering
4. **Compatibility issues**: Add feature flag to disable boxen, use plain rendering

## Success Criteria

- [ ] All 39 tasks completed
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Visual cards render on all platforms
- [ ] NO_COLOR compliance verified
- [ ] Documentation complete and accurate
- [ ] Performance <5ms overhead per card
- [ ] User feedback positive (if beta testing)
