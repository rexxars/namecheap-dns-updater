export interface UpdaterOptions {
  domain: string
  password: string

  host?: string | Array<string>
  ip?: string

  apiHost?: string
}

export interface UpdaterContext {
  log?: (message: string) => void
}

export declare function update(options: UpdaterOptions, context?: UpdaterContext): Promise<string>
