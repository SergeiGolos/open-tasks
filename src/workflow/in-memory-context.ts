import { v4 as uuidv4 } from 'uuid';
import {
  IFlow,
  ICommand,
  IRefDecorator,
  StringRef,
} from './types.js';

/**
 * In-memory implementation of workflow context
 * Stores values in a Map with token-based lookup
 */
export class InMemoryWorkflowContext implements IFlow {
  private memory: Map<string, StringRef>;
  private tokenIndex: Map<string, string>; // token -> latest id

  constructor() {
    this.memory = new Map();
    this.tokenIndex = new Map();
  }

  /**
   * Get a memory reference by ID or token
   */
  with(idOrToken: string): StringRef | undefined {
    // Try direct ID lookup first
    let ref = this.memory.get(idOrToken);
    if (ref) {
      return ref;
    }

    // Try token lookup
    const id = this.tokenIndex.get(idOrToken);
    if (id) {
      return this.memory.get(id);
    }

    return undefined;
  }

  /**
   * List all stored references
   */
  list(): StringRef[] {
    return Array.from(this.memory.values());
  }

  /**
   * Clear all stored values
   */
  clear(): void {
    this.memory.clear();
    this.tokenIndex.clear();
  }
}
