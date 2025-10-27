import path from 'path';

/**
 * Utilities for execution time tracking and formatting
 */

/**
 * Format execution time in human-readable format
 * - Under 1000ms: "Xms"
 * - 1000ms and above: "X.Xs"
 */
export function formatExecutionTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = (milliseconds / 1000).toFixed(1);
  return `${seconds}s`;
}

/**
 * Calculate duration between two timestamps
 */
export function calculateDuration(startTime: number, endTime: number = Date.now()): number {
  return endTime - startTime;
}

/**
 * Validate and sanitize output file path
 * Prevents directory traversal attacks
 * 
 * @throws Error if path contains directory traversal patterns
 */
export function validateOutputPath(filePath: string, allowedBaseDir?: string): string {
  // Check for directory traversal patterns
  if (filePath.includes('..')) {
    throw new Error('Invalid output path: directory traversal (..) not allowed');
  }
  
  // Check for absolute paths (should be relative)
  if (path.isAbsolute(filePath)) {
    throw new Error('Invalid output path: absolute paths not allowed');
  }
  
  // Normalize path to remove any ./  or extra slashes
  const normalized = path.normalize(filePath);
  
  // If base directory specified, ensure normalized path stays within it
  if (allowedBaseDir) {
    const fullPath = path.resolve(allowedBaseDir, normalized);
    const basePath = path.resolve(allowedBaseDir);
    
    if (!fullPath.startsWith(basePath)) {
      throw new Error('Invalid output path: path escapes allowed directory');
    }
  }
  
  return normalized;
}

/**
 * Get the absolute path to a wiki documentation file
 * Wiki files are located in dist/wiki/ after build
 * 
 * @param filename - Name of the wiki file (e.g., 'Core-Commands.md')
 * @returns Absolute path to the wiki file
 * 
 * @example
 * const wikiPath = getWikiPath('Core-Commands.md');
 * const content = await fs.readFile(wikiPath, 'utf-8');
 */
export function getWikiPath(filename: string): string {
  // Get the directory where this module is located
  const url = new URL(import.meta.url);
  let moduleDir = path.dirname(url.pathname);
  
  // Fix Windows path (remove leading slash from /C:/...)
  if (process.platform === 'win32' && moduleDir.startsWith('/')) {
    moduleDir = moduleDir.substring(1);
  }
  
  // Navigate to dist/wiki from the module location
  // In production: dist/utils.js -> dist/wiki/filename
  const wikiPath = path.join(moduleDir, 'wiki', filename);
  
  return path.resolve(wikiPath);
}

/**
 * Get all available wiki files
 * @returns Array of wiki file names
 */
export function getAvailableWikiFiles(): string[] {
  return [
    'Architecture.md',
    'Building-Custom-Commands.md',
    'Building-Custom-Tasks.md',
    'Core-Agents-Command-Builder.md',
    'Core-Commands.md',
    'Core-Tasks.md',
    'Example-Tasks.md',
    'index.md',
    'Installation.md',
  ];
}
