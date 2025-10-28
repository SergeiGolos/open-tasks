import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Recursively copy directory contents
 */
function copyDirectory(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  
  const entries = readdirSync(src);
  
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    
    if (statSync(srcPath).isDirectory()) {
      // Skip non-markdown directories
      if (entry === '.obsidian' || entry === 'quartz' || entry === 'node_modules') {
        continue;
      }
      copyDirectory(srcPath, destPath);
    } else {
      // Only copy markdown files and config files
      if (entry.endsWith('.md') || entry.endsWith('.json')) {
        copyFileSync(srcPath, destPath);
      }
    }
  }
}

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/tasks/*.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: false,
  outDir: 'dist',
  onSuccess: async () => {
    // Copy wiki documentation to dist/wiki
    console.log('Copying wiki documentation...');
    try {
      copyDirectory('open-tasks-wiki', 'dist/wiki');
      console.log('✓ Wiki documentation copied to dist/wiki');
    } catch (error) {
      console.error('Failed to copy wiki documentation:', error);
      throw error;
    }
  },
});
