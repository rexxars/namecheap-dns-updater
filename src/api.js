import {XMLParser} from 'fast-xml-parser'

const required = ['domain', 'password']

export async function update(options, context = {}) {
  const log = context.log || (() => {})

  required.forEach((opt) => {
    if (!options[opt]) {
      throw new Error(`Option "${opt}" must be specified`)
    }
  })

  const hosts = Array.isArray(options.host) ? options.host : [options.host || '@']
  const apiHost = options.apiHost || 'https://dynamicdns.park-your-domain.com'

  let resolvedIp = options.ip
  for (const host of hosts) {
    if (typeof host !== 'string') {
      throw new Error(`Host must be a string, got ${typeof host}`)
    }

    const qs = new URLSearchParams({
      host,
      domain: options.domain,
      password: options.password,
    })

    if (options.ip) {
      qs.set('ip', options.ip)
    }

    const url = new URL(`${apiHost}/update?${qs.toString()}`)

    log(`Updating DNS record for host "${host}"`)
    const response = await fetch(url)
    if (response.status !== 200) {
      throw new Error(`Request failed with status ${response.status} ${response.statusText}`.trim())
    }

    const parser = new XMLParser()
    const res = parser.parse(await response.text())

    if (!res['interface-response']) {
      throw new Error('Invalid response, missing `interface-response` property')
    }

    if (res['interface-response'].ErrCount > 0) {
      const messages = Object.values(res['interface-response'].errors).filter(
        (err) => typeof err === 'string',
      )

      throw new Error(`Failed to update record:\n${messages.join('\n')}`)
    }

    resolvedIp = res['interface-response'].IP
    log(`DNS record for host "${host}" updated to IP: ${resolvedIp}`)
  }

  return resolvedIp
}
