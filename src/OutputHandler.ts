/**
 * Output handler for writing files and formatting terminal output
 */

export class OutputHandler {
  constructor(private outputDir: string) { }

  /**
   * Write output with routing based on output target
   */
  async writeOutputWithRouting(
    content: string,
    fileName: string,
    customPath?: string
  ): Promise<string | undefined> {
    let filePath: string | undefined;
    filePath = await this.writeOutput(content, fileName, customPath);
    console.log(content);
    return filePath;
  }

  async writeOutput(
    content: string,
    fileName: string,
    customPath?: string
  ): Promise<string> {
    const path = await import('path');
    const fse = (await import('fs-extra')).default;

    const targetDir = customPath ? path.dirname(customPath) : this.outputDir;
    const targetFileName = customPath ? path.basename(customPath) : fileName;
    const filePath = path.join(targetDir, targetFileName);

    await fse.ensureDir(targetDir);
    await fse.writeFile(filePath, content, 'utf-8');

    return filePath;
  }

  async writeError(
    error: Error,
    context: Record<string, any>
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const fileName = `${timestamp}-error.txt`;

    const content = [
      'ERROR REPORT',
      '============',
      '',
      `Time: ${new Date().toISOString()}`,
      `Error: ${error.message}`,
      '',
      'Stack Trace:',
      error.stack || 'No stack trace available',
      '',
      'Context:',
      JSON.stringify(context, null, 2),
    ].join('\n');

    return await this.writeOutput(content, fileName);
  }

  getOutputDir(): string {
    return this.outputDir;
  }
}
