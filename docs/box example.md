## existing

 test  open-tasks init --force
╭ 🎉 Project Initialized ───────────────────────────────────╮
│                                                           │
│   Project Directory: test                                 │
│   Open Tasks Directory: C:\Users\serge\test\.open-tasks   │
│   Files Created: 3                                        │
│   Force Mode: Yes                                         │
│                                                           │
│   Created Files:                                          │
│   ✓ .open-tasks/commands/                                 │
│   ✓ .open-tasks/outputs/                                  │
│   ✓ .open-tasks/config.json                               │
│                                                           │
│   Next Steps:                                             │
│     1. npm install open-tasks-cli                         │
│     2. open-tasks create my-command                       │
│     3. open-tasks my-command                              │
│                                                           │
╰───────────────────────────────────────────────────────────╯

✓ init completed in 7ms
🔗 Reference: @init
✓ Command executed successfully
Token: init | ID: init-result | Time: 2025-10-19T19:41:17.085Z

Output:
Project initialized successfully!

Created:
  - ✓ .open-tasks/commands/
  - ✓ .open-tasks/outputs/
  - ✓ .open-tasks/config.json

Next steps:
  1. Run: npm install open-tasks-cli
  2. Create a command: open-tasks create my-command
  3. Run your command: open-tasks my-command


## expected

 test  open-tasks init --force
╭ 🎉 Project Initialized ───────────────────────────────────╮
│                                                           │
│   Project Directory: test                                 │
│   Open Tasks Directory: C:\Users\serge\test\.open-tasks   │
│   Files Created: 3                                        │
│   Force Mode: Yes                                         │
│                                                           │
│   Created Files:                                          │
│   ✓ .open-tasks/commands/                                 │
│   ✓ .open-tasks/outputs/                                  │
│   ✓ .open-tasks/config.json                               │
│                                                           │
│   Next Steps:                                             │
│     1. npm install open-tasks-cli                         │
│     2. open-tasks create my-command                       │
│     3. open-tasks my-command                              │
│                                                           │
╰───────────────────────────────────────────────────────────╯
│ ✓ init completed in 7ms                                   │
| Token:                                                    |
| - init | ID: init-result | Time: 2025-10-19T19:41:17.085Z |
╰───────────────────────────────────────────────────────────╯