- CMD with verbs to express different properties.  verb routes to a named class for async processes execution that writes sub process to the command output
- async operations execute cmd tools and synt the output to both files and the screen for user observation.
- the outcome of the asyn operations is a refernce to the output files and can be used as input to other async process.
- Some async process are just transformers will create a new memory reference with the transformations.
- User feedback on the CMD should some formatting and color coding to identify the different elements of what is going on.
- Common format is text and markdown files.
  
## Vision Example

Example Process

``` 
- args []  as input
  
var ref = async store(args[0]) // save value to be used.
var filename = replace(... string replace format, but use ref that store the content in memory..., ref)
var shell_output = powershell("command", )
var context_file = load(filename)
var response = codex(context_files, context_files...)
var extract = extract(response, regex)

```

## High Level

the goal is to pre-define a bunch of PowerShell calls and then use those values as context for a ai cli call to do something.

i should be able to quickly ad a new command module to the directory i am working in under .open-task/command-verb  to enable it as a verb on the cli.