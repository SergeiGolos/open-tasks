import { DirectoryOutputContext } from '../src/directory-output-context.js';
import { SetCommand } from '../src/commands/set.js';
import { ReadCommand } from '../src/commands/read.js';
import { WriteCommand } from '../src/commands/write.js';
import { TemplateCommand } from '../src/commands/template.js';
import { MatchCommand } from '../src/commands/match.js';
import { TextTransformCommand } from '../src/commands/text-transform.js';
import { JsonTransformCommand } from '../src/commands/json-transform.js';
import { JoinCommand } from '../src/commands/join.js';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * Example demonstrating all the new built-in commands
 */
async function main() {
  console.log('=== Built-in Commands Example ===\n');

  // Create a workflow context
  const testDir = path.join(process.cwd(), '.example-output');
  await fs.mkdir(testDir, { recursive: true });
  const context = new DirectoryOutputContext(process.cwd(), testDir);

  // 1. SetCommand - Store values
  console.log('1. SetCommand - Storing values');
  const nameRef = await context.run(new SetCommand('John Doe', 'name'));
  const ageRef = await context.run(new SetCommand('30', 'age'));
  console.log('   ✓ Stored name and age\n');

  // 2. ReadCommand - Read from file (create a test file first)
  console.log('2. ReadCommand - Reading from file');
  const testFile = path.join(testDir, 'test-data.txt');
  await fs.writeFile(testFile, 'Hello from file!');
  const fileRef = await context.run(new ReadCommand(testFile));
  const fileContent = await context.get(fileRef[0]);
  console.log(`   ✓ Read content: "${fileContent}"\n`);

  // 3. WriteCommand - Write to file
  console.log('3. WriteCommand - Writing to file');
  const contentRef = await context.run(new SetCommand('This is written content'));
  const outputFile = path.join(testDir, 'written.txt');
  await context.run(new WriteCommand(outputFile, contentRef[0]));
  console.log(`   ✓ Written to: ${outputFile}\n`);

  // 4. TemplateCommand - Process templates
  console.log('4. TemplateCommand - Processing template');
  await context.run(new SetCommand('Alice', 'username'));
  await context.run(new SetCommand('alice@example.com', 'email'));
  const templateRef = await context.run(
    new TemplateCommand('Welcome {{username}}! Your email is {{email}}.')
  );
  const templateResult = await context.get(templateRef[0]);
  console.log(`   ✓ Template result: "${templateResult}"\n`);

  // 5. MatchCommand - Extract with regex
  console.log('5. MatchCommand - Extracting with regex');
  const textRef = await context.run(
    new SetCommand('Contact: support@example.com, Phone: 555-1234')
  );
  const matchRefs = await context.run(
    new MatchCommand(
      textRef[0],
      /Contact: ([^,]+), Phone: (.+)/,
      ['contactEmail', 'phone']
    )
  );
  const email = await context.get(matchRefs[0]);
  const phone = await context.get(matchRefs[1]);
  console.log(`   ✓ Extracted email: "${email}"`);
  console.log(`   ✓ Extracted phone: "${phone}"\n`);

  // 6. TextTransformCommand - Transform text
  console.log('6. TextTransformCommand - Transforming text');
  const lowerRef = await context.run(new SetCommand('hello world'));
  const upperRef = await context.run(
    new TextTransformCommand(lowerRef[0], (s) => s.toUpperCase())
  );
  const upperResult = await context.get(upperRef[0]);
  console.log(`   ✓ Uppercase: "${upperResult}"\n`);

  // 7. JsonTransformCommand - Transform JSON
  console.log('7. JsonTransformCommand - Transforming JSON');
  const jsonRef = await context.run(
    new SetCommand('{"users": [{"name": "Alice", "age": 25}, {"name": "Bob", "age": 30}]}')
  );
  const extractedRef = await context.run(
    new JsonTransformCommand(jsonRef[0], (obj) => obj.users[0].name)
  );
  const extractedResult = await context.get(extractedRef[0]);
  console.log(`   ✓ Extracted from JSON: "${extractedResult}"\n`);

  // 8. JoinCommand - Join strings
  console.log('8. JoinCommand - Joining strings');
  const part1 = await context.run(new SetCommand('Hello'));
  const part2 = await context.run(new SetCommand('World'));
  const joinRef = await context.run(
    new JoinCommand([part1[0], ', ', part2[0], '!'])
  );
  const joinResult = await context.get(joinRef[0]);
  console.log(`   ✓ Joined result: "${joinResult}"\n`);

  // Complex workflow combining multiple commands
  console.log('9. Complex workflow - Combining commands');
  
  // Create a user profile from JSON
  const userJson = await context.run(
    new SetCommand('{"firstName": "Jane", "lastName": "Smith", "email": "jane@example.com"}')
  );
  
  // Extract fields
  const firstNameRef = await context.run(
    new JsonTransformCommand(userJson[0], (obj) => obj.firstName)
  );
  const lastNameRef = await context.run(
    new JsonTransformCommand(userJson[0], (obj) => obj.lastName)
  );
  const emailRef = await context.run(
    new JsonTransformCommand(userJson[0], (obj) => obj.email)
  );
  
  // Store as tokens
  await context.run(new SetCommand(await context.get(firstNameRef[0]), 'firstName'));
  await context.run(new SetCommand(await context.get(lastNameRef[0]), 'lastName'));
  await context.run(new SetCommand(await context.get(emailRef[0]), 'userEmail'));
  
  // Create a formatted message using template
  const messageRef = await context.run(
    new TemplateCommand('Full Name: {{firstName}} {{lastName}}\nEmail: {{userEmail}}')
  );
  const message = await context.get(messageRef[0]);
  console.log('   ✓ Complex workflow result:');
  console.log(`   ${message.replace(/\n/g, '\n   ')}\n`);

  console.log('=== All commands executed successfully! ===');
  console.log(`\nOutput files are in: ${testDir}`);
}

main().catch(console.error);
