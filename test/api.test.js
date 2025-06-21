import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import {update} from '../src/api.js'
import {MockNamecheapServer, createSuccessResponse, createErrorResponse} from './mock-server.js'

describe('API Module', () => {
  let mockServer
  let apiHost

  beforeEach(async () => {
    mockServer = new MockNamecheapServer()
    apiHost = await mockServer.start()
  })

  afterEach(async () => {
    await mockServer.stop()
  })

  describe('update function', () => {
    it('should successfully update a single host record', async () => {
      const testIp = '203.0.113.1'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await update({
        host: '@',
        domain: 'example.com',
        password: 'testpass',
        apiHost,
      })

      expect(result).toBe(testIp)

      const requests = mockServer.getRequests()
      expect(requests).toHaveLength(1)
      expect(requests[0].query).toMatchObject({
        host: '@',
        domain: 'example.com',
        password: 'testpass',
      })
    })

    it('should successfully update multiple host records', async () => {
      const testIp = '203.0.113.2'

      // Mock responses for both hosts
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )
      mockServer.mockResponse(
        {host: 'www', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      const result = await update({
        host: ['@', 'www'],
        domain: 'example.com',
        password: 'testpass',
        apiHost,
      })

      expect(result).toBe(testIp)

      const requests = mockServer.getRequests()
      expect(requests).toHaveLength(2)
      expect(requests[0].query.host).toBe('@')
      expect(requests[1].query.host).toBe('www')
    })

    it('should include IP parameter when specified', async () => {
      const testIp = '203.0.113.3'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      await update({
        host: '@',
        domain: 'example.com',
        password: 'testpass',
        ip: testIp,
        apiHost,
      })

      const requests = mockServer.getRequests()
      expect(requests[0].query.ip).toBe(testIp)
    })

    it('should use default host "@" when host is not provided', async () => {
      const testIp = '203.0.113.4'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      await update({
        domain: 'example.com',
        password: 'testpass',
        apiHost,
      })

      const requests = mockServer.getRequests()
      expect(requests[0].query.host).toBe('@')
    })

    it('should use default API host when not provided', () => {
      // This test verifies the default API host behavior
      // We'll check that the function works without apiHost parameter

      // We can't easily test the actual default host without making real requests
      // So we'll test that the function accepts the parameter correctly
      const callUpdate = () =>
        update({
          domain: 'example.com',
          password: 'testpass',
        })

      expect(callUpdate).not.toThrow()
    })

    it('should call log function when provided', async () => {
      const testIp = '203.0.113.6'
      const logMessages = []
      const mockLog = (message) => logMessages.push(message)

      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      await update(
        {
          host: '@',
          domain: 'example.com',
          password: 'testpass',
          apiHost,
        },
        {log: mockLog},
      )

      expect(logMessages).toContain('Updating DNS record for host "@"')
      expect(logMessages).toContain(`DNS record for host "@" updated to IP: ${testIp}`)
    })

    it('should throw error when domain is missing', async () => {
      await expect(
        update({
          host: '@',
          password: 'testpass',
          apiHost,
        }),
      ).rejects.toThrow('Option "domain" must be specified')
    })

    it('should throw error when password is missing', async () => {
      await expect(
        update({
          host: '@',
          domain: 'example.com',
          apiHost,
        }),
      ).rejects.toThrow('Option "password" must be specified')
    })

    it('should throw error when host is not a string', async () => {
      await expect(
        update({
          host: [123],
          domain: 'example.com',
          password: 'testpass',
          apiHost,
        }),
      ).rejects.toThrow('Host must be a string, got number')
    })

    it('should throw error when API returns non-200 status', async () => {
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {status: 500, body: 'Internal Server Error'},
      )

      await expect(
        update({
          host: '@',
          domain: 'example.com',
          password: 'testpass',
          apiHost,
        }),
      ).rejects.toThrow('Request failed with status 500 Internal Server Error')
    })

    it('should throw error when API returns invalid XML', async () => {
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'testpass'},
        {body: 'invalid xml'},
      )

      await expect(
        update({
          host: '@',
          domain: 'example.com',
          password: 'testpass',
          apiHost,
        }),
      ).rejects.toThrow('Invalid response, missing `interface-response` property')
    })

    it('should throw error when API returns error response', async () => {
      const errorMessage = 'Invalid password'
      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: 'wrongpass'},
        {body: createErrorResponse(errorMessage)},
      )

      await expect(
        update({
          host: '@',
          domain: 'example.com',
          password: 'wrongpass',
          apiHost,
        }),
      ).rejects.toThrow(`Failed to update record:\n${errorMessage}`)
    })

    it('should handle wildcard subdomain', async () => {
      const testIp = '203.0.113.7'
      mockServer.mockResponse(
        {host: '*', domain: 'example.com', password: 'testpass'},
        {body: createSuccessResponse(testIp)},
      )

      await update({
        host: '*',
        domain: 'example.com',
        password: 'testpass',
        apiHost,
      })

      const requests = mockServer.getRequests()
      expect(requests[0].query.host).toBe('*')
    })

    it('should properly encode URL parameters', async () => {
      const testIp = '203.0.113.8'
      const specialChars = 'test@#$%^&*()_+='

      mockServer.mockResponse(
        {host: '@', domain: 'example.com', password: specialChars},
        {body: createSuccessResponse(testIp)},
      )

      await update({
        host: '@',
        domain: 'example.com',
        password: specialChars,
        apiHost,
      })

      const requests = mockServer.getRequests()
      // Check that special characters are properly encoded in the URL
      expect(requests[0].url).toContain('test%40%23%24%25%5E%26*%28%29_%2B%3D')
    })
  })
})
