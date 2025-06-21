import {createServer} from 'node:http'
import {parse} from 'node:url'

/**
 * Mock server to simulate Namecheap Dynamic DNS API
 */
export class MockNamecheapServer {
  constructor(options = {}) {
    this.port = options.port || 0
    this.server = null
    this.responses = new Map()
    this.requests = []
  }

  /**
   * Set up mock responses for specific requests
   */
  mockResponse(params, response) {
    const key = this.createKey(params)
    this.responses.set(key, response)
  }

  /**
   * Clear all mock responses and request history
   */
  reset() {
    this.responses.clear()
    this.requests = []
  }

  /**
   * Get all received requests
   */
  getRequests() {
    return [...this.requests]
  }

  /**
   * Start the mock server
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true)
        const query = parsedUrl.query

        // Store request for inspection
        this.requests.push({
          method: req.method,
          url: req.url,
          query,
          headers: req.headers,
        })

        // Find matching response
        const key = this.createKey(query)
        const mockResponse = this.responses.get(key) || this.responses.get('default')

        if (!mockResponse) {
          res.writeHead(404, {'Content-Type': 'text/plain'})
          res.end('Not Found')
          return
        }

        res.writeHead(mockResponse.status || 200, {
          'Content-Type': 'application/xml',
          ...mockResponse.headers,
        })
        res.end(mockResponse.body)
      })

      this.server.on('error', reject)

      this.server.listen(this.port, () => {
        this.port = this.server.address().port
        resolve(`http://localhost:${this.port}`)
      })
    })
  }

  /**
   * Stop the mock server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve)
      } else {
        resolve()
      }
    })
  }

  /**
   * Create a key for request matching
   */
  createKey(params) {
    if (!params) return 'default'
    return `${params.host || ''}-${params.domain || ''}-${params.password || ''}`
  }
}

/**
 * XML response templates
 */
export const createSuccessResponse = (
  ip = '192.168.1.1',
) => `<?xml version="1.0" encoding="utf-16"?>
<interface-response>
  <Command>SETDNSHOST</Command>
  <Language>eng</Language>
  <IP>${ip}</IP>
  <ErrCount>0</ErrCount>
  <ResponseCount>0</ResponseCount>
  <Done>true</Done>
  <debug><![CDATA[]]></debug>
</interface-response>`

export const createErrorResponse = (
  errorMessage = 'Invalid password',
) => `<?xml version="1.0" encoding="utf-16"?>
<interface-response>
  <Command>SETDNSHOST</Command>
  <Language>eng</Language>
  <ErrCount>1</ErrCount>
  <errors>
    <Err1>${errorMessage}</Err1>
  </errors>
  <ResponseCount>1</ResponseCount>
  <responses>
    <response>
      <ResponseNumber>316153</ResponseNumber>
      <ResponseString>${errorMessage}</ResponseString>
    </response>
  </responses>
  <Done>true</Done>
  <debug><![CDATA[]]></debug>
</interface-response>`
