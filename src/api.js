import {XMLParser} from 'fast-xml-parser'

const required = ['domain', 'password']

export async function update(options) {
  required.forEach((opt) => {
    if (!options[opt]) {
      throw new Error(`Option "${opt}" must be specified`)
    }
  })

  const qs = new URLSearchParams({
    host: options.host || '@',
    domain: options.domain,
    password: options.password,
  })

  if (options.ip) {
    qs.set('ip', options.ip)
  }

  const url = new URL(`https://dynamicdns.park-your-domain.com/update?${qs.toString()}`)

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

  return res['interface-response'].IP
}
