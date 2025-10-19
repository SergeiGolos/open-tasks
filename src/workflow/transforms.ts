import { ICommand, IWorkflowContext, MemoryRef, TransformMetadata } from './types.js';
import { TokenDecorator, MetadataDecorator } from './decorators.js';

/**
 * Base class for transform commands that automatically track metadata
 */
abstract class BaseTransformCommand implements ICommand {
  protected abstract getTransformType(): string;
  protected abstract getInputTokens(): string[];
  protected abstract getTransformParams(): Record<string, any>;

  abstract execute(
    context: IWorkflowContext,
    args: any[],
    cardBuilder?: import('../types.js').ICardBuilder
  ): Promise<MemoryRef[]>;

  /**
   * Create metadata for this transform
   */
  protected createMetadata(): TransformMetadata {
    return {
      type: this.getTransformType(),
      inputs: this.getInputTokens(),
      params: this.getTransformParams(),
      timestamp: new Date(),
    };
  }

  /**
   * Store result with metadata tracking
   */
  protected async storeWithMetadata(
    context: IWorkflowContext,
    content: any,
    outputToken?: string,
    additionalParams?: Record<string, any>
  ): Promise<MemoryRef> {
    const metadata = this.createMetadata();
    
    // Merge additional params if provided
    if (additionalParams) {
      metadata.params = { ...metadata.params, ...additionalParams };
    }

    const decorators = [
      new MetadataDecorator(metadata),
      ...(outputToken ? [new TokenDecorator(outputToken)] : []),
    ];
    
    const ref = await context.store(content, decorators);
    return ref;
  }
}

/**
 * Command that replaces {{token}} patterns in text with values from context
 */
export class TokenReplaceCommand extends BaseTransformCommand {
  constructor(
    private inputToken: string,
    private outputToken?: string
  ) {
    super();
  }

  protected getTransformType(): string {
    return 'TokenReplace';
  }

  protected getInputTokens(): string[] {
    return [this.inputToken];
  }

  protected getTransformParams(): Record<string, any> {
    return { outputToken: this.outputToken };
  }

  async execute(
    context: IWorkflowContext,
    args: any[],
    cardBuilder?: import('../types.js').ICardBuilder
  ): Promise<MemoryRef[]> {
    // Get input content from context by token
    const input = context.token(this.inputToken);
    
    if (input === undefined) {
      throw new Error(`Token '${this.inputToken}' not found in context`);
    }

    // Convert to string if needed
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);

    // Find all {{token}} patterns and track which tokens are used
    const tokenPattern = /\{\{([^}]+)\}\}/g;
    let result = inputStr;
    const matches = inputStr.matchAll(tokenPattern);
    const usedTokens: string[] = [];

    for (const match of matches) {
      const tokenName = match[1].trim();
      const tokenValue = context.token(tokenName);
      
      if (tokenValue !== undefined) {
        const valueStr = typeof tokenValue === 'string' 
          ? tokenValue 
          : JSON.stringify(tokenValue);
        result = result.replace(match[0], valueStr);
        usedTokens.push(tokenName);
      }
    }

    // Store result with metadata
    const ref = await this.storeWithMetadata(
      context,
      result,
      this.outputToken,
      { replacedTokens: usedTokens }
    );

    return [ref];
  }
}

/**
 * Command that extracts text matching a regex pattern
 */
export class ExtractCommand extends BaseTransformCommand {
  constructor(
    private inputToken: string,
    private pattern: RegExp,
    private outputToken?: string
  ) {
    super();
  }

  protected getTransformType(): string {
    return 'Extract';
  }

  protected getInputTokens(): string[] {
    return [this.inputToken];
  }

  protected getTransformParams(): Record<string, any> {
    return { 
      pattern: this.pattern.source,
      flags: this.pattern.flags,
      outputToken: this.outputToken,
    };
  }

  async execute(
    context: IWorkflowContext,
    args: any[],
    cardBuilder?: import('../types.js').ICardBuilder
  ): Promise<MemoryRef[]> {
    const input = context.token(this.inputToken);
    
    if (input === undefined) {
      throw new Error(`Token '${this.inputToken}' not found in context`);
    }

    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    const matches = inputStr.match(this.pattern);

    if (!matches) {
      throw new Error(`Pattern did not match in content from token '${this.inputToken}'`);
    }

    // Store the first match (or full match if no groups)
    const result = matches[1] || matches[0];
    const ref = await this.storeWithMetadata(context, result, this.outputToken);
    return [ref];
  }
}

