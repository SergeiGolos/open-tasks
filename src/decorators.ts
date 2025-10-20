import { IRefDecorator, StringRef } from './types.js';

/**
 * Decorator that adds a user-friendly token to a StringRef
 */
export class TokenDecorator implements IRefDecorator {
  constructor(private tokenName: string) {}

  decorate(ref: StringRef): StringRef {
    return {
      ...ref,
      token: this.tokenName,
    };
  }
}

/**
 * Decorator that adds a file name to a StringRef
 */
export class FileNameDecorator implements IRefDecorator {
  constructor(private fileName: string) {}

  decorate(ref: StringRef): StringRef {
    return {
      ...ref,
      fileName: this.fileName,
    };
  }
}

/**
 * Decorator that generates a timestamped file name
 */
export class TimestampedFileNameDecorator implements IRefDecorator {
  constructor(
    private tokenOrId: string,
    private extension: string = 'txt'
  ) {}

  decorate(ref: StringRef): StringRef {
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
