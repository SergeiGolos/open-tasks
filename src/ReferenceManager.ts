import { ReferenceHandle } from './types';

/**
 * Reference manager for tracking command outputs
 */

export class ReferenceManager {
  private references: Map<string, ReferenceHandle>;
  private tokenIndex: Map<string, string>;

  constructor() {
    this.references = new Map();
    this.tokenIndex = new Map();
  }

  createReference(
    id: string,
    content: any,
    token?: string,
    outputFile?: string
  ): ReferenceHandle {
    const ref: ReferenceHandle = {
      id,
      token,
      content,
      timestamp: new Date(),
      outputFile,
    };

    this.references.set(id, ref);
    if (token) {
      if (this.tokenIndex.has(token)) {
        console.warn(
          `Warning: Token "${token}" already exists. Overwriting with new reference.`
        );
      }
      this.tokenIndex.set(token, id);
    }

    return ref;
  }

  getReference(idOrToken: string): ReferenceHandle | undefined {
    // Try direct ID lookup
    let ref = this.references.get(idOrToken);
    if (ref) return ref;

    // Try token lookup
    const id = this.tokenIndex.get(idOrToken);
    if (id) return this.references.get(id);

    return undefined;
  }

  listReferences(): ReferenceHandle[] {
    return Array.from(this.references.values());
  }
}
