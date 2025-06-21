export interface UpdaterOptions {
  domain: string
  password: string
  host?: string | Array<string>
  ip?: string
}

export declare function update(options: UpdaterOptions): Promise<string>
