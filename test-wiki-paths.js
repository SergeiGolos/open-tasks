#!/usr/bin/env node

/**
 * Test script to verify wiki path utilities
 */

import { getWikiPath, getAvailableWikiFiles } from './dist/utils.js';
import { readFileSync, existsSync } from 'fs';

console.log('Testing wiki path utilities...\n');

// Test 1: Get all available wiki files
console.log('Available wiki files:');
const files = getAvailableWikiFiles();
files.forEach(file => console.log(`  - ${file}`));

// Test 2: Get path to a specific wiki file
console.log('\nTesting getWikiPath():');
const coreCmdsPath = getWikiPath('Core-Commands.md');
console.log(`Path to Core-Commands.md: ${coreCmdsPath}`);
console.log(`File exists: ${existsSync(coreCmdsPath)}`);

if (existsSync(coreCmdsPath)) {
  const content = readFileSync(coreCmdsPath, 'utf-8');
  console.log(`File size: ${content.length} bytes`);
  console.log(`First line: ${content.split('\n')[0]}`);
}

// Test 3: Try another file
console.log('\nTesting another file:');
const archPath = getWikiPath('Architecture.md');
console.log(`Path to Architecture.md: ${archPath}`);
console.log(`File exists: ${existsSync(archPath)}`);

console.log('\n✓ Wiki path tests complete!');
