#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable no-process-env */
/* eslint-disable no-process-exit */
import fs from 'node:fs'
import path from 'node:path'
import updateNotifier from 'update-notifier'
import meow from 'meow'
import {update} from './api.js'

const pkgPath = path.join(import.meta.dirname, '..', 'package.json')

// eslint-disable-next-line no-sync
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const trimEnv = (item) => (typeof item === 'undefined' || item === '' ? undefined : item.trim())

updateNotifier({pkg}).notify()

const cli = meow(
  `
  Usage
    $ namecheap-dns-updater --domain <domain-name> --password <ddns-password>

  Options
    --ip <someIp> IP to update record with. Defaults to current external IP.
    --host <host> Host the record belongs to, eg '@', 'www' etc. Defaults to '@'.
    --domain <domain-name> Domain to update, eg 'yourdomain.tld'
    --password <password> Dynamic DNS password

  Examples
    # Update the '@' record with a specific IP address
    $ namecheap-dns-updater --domain espen.codes --ip 127.0.0.1 --password myDdnsPassword

    # Update the 'www' record with your current external IP
    $ namecheap-dns-updater --host www --domain espen.codes --password myDdnsPassword

    # Update both '@' and 'www' records with your current external IP
    $ namecheap-dns-updater --host @ --host www --domain espen.codes --password myDdnsPassword

  Notes
    - The password is NOT your account password, it is a separate per-domain setting.
    - The values for the host and domain must be of the same case (lowercase/uppercase) as in your account.
    - Only IPv4 is supported at this time.
    - To update the wildcard subdomain, use '*' as the host

  Environment variables (fallbacks for missing flags)
    --host = NC_DDNS_HOST
    --domain = NC_DDNS_DOMAIN
    --password = NC_DDNS_PASSWORD
`,
  {
    importMeta: import.meta,
    flags: {
      ip: {
        type: 'string',
      },
      host: {
        type: 'string',
        isMultiple: true,
      },
      domain: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
  },
)

const options = {
  domain: trimEnv(process.env.NC_DDNS_DOMAIN),
  password: trimEnv(process.env.NC_DDNS_PASSWORD),
  ...cli.flags,
}

if (Array.isArray(options.host) && options.host.length === 0) {
  options.host = [trimEnv(process.env.NC_DDNS_HOST) || '@']
}

if (cli.flags.help) {
  cli.showHelp()
}

update(options)
