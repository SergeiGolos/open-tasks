import { CardStyle } from '../types.js';

/**
 * Shared utility for card styling
 * Provides common styling methods to reduce code duplication across all card types
 */

/**
 * Get style options based on card style
 */
export function getStyleOptions(style: CardStyle) {
  const styles = {
    info: { borderStyle: 'round' as const, borderColor: 'blue' as const },
    success: { borderStyle: 'round' as const, borderColor: 'green' as const },
    warning: { borderStyle: 'round' as const, borderColor: 'yellow' as const },
    error: { borderStyle: 'round' as const, borderColor: 'red' as const },
    dim: { borderStyle: 'round' as const, borderColor: 'gray' as const, dimBorder: true },
    default: { borderStyle: 'round' as const },
  };

  return styles[style] || styles.default;
}

/**
 * Get boxen options with title and style
 */
export function getBoxenOptions(title: string, style: CardStyle) {
  const baseOptions = {
    title: title,
    titleAlignment: 'left' as const,
    padding: 1,
  };

  const styleOptions = getStyleOptions(style);
  
  // Handle NO_COLOR
  if (process.env.NO_COLOR) {
    return {
      ...baseOptions,
      borderStyle: 'single' as const,
    };
  }

  return { ...baseOptions, ...styleOptions };
}
