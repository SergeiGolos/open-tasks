#!/usr/bin/env node

/**
 * Quick test script to verify agent verbose output
 * Usage: node test-agent-verbose.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Testing agent command with verbose output...\n');

// Test with a simple echo command first to verify streaming works
console.log('=== Test 1: Simple command (should stream immediately) ===');
const test1 = spawn('node', [
  path.join(__dirname, 'dist', 'index.js'),
  'agent',
  'claude-default',
  'Say hello',
  '--verbose'
], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

test1.on('close', (code) => {
  console.log(`\nTest completed with exit code: ${code}`);
});

test1.on('error', (err) => {
  console.error('Error running test:', err);
});
