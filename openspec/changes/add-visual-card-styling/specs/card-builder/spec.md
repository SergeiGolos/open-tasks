# Card Builder Specification (Delta)

**Capability ID:** `card-builder`  
**Version:** 1.1.0  
**Status:** Draft  
**Change:** `add-visual-card-styling`

## ADDED Requirements

### Requirement: Visual Card Styling

The system SHALL support visual styling for cards using border styles and colors to improve scannability and user experience.

**Priority:** Medium  
**Type:** Functional

#### Scenario: Render card with info style

**GIVEN** a command adds a card with 'info' style  
**WHEN** the card builder builds the output in verbose mode  
**THEN** the card SHALL be rendered with a blue border  
**AND** the border SHALL use rounded box-drawing characters  
**AND** the card SHALL include padding of 1 space on all sides  
**AND** the title SHALL appear in the top border

#### Scenario: Render card with success style

**GIVEN** a command adds a card with 'success' style  
**WHEN** the card builder builds the output in verbose mode  
**THEN** the card SHALL be rendered with a green border  
**AND** the border SHALL use rounded box-drawing characters

#### Scenario: Render card with warning style

**GIVEN** a command adds a card with 'warning' style  
**WHEN** the card builder builds the output in verbose mode  
**THEN** the card SHALL be rendered with a yellow border  
**AND** the border SHALL use rounded box-drawing characters

#### Scenario: Render card with error style

**GIVEN** a command adds a card with 'error' style  
**WHEN** the card builder builds the output in verbose mode  
**THEN** the card SHALL be rendered with a red border  
**AND** the border SHALL use rounded box-drawing characters

#### Scenario: Render card with dim style

**GIVEN** a command adds a card with 'dim' style  
**WHEN** the card builder builds the output in verbose mode  
**THEN** the card SHALL be rendered with a gray dimmed border  
**AND** the border SHALL use rounded box-drawing characters

#### Scenario: Render card with default style

**GIVEN** a command adds a card without specifying a style  
**WHEN** the card builder builds the output in verbose mode  
**THEN** the card SHALL be rendered with a border without color  
**AND** the border SHALL use rounded box-drawing characters

#### Scenario: Multiple styled cards

**GIVEN** a command adds multiple cards with different styles  
**WHEN** the card builder builds the output  
**THEN** each card SHALL render with its specified style  
**AND** cards SHALL be separated by blank lines

### Requirement: NO_COLOR Accessibility

The system SHALL respect the NO_COLOR environment variable for accessibility compliance.

**Priority:** High  
**Type:** Non-Functional

#### Scenario: Render cards without color when NO_COLOR set

**GIVEN** the NO_COLOR environment variable is set  
**WHEN** the card builder renders cards  
**THEN** all border colors SHALL be removed  
**AND** borders SHALL use ASCII-safe single-line characters  
**AND** the card structure SHALL remain intact

#### Scenario: Render cards with color when NO_COLOR not set

**GIVEN** the NO_COLOR environment variable is not set  
**WHEN** the card builder renders styled cards  
**THEN** border colors SHALL be applied based on style  
**AND** Unicode box-drawing characters SHALL be used

### Requirement: Card Visual Boundaries

Cards SHALL have clear visual boundaries to distinguish them from other terminal output.

**Priority:** High  
**Type:** Functional

#### Scenario: Card stands out from plain text

**GIVEN** command output contains cards and plain text  
**WHEN** the output is displayed  
**THEN** cards SHALL be visually distinguishable via borders  
**AND** cards SHALL have internal padding for readability

#### Scenario: Card title display

**GIVEN** a card with a title  
**WHEN** the card is rendered  
**THEN** the title SHALL appear in the top border  
**AND** the title SHALL be left-aligned

## MODIFIED Requirements

### Requirement: Card Builder Interface

The card builder interface SHALL allow commands to create formatted output cards with optional visual styling.

**Priority:** High  
**Type:** Functional

