// Core commands
export { SetCommand } from './set.js';
export { ReplaceCommand } from './replace.js';

// File I/O commands
export { ReadCommand } from './read.js';
export { WriteCommand } from './write.js';
export { PromptCommand } from './prompt.js';

// Template and transformation commands
export { TemplateCommand } from './template.js';
export { MatchCommand } from './match.js';
export { TextTransformCommand } from './text-transform.js';
export { JsonTransformCommand } from './json-transform.js';

// Utility commands
export { JoinCommand } from './join.js';
export { QuestionCommand } from './question.js';

// Agent commands - specific command classes for each tool
export * from './agents/index.js';