/**
 * Command that applies a regex pattern and returns all matches
 */
export class RegexMatchCommand extends BaseTransformCommand {
  constructor(
    private inputToken: string,
    private pattern: RegExp,
    private outputToken?: string
  ) {
    super();
  }

  protected getTransformType(): string {
    return 'RegexMatch';
  }

  protected getInputTokens(): string[] {
    return [this.inputToken];
  }

  protected getTransformParams(): Record<string, any> {
    return{
      pattern: this.pattern.source,
      flags: this.pattern.flags,
      outputToken: this.outputToken,
    };
  }

  async execute(
    context: IWorkflowContext,
    args: any[],
    cardBuilder?: import('../types.js').ICardBuilder
  ): Promise<MemoryRef[]> {
    const input = context.token(this.inputToken);
    
    if (input === undefined) {
      throw new Error(`Token '${this.inputToken}' not found in context`);
    }

    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    
    // Use matchAll for global patterns
    const matches = Array.from(inputStr.matchAll(this.pattern));
    
    if (matches.length === 0) {
      throw new Error(`Pattern did not match in content from token '${this.inputToken}'`);
    }

    // Format matches as a readable string
    const result = matches.map((match, idx) => {
      if (match.length === 1) {
        return `${idx + 1}. ${match[0]}`;
      }
      // Include capture groups
      const groups = match.slice(1).filter(g => g !== undefined);
      return `${idx + 1}. ${match[0]}${groups.length > 0 ? ` (groups: ${groups.join(', ')})` : ''}`;
    }).join('\n');
    
    const ref = await this.storeWithMetadata(
      context,
      result,
      this.outputToken,
      { matchCount: matches.length }
    );

    return [ref];
  }
}

/**
 * Command that splits text by a delimiter and stores parts separately
 */
export class SplitCommand extends BaseTransformCommand {
  constructor(
    private inputToken: string,
    private delimiter: string | RegExp,
    private outputTokenPrefix?: string
  ) {
    super();
  }

  protected getTransformType(): string {
    return 'Split';
  }

  protected getInputTokens(): string[] {
    return [this.inputToken];
  }

  protected getTransformParams(): Record<string, any> {
    return {
      delimiter: typeof this.delimiter === 'string' 
        ? this.delimiter 
        : this.delimiter.source,
      outputTokenPrefix: this.outputTokenPrefix,
    };
  }

  async execute(
    context: IWorkflowContext,
    args: any[],
    cardBuilder?: import('../types.js').ICardBuilder
  ): Promise<MemoryRef[]> {
    const input = context.token(this.inputToken);
    
    if (input === undefined) {
      throw new Error(`Token '${this.inputToken}' not found in context`);
    }

    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    const parts = inputStr.split(this.delimiter);

    // Store each part as a separate MemoryRef with metadata
    const refs: MemoryRef[] = [];
    for (let i = 0; i < parts.length; i++) {
      const token = this.outputTokenPrefix 
        ? `${this.outputTokenPrefix}-${i + 1}`
        : undefined;
      
      const ref = await this.storeWithMetadata(
        context,
        parts[i],
        token,
        { partIndex: i + 1, totalParts: parts.length }
      );
      
      refs.push(ref);
    }

    return refs;
  }
}

/**
 * Command that joins multiple tokens into a single output
 */
export class JoinCommand extends BaseTransformCommand {
  constructor(
    private inputTokens: string[],
    private delimiter: string = '\n',
    private outputToken?: string
  ) {
    super();
  }

  protected getTransformType(): string {
    return 'Join';
  }

  protected getInputTokens(): string[] {
    return this.inputTokens;
  }

  protected getTransformParams(): Record<string, any> {
    return {
      delimiter: this.delimiter,
      outputToken: this.outputToken,
    };
  }

  async execute(
    context: IWorkflowContext,
    args: any[],
    cardBuilder?: import('../types.js').ICardBuilder
  ): Promise<MemoryRef[]> {
    const values: string[] = [];
    
    for (const tokenName of this.inputTokens) {
      const value = context.token(tokenName);
      if (value === undefined) {
        throw new Error(`Token '${tokenName}' not found in context`);
      }
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      values.push(valueStr);
    }

    const result = values.join(this.delimiter);
    const ref = await this.storeWithMetadata(
      context,
      result,
      this.outputToken,
      { tokenCount: this.inputTokens.length }
    );

    return [ref];
  }
}
