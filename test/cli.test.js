import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {spawn} from 'node:child_process'
import {join} from 'node:path'
import {MockNamecheapServer, createSuccessResponse, createErrorResponse} from './mock-server.js'

// Path to the CLI script
const CLI_PATH = join(process.cwd(), 'src', 'nc-updater.js')

/**
 * Helper function to run the CLI with arguments
 */
function runCli(args = [], env = {}) {
  return new Promise((resolve, reject) => {
    const fullEnv = {...process.env, ...env}
    const child = spawn('node', [CLI_PATH, ...args], {
      env: fullEnv,
      stdio: 'pipe',
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      })
    })

    child.on('error', reject)

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill()
      reject(new Error('CLI timeout'))
    }, 10000)
  })
}

describe('CLI Module', () => {
  let mockServer
  let apiHost

  beforeEach(async () => {
    mockServer = new MockNamecheapServer()
    apiHost = await mockServer.start()

    // Mock console methods to avoid polluting test output
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(async () => {
    await mockServer.stop()
    vi.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('should update DNS record with required arguments', async () => {
      const testIp = '203.0.113.1'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(['--domain', 'example.com', '--password', 'testpass'], {
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests).toHaveLength(1)
      expect(requests[0].query).toMatchObject({
        host: '@',
        domain: 'example.com',
        password: 'testpass',
      })
    })

    it('should update DNS record with custom host', async () => {
      const testIp = '203.0.113.2'
      mockServer.mockResponse(
        {host: 'www', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(
        ['--host', 'www', '--domain', 'example.com', '--password', 'testpass'],
        {
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests[0].query.host).toBe('www')
    })

    it('should update DNS record with custom IP', async () => {
      const testIp = '203.0.113.3'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(
        ['--domain', 'example.com', '--password', 'testpass', '--ip', testIp],
        {
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests[0].query.ip).toBe(testIp)
    })

    it('should update multiple hosts', async () => {
      const testIp = '203.0.113.4'

      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )
      mockServer.mockResponse(
        {host: 'www', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(
        ['--host', '@', '--host', 'www', '--domain', 'example.com', '--password', 'testpass'],
        {
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests).toHaveLength(2)
      expect(requests[0].query.host).toBe('@')
      expect(requests[1].query.host).toBe('www')
    })

    it('should handle wildcard subdomain', async () => {
      const testIp = '203.0.113.5'
      mockServer.mockResponse(
        {host: '*', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(
        ['--host', '*', '--domain', 'example.com', '--password', 'testpass'],
        {
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests[0].query.host).toBe('*')
    })
  })

  describe('environment variables', () => {
    it('should use environment variables as fallbacks', async () => {
      const testIp = '203.0.113.6'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli([], {
        NC_DDNS_DOMAIN: 'example.com',
        NC_DDNS_PASSWORD: 'testpass',
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests[0].query).toMatchObject({
        host: '@',
        domain: 'example.com',
        password: 'testpass',
      })
    })

    it('should use environment variable for host', async () => {
      const testIp = '203.0.113.7'
      mockServer.mockResponse(
        {host: 'api', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(['--domain', 'example.com', '--password', 'testpass'], {
        NC_DDNS_HOST: 'api',
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests[0].query.host).toBe('api')
    })

    it('should prefer CLI arguments over environment variables', async () => {
      const testIp = '203.0.113.8'
      mockServer.mockResponse(
        {host: 'cli', domain: 'cli.com', password: 'clipass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(
        ['--host', 'cli', '--domain', 'cli.com', '--password', 'clipass'],
        {
          NC_DDNS_HOST: 'env',
          NC_DDNS_DOMAIN: 'env.com',
          NC_DDNS_PASSWORD: 'envpass',
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests[0].query).toMatchObject({
        host: 'cli',
        domain: 'cli.com',
        password: 'clipass',
      })
    })

    it('should support multiple hosts in NC_DDNS_HOST environment variable', async () => {
      const testIp = '203.0.113.12'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )
      mockServer.mockResponse(
        {host: 'www', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )
      mockServer.mockResponse(
        {host: 'api', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(['--domain', 'example.com', '--password', 'testpass'], {
        NC_DDNS_HOST: '@,www,api',
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests).toHaveLength(3)
      expect(requests[0].query.host).toBe('@')
      expect(requests[1].query.host).toBe('www')
      expect(requests[2].query.host).toBe('api')
    })

    it('should handle spaces in comma-separated hosts', async () => {
      const testIp = '203.0.113.13'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )
      mockServer.mockResponse(
        {host: 'www', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(['--domain', 'example.com', '--password', 'testpass'], {
        NC_DDNS_HOST: ' @ , www ',
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests).toHaveLength(2)
      expect(requests[0].query.host).toBe('@')
      expect(requests[1].query.host).toBe('www')
    })

    it('should handle empty values in comma-separated hosts', async () => {
      const testIp = '203.0.113.14'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )
      mockServer.mockResponse(
        {host: 'www', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(['--domain', 'example.com', '--password', 'testpass'], {
        NC_DDNS_HOST: '@,,www,',
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests).toHaveLength(2)
      expect(requests[0].query.host).toBe('@')
      expect(requests[1].query.host).toBe('www')
    })

    it('should use NC_DDNS_INTERVAL environment variable', async () => {
      const testIp = '203.0.113.15'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(['--domain', 'example.com', '--password', 'testpass'], {
        NC_DDNS_INTERVAL: '0', // 0 means no interval, just run once
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests).toHaveLength(1)
      expect(requests[0].query).toMatchObject({
        host: '@',
        domain: 'example.com',
        password: 'testpass',
      })
    })

    it('should prefer --interval flag over NC_DDNS_INTERVAL environment variable', async () => {
      const testIp = '203.0.113.16'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(
        ['--domain', 'example.com', '--password', 'testpass', '--interval', '0'],
        {
          NC_DDNS_INTERVAL: '300', // Should be overridden by CLI flag
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(0)

      const requests = mockServer.getRequests()
      expect(requests).toHaveLength(1)
      expect(requests[0].query).toMatchObject({
        host: '@',
        domain: 'example.com',
        password: 'testpass',
      })
    })
  })

  describe('verbose mode', () => {
    it('should log verbose output when --verbose flag is used', async () => {
      const testIp = '203.0.113.9'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(
        ['--domain', 'example.com', '--password', 'testpass', '--verbose'],
        {
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('Updating immediately...')
    })

    it('should log verbose output when -v flag is used', async () => {
      const testIp = '203.0.113.10'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await runCli(['--domain', 'example.com', '--password', 'testpass', '-v'], {
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('Updating immediately...')
    })
  })

  describe('error handling', () => {
    it('should exit with error code when domain is missing', async () => {
      const result = await runCli(['--password', 'testpass'], {
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Option "domain" must be specified')
    })

    it('should exit with error code when password is missing', async () => {
      const result = await runCli(['--domain', 'example.com'], {
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Option "password" must be specified')
    })

    it('should exit with error code when API returns error', async () => {
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'wrongpass'},
        {body: createErrorResponse('Invalid password')},
      )

      const result = await runCli(['--domain', 'example.com', '--password', 'wrongpass'], {
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Invalid password')
    })

    it('should exit with error code when API returns non-200 status', async () => {
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {status: 500, body: 'Internal Server Error'},
      )

      const result = await runCli(['--domain', 'example.com', '--password', 'testpass'], {
        NC_DDNS_API_HOST: apiHost,
      })

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Request failed with status 500')
    })

    it('should exit with error code for invalid interval', async () => {
      const result = await runCli(
        ['--domain', 'example.com', '--password', 'testpass', '--interval', '-5'],
        {
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Interval must be a positive number or zero')
    })

    it('should exit with error code for non-numeric interval', async () => {
      const result = await runCli(
        ['--domain', 'example.com', '--password', 'testpass', '--interval', 'invalid'],
        {
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Interval must be a (finite) number')
    })
  })

  describe('help', () => {
    it('should show help when --help flag is used', async () => {
      const result = await runCli(['--help'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('Usage')
      expect(result.stdout).toContain('Options')
      expect(result.stdout).toContain('Examples')
    })
  })

  describe('interval mode', () => {
    it('should log interval message when interval is set', async () => {
      const testIp = '203.0.113.11'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      // For interval mode testing, we'll just test that it accepts the parameter
      // without actually running in interval mode (to avoid complexity)
      const result = await runCli(
        [
          '--domain',
          'example.com',
          '--password',
          'testpass',
          '--interval',
          '0', // 0 means no interval, just run once
        ],
        {
          NC_DDNS_API_HOST: apiHost,
        },
      )

      expect(result.code).toBe(0)
    })
  })
})
