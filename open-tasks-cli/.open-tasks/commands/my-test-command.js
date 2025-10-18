/**
 * Custom command
 */
export default class MyTestCommandCommand {
  name = 'my-test-command';
  description = 'Custom command';
  examples = [
    'open-tasks my-test-command',
    'open-tasks my-test-command arg1 --token mytoken',
  ];

  async execute(args, refs, context) {
    // TODO: Implement your command logic here
    
    // Example: Access arguments
    const firstArg = args[0];
    
    // Example: Access references
    const tokenValue = args.find((arg, i) => args[i - 1] === '--ref');
    if (tokenValue) {
      const ref = refs.get(tokenValue);
      console.log('Reference content:', ref?.content);
    }
    
    // Example: Store a result
    const result = 'Command executed successfully!';
    const ref = context.referenceManager.createReference(
      'my-test-command-result',
      result,
      'my-test-command'
    );
    
    return ref;
  }
}