#### Scenario: Add card with style parameter

**GIVEN** a command has access to ICardBuilder  
**WHEN** the command calls addCard(title, content, style)  
**THEN** the card SHALL be stored with the specified style  
**AND** the style parameter SHALL be optional  
**AND** omitting the style SHALL default to 'default' (no color)

#### Scenario: Add card without style parameter (backward compatibility)

**GIVEN** a command has access to ICardBuilder  
**WHEN** the command calls addCard(title, content) without style parameter  
**THEN** the card SHALL be stored with 'default' style  
**AND** no compilation errors SHALL occur

#### Scenario: Card content types remain supported

**GIVEN** a card builder accepts content  
**WHEN** content is a string, object, TableCard, ListCard, or TreeCard  
**THEN** the content SHALL be formatted appropriately  
**AND** the formatted content SHALL be wrapped in styled borders

### Requirement: Verbose Mode Card Rendering

The verbose card builder SHALL render all cards with visual styling in the final output.

**Priority:** High  
**Type:** Functional

#### Scenario: Build output with styled cards

**GIVEN** cards have been added with various styles  
**WHEN** build() is called  
**THEN** each card SHALL be rendered using the boxen library  
**AND** borders SHALL be applied based on card style  
**AND** cards SHALL be separated by two newlines

#### Scenario: Empty card collection

**GIVEN** no cards have been added  
**WHEN** build() is called  
**THEN** an empty string SHALL be returned

## Technical Constraints

- **Dependency:** boxen ^8.0.1 package required
- **Border Characters:** Use Unicode box-drawing characters (U+256x range) in color mode
- **ASCII Fallback:** Use ASCII characters (+-|) when NO_COLOR is set
- **Padding:** 1 space on all sides of card content
- **Spacing:** 2 newlines between consecutive cards
- **Title Alignment:** Left-aligned in top border
- **Color Support:** Respect terminal color capabilities

## Performance Considerations

- Card rendering overhead: <5ms per card
- Border calculation: O(n) where n = content length
- Color detection: Cached at module load time
- NO_COLOR check: Per-card (lightweight env var check)

## Security Considerations

- **Content Sanitization:** Card content SHALL NOT execute code
- **Environment Variables:** Only NO_COLOR is read, no secrets
- **Terminal Injection:** Boxen library handles ANSI escaping safely

## Examples

### TypeScript API
```typescript
// Info card (blue border)
cardBuilder.addCard('⚙️ Processing Details', {
  'Input Length': 1024,
  'Output Length': 2048,
  'Status': 'Success'
}, 'info');

// Success card (green border)
cardBuilder.addCard('✓ Operation Complete', 
  'File saved successfully', 
  'success'
);

// Warning card (yellow border)
cardBuilder.addCard('⚠ Warning', 
  'Deprecated API usage detected', 
  'warning'
);

// Error card (red border)
cardBuilder.addCard('✗ Error', 
  'Connection timeout after 30s', 
  'error'
);

// Default card (no color)
cardBuilder.addCard('📊 Stats', {
  'Files': 42,
  'Lines': 1337
});
```

### Terminal Output (Color Mode)
```
╭─ ⚙️ Processing Details ────────────────╮
│                                        │
│  Input Length: 1024                    │
│  Output Length: 2048                   │
│  Status: Success                       │
│                                        │
╰────────────────────────────────────────╯

╭─ ✓ Operation Complete ─────────────────╮
│                                        │
│  File saved successfully               │
│                                        │
╰────────────────────────────────────────╯
```

### Terminal Output (NO_COLOR Mode)
```
+-- ⚙️ Processing Details ---------------+
|                                        |
|  Input Length: 1024                    |
|  Output Length: 2048                   |
|  Status: Success                       |
|                                        |
+----------------------------------------+

+-- ✓ Operation Complete ----------------+
|                                        |
|  File saved successfully               |
|                                        |
+----------------------------------------+
```
