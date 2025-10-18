import { IOutputBuilder, SummaryData } from './types.js';

/**
 * Utility functions for working with output builders
 */

/**
 * Add a formatted section to the output builder
 */
export function addFormattedSection(
  builder: IOutputBuilder,
  title: string,
  content: string | Record<string, any>
): void {
  const formattedContent = typeof content === 'string' 
    ? content 
    : JSON.stringify(content, null, 2);
  
  builder.addSection(title, formattedContent);
}

/**
 * Add file information section (useful for verbose mode)
 */
export function addFileInfoSection(
  builder: IOutputBuilder,
  filePath: string,
  size?: number,
  mimeType?: string
): void {
  const info: Record<string, string | number> = {
    path: filePath,
  };
  
  if (size !== undefined) {
    info.size = `${size} bytes`;
    info.sizeFormatted = formatFileSize(size);
  }
  
  if (mimeType) {
    info.type = mimeType;
  }
  
  addFormattedSection(builder, '📄 File Information', info);
}

/**
 * Add processing details section
 */
export function addProcessingDetails(
  builder: IOutputBuilder,
  details: Record<string, any>
): void {
  addFormattedSection(builder, '⚙️  Processing Details', details);
}

/**
 * Add progress message with timestamp
 */
export function addProgressWithTime(
  builder: IOutputBuilder,
  message: string,
  startTime: number
): void {
  const elapsed = Date.now() - startTime;
  builder.addProgress(`[${elapsed}ms] ${message}`);
}

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
