# open-tasks

A powerful CLI tool for executing tasks with explicit workflow context, enabling seamless command chaining, reference management, and extensibility.


### ReferenceHandle

```typescript
interface ReferenceHandle {
  id: string;
  token?: string;
  content: any;
  timestamp: Date;
  outputFile?: string;
}
```

## Requirements

- Node.js >= 18.0.0
- PowerShell (for `powershell` command)
  
## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: [Open Tasks Wiki](./open-tasks-wiki/index.md)
- **Issues**: Report bugs and request features on GitHub Issues
- **Developer Guide**: [Contributing](./Contributing.md)

## Roadmap

- [ ] Shell integration (bash, zsh completion)
- [ ] Plugin system for third-party extensions
- [ ] Web UI for workflow visualization
- [ ] Docker integration commands
- [ ] Git workflow commands

## Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [Ora](https://github.com/sindresorhus/ora) - Progress indicators
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vitest](https://vitest.dev/) - Testing framework
