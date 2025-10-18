import { IMemoryDecorator, MemoryRef } from './types.js';

/**
 * Decorator that adds a user-friendly token to a MemoryRef
 */
export class TokenDecorator implements IMemoryDecorator {
  constructor(private tokenName: string) {}

  decorate(ref: MemoryRef): MemoryRef {
    return {
      ...ref,
      token: this.tokenName,
    };
  }
}

/**
 * Decorator that adds a file name to a MemoryRef
 */
export class FileNameDecorator implements IMemoryDecorator {
  constructor(private fileName: string) {}

  decorate(ref: MemoryRef): MemoryRef {
    return {
      ...ref,
      fileName: this.fileName,
    };
  }
}

/**
 * Decorator that generates a timestamped file name
 */
export class TimestampedFileNameDecorator implements IMemoryDecorator {
  constructor(
    private tokenOrId: string,
    private extension: string = 'txt'
  ) {}

  decorate(ref: MemoryRef): MemoryRef {
    const timestamp = ref.timestamp || new Date();
    const dateStr = timestamp.toISOString().replace(/[-:]/g, '').split('.')[0];
    const ms = timestamp.getMilliseconds().toString().padStart(3, '0');
    const fileName = `${dateStr}-${ms}-${this.tokenOrId}.${this.extension}`;

    return {
      ...ref,
      fileName,
    };
  }
}
