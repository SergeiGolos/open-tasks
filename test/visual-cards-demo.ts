// Test file to demonstrate all card styles
import { VerboseCardBuilder } from '../src/card-builders.js';

const builder = new VerboseCardBuilder();

// Info card (blue border)
builder.addCard('⚙️ Info Card', 'This is an informational card with a blue border', 'info');

// Success card (green border)
builder.addCard('✓ Success Card', 'Operation completed successfully!', 'success');

// Warning card (yellow border)
builder.addCard('⚠ Warning Card', 'This is a warning message', 'warning');

// Error card (red border)
builder.addCard('✗ Error Card', 'Something went wrong!', 'error');

// Dim card (gray border)
builder.addCard('📝 Dim Card', 'This is secondary information', 'dim');

// Default card (no color)
builder.addCard('📊 Default Card', 'This card has no color styling', 'default');

// Table card
builder.addCard('📋 Table Card', {
  type: 'table' as const,
  headers: ['Name', 'Status', 'Duration'],
  rows: [
    ['Task 1', 'Complete', '45ms'],
    ['Task 2', 'Running', '120ms'],
    ['Task 3', 'Pending', '-'],
  ],
}, 'info');

// List card
builder.addCard('📝 List Card', {
  type: 'list' as const,
  items: ['First item', 'Second item', 'Third item'],
  ordered: false,
}, 'success');

// Tree card
builder.addCard('🌳 Tree Card', {
  type: 'tree' as const,
  root: {
    label: 'Root',
    children: [
      {
        label: 'Branch 1',
        children: [
          { label: 'Leaf 1.1' },
          { label: 'Leaf 1.2' },
        ],
      },
      {
        label: 'Branch 2',
        children: [
          { label: 'Leaf 2.1' },
        ],
      },
    ],
  },
}, 'dim');

// JSON object card
builder.addCard('📦 Object Card', {
  name: 'Example',
  version: '1.0.0',
  features: ['Visual cards', 'Styled borders', 'NO_COLOR support'],
}, 'default');

console.log('\n=== CARD STYLES DEMO ===\n');
console.log(builder.build());
console.log('\n=== END DEMO ===\n');
