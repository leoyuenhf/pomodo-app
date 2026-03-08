declare module 'sudo-prompt' {
  interface Options {
    name?: string
    icns?: string
    env?: Record<string, string>
  }
  function exec(
    command: string,
    options: Options,
    callback: (error: Error | undefined, stdout?: string | Buffer, stderr?: string | Buffer) => void
  ): void
  export = { exec }
}
