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
