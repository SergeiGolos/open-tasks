import { SummaryData } from './types.js';

/**
 * Utility functions for output and formatting
 */

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Create a standard success summary
 */
export function createSuccessSummary(
  commandName: string,
  executionTime: number,
  outputFile?: string,
  referenceToken?: string,
  metadata?: Record<string, any>
): SummaryData {
  return {
    commandName,
    executionTime,
    outputFile,
    referenceToken,
    success: true,
    metadata,
  };
}

/**
 * Create a standard error summary
 */
export function createErrorSummary(
  commandName: string,
  executionTime: number,
  error: Error
): SummaryData {
  return {
    commandName,
    executionTime,
    success: false,
    metadata: {
      error: error.message,
      stack: error.stack,
    },
  };
}
