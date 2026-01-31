import { Echo, EchoError, type EchoInstance, isEchoError } from '../src'

import {
	fetchMock,
	fetchMockCheckRequest,
	fetchMockRequestNetworkError,
	fetchMockResponseJsonFailed,
	fetchMockResponseJsonSuccess
} from './fetch-mock'

fetchMock.enableMocks()

describe('Echo', () => {
	let echo: EchoInstance

	beforeEach(() => {
		echo = new Echo().create({
			baseURL: 'https://api.example.com/api',
			headers: { 'Content-Type': 'application/json' }
		})
		fetchMock.resetMocks()
	})

	afterEach(() => {
		fetchMock.resetMocks()
	})

	describe('Initialization', () => {
		test('Creates an instance', () => {
			expect(echo).toBeDefined()
		})

		test('Creates a new independent instance', () => {
			const echoFull = new Echo()
			const instance1 = echoFull.create()
			const instance2 = echoFull.create()

			expect(instance1.interceptors).not.toBe(instance2.interceptors)
		})
	})

	describe('Standardization', () => {
		test('EchoResponse output', async () => {
			fetchMockResponseJsonSuccess()

			const response = await echo.get('/')
			expect(response).toMatchObject({
				data: expect.anything(),
				status: expect.any(Number),
				statusText: expect.any(String),
				headers: expect.any(Object),
				config: expect.objectContaining({
					baseURL: expect.any(String),
					headers: expect.any(Object),
					method: expect.any(String),
					url: expect.any(String)
				}),
				request: expect.objectContaining({
					headers: expect.any(Object),
					method: expect.any(String),
					url: expect.any(String)
				})
			})

			expect(response.data).toEqual({ ok: true })
			expect(response.status).toBe(200)
			expect(response.statusText).toBe('OK')
			expect(response.headers).toEqual({
				'content-type': 'application/json'
			})
			expect(response.config).toEqual({
				baseURL: 'https://api.example.com/api',
				headers: { 'Content-Type': 'application/json' },
				method: 'GET',
				url: '/'
			})
			expect(response.request).toEqual({
				headers: { 'Content-Type': 'application/json' },
				method: 'GET',
				url: 'https://api.example.com/api'
			})
		})

		test('EchoError output', async () => {
			fetchMockResponseJsonFailed()

			try {
				await echo.get('/error-response')
			} catch (err) {
				expect(err).toBeInstanceOf(EchoError)
				if (isEchoError(err)) {
					expect(err.message).toEqual({ ok: false })
					expect(err.config).toEqual({
						baseURL: 'https://api.example.com/api',
						headers: { 'Content-Type': 'application/json' },
						method: 'GET',
						url: '/error-response'
					})
					expect(err.request).toEqual({
						headers: { 'Content-Type': 'application/json' },
						method: 'GET',
						url: 'https://api.example.com/api/error-response'
					})
					expect(err.response?.data).toEqual({ ok: false })
					expect(err.response?.status).toBe(404)
					expect(err.response?.statusText).toBe('Not Found')
					expect(err.response?.headers).toEqual({
						'content-type': 'application/json'
					})
					expect(err.response?.config).toEqual({
						baseURL: 'https://api.example.com/api',
						headers: { 'Content-Type': 'application/json' },
						method: 'GET',
						url: '/error-response'
					})
					expect(err.response?.request).toEqual({
						headers: { 'Content-Type': 'application/json' },
						method: 'GET',
						url: 'https://api.example.com/api/error-response'
					})
				}
			}

			fetchMockRequestNetworkError()

			try {
				await echo.get('/error-request')
			} catch (err) {
				expect(err).toBeInstanceOf(EchoError)
				if (isEchoError(err)) {
					expect(err.message).toEqual('Network Error')
					expect(err.config).toEqual({
						baseURL: 'https://api.example.com/api',
						headers: { 'Content-Type': 'application/json' },
						method: 'GET',
						url: '/error-request'
					})
					expect(err.request).toEqual({
						headers: { 'Content-Type': 'application/json' },
						method: 'GET',
						url: 'https://api.example.com/api/error-request'
					})
					expect(err.response).toBeUndefined()
				}
			}
		})

		test('Does not intercept EchoError in request interceptors (they go to response)', async () => {
			fetchMockResponseJsonFailed()

			const requestHandler = jest.fn()
			const responseHandler = jest.fn(error => {
				expect(error).toBeInstanceOf(EchoError)
				return { data: 'handled-in-response', status: 200 }
			})

			echo.interceptors.request.use('req', null, requestHandler)
			echo.interceptors.response.use('resp', null, responseHandler)

			const response = await echo.get('/test')

			expect(requestHandler).not.toHaveBeenCalled()
			expect(responseHandler).toHaveBeenCalled()
			expect(response.data).toBe('handled-in-response')
		})
	})

	describe('Request Interceptors', () => {
		test('Модифицирует конфигурацию запроса', async () => {
			fetchMockResponseJsonSuccess()

			const requestHandler = jest.fn(config => {
				config.headers = { ...config.headers, 'X-Custom': 'value' }
				return config
			})

			echo.interceptors.request.use('test', requestHandler)

			await echo.get('/test')

			expect(requestHandler).toHaveBeenCalled()
			fetchMockCheckRequest('https://api.example.com/api/test', {
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'X-Custom': 'value'
				})
			})
		})

		test('Executing a chain of interceptors', async () => {
			fetchMockResponseJsonSuccess()

			const calls: string[] = []

			echo.interceptors.request.use('first', config => {
				calls.push('first')
				config.headers = { ...config.headers, 'X-First': '1' }
				return config
			})

			echo.interceptors.request.use('second', config => {
				calls.push('second')
				config.headers = { ...config.headers, 'X-Second': '2' }
				return config
			})

			await echo.get('/test')

			expect(calls).toEqual(['first', 'second'])
			fetchMockCheckRequest(undefined, {
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'X-First': '1',
					'X-Second': '2'
				})
			})
		})

		test('Intercepts errors', async () => {
			fetchMockRequestNetworkError()

			const errorHandler = jest.fn(error => {
				expect(error.message).toBe('Network Error')
				return { data: 'recovered', status: 200 }
			})

			echo.interceptors.request.use('network-handler', null, errorHandler)

			const response = await echo.get('/test')

			expect(errorHandler).toHaveBeenCalled()
			expect(response.data).toBe('recovered')
		})

		test('Intercepts several errors', async () => {
			fetchMockRequestNetworkError()

			const errorHandler1 = jest.fn(error => error)
			const errorHandler2 = jest.fn(error => {
				expect(error).toBeInstanceOf(Error)
				return { data: 'handled', status: 200 }
			})

			echo.interceptors.request.use('error1', null, errorHandler1)
			echo.interceptors.request.use('error2', null, errorHandler2)

			const response = await echo.get('/test')

			expect(errorHandler1).toHaveBeenCalled()
			expect(errorHandler2).toHaveBeenCalled()

			expect(response.data).toBe('handled')
			expect(response.status).toBe(200)
		})

		test('Handles errors in the fulfilled chain', async () => {
			const errorHandler = jest.fn(error => {
				expect(error).toBeInstanceOf(Error)
				return { data: 'handled', status: 200 }
			})

			echo.interceptors.request.use(
				'error-thrower',
				() => {
					throw new Error('Request error')
				},
				errorHandler
			)

			const response = await echo.get('/test')

			expect(errorHandler).toHaveBeenCalled()
			expect(response.data).toBe('handled')
			expect(response.status).toBe(200)
		})

		test('Re-throws raw errors', async () => {
			fetchMockRequestNetworkError()

			const errorHandler = jest.fn(error => error)

			echo.interceptors.request.use('pass-through', null, errorHandler)

			await expect(echo.get('/test')).rejects.toThrow(EchoError)
			expect(errorHandler).toHaveBeenCalled()
		})

		test('Adds, removes, and clears interceptors', async () => {
			fetchMockResponseJsonSuccess()

			const interceptor1 = jest.fn(config => {
				config.headers = { ...config.headers, 'X-Interceptor1': 'value1' }
				return config
			})

			const interceptor2 = jest.fn(config => {
				config.headers = { ...config.headers, 'X-Interceptor2': 'value2' }
				return config
			})

			echo.interceptors.request.use('id1', interceptor1)
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)

			echo.interceptors.request.eject('id1')
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)

			echo.interceptors.request.use('id2', interceptor2)
			await echo.get('/test')
			expect(interceptor2).toHaveBeenCalledTimes(1)

			echo.interceptors.request.clear()
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)
			expect(interceptor2).toHaveBeenCalledTimes(1)
		})
	})

	describe('Response Interceptors', () => {
		test('Modifies the response', async () => {
			fetchMockResponseJsonSuccess()

			const responseHandler = jest.fn(response => {
				response.data = { ...response.data, modified: true }
				return response
			})

			echo.interceptors.response.use('modifier', responseHandler)

			const response = await echo.get('/test')

			expect(responseHandler).toHaveBeenCalledTimes(1)
			expect(response.data).toEqual({ ok: true, modified: true })
		})

		test('Executing a chain of interceptors', async () => {
			fetchMockResponseJsonSuccess()

			const calls: string[] = []

			echo.interceptors.response.use('first', response => {
				calls.push('first')
				response.data.first = true
				return response
			})

			echo.interceptors.response.use('second', response => {
				calls.push('second')
				response.data.second = true
				return response
			})

			const response = await echo.get('/test')

			expect(calls).toEqual(['first', 'second'])
			expect(response.data).toEqual({
				ok: true,
				first: true,
				second: true
			})
		})

		test('Intercepts errors', async () => {
			fetchMockResponseJsonFailed()

			const errorHandler = jest.fn(error => {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.response?.status).toBe(404)
				return { data: 'not-found-handled', status: 200 }
			})

			echo.interceptors.response.use('404-handler', null, errorHandler)

			const response = await echo.get('/test')

			expect(errorHandler).toHaveBeenCalledTimes(1)
			expect(response.data).toBe('not-found-handled')
		})

		test('Intercepts several errors', async () => {
			fetchMockResponseJsonFailed()

			const errorHandler1 = jest.fn(error => error)
			const errorHandler2 = jest.fn(error => {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.response?.status).toBe(404)
				return { data: 'not-found-handled', status: 200 }
			})

			echo.interceptors.response.use('handler1', null, errorHandler1)
			echo.interceptors.response.use('handler2', null, errorHandler2)

			const response = await echo.get('/test')

			expect(errorHandler1).toHaveBeenCalledTimes(1)
			expect(errorHandler2).toHaveBeenCalledTimes(1)
			expect(response.data).toBe('not-found-handled')
		})

		test('Handles errors in the fulfilled chain', async () => {
			const errorHandler = jest.fn(error => {
				expect(error).toBeInstanceOf(Error)
				return { data: 'handled', status: 200 }
			})

			echo.interceptors.response.use(
				'error-thrower',
				() => {
					throw new Error('Response error')
				},
				errorHandler
			)

			const response = await echo.get('/test')

			expect(errorHandler).toHaveBeenCalled()
			expect(response.data).toBe('handled')
			expect(response.status).toBe(200)
		})

		test('Re-throws raw errors', async () => {
			fetchMockResponseJsonFailed()

			const errorHandler = jest.fn(error => error)

			echo.interceptors.response.use('pass-through', null, errorHandler)

			await expect(echo.get('/test')).rejects.toThrow(EchoError)
			expect(errorHandler).toHaveBeenCalled()
		})

		test('Adds, removes, and clears interceptors', async () => {
			fetchMockResponseJsonSuccess()

			const interceptor1 = jest.fn(response => {
				response.data = { ...response.data, modifiedBy: 'interceptor1' }
				return response
			})

			const interceptor2 = jest.fn(response => {
				response.data = { ...response.data, modifiedBy: 'interceptor2' }
				return response
			})

			echo.interceptors.response.use('id1', interceptor1)
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)

			echo.interceptors.response.eject('id1')
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)

			echo.interceptors.response.use('id2', interceptor2)
			await echo.get('/test')
			expect(interceptor2).toHaveBeenCalledTimes(1)

			echo.interceptors.response.clear()
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)
			expect(interceptor2).toHaveBeenCalledTimes(1)
		})
	})

	describe('Interceptor management', () => {
		test('Removing non-existent interceptors does not cause an error', () => {
			expect(() => {
				echo.interceptors.request.eject('non-existent-id')
			}).not.toThrow()

			expect(() => {
				echo.interceptors.request.clear()
			}).not.toThrow()
		})

		test('Re-adding the interceptor with the same key replaces the old one', async () => {
			fetchMockResponseJsonSuccess()

			const firstInterceptor = jest.fn(config => {
				config.headers = { ...config.headers, 'Content-Type': 'first' }
				return config
			})

			const secondInterceptor = jest.fn(config => {
				config.headers = { ...config.headers, 'X-Second': 'second' }
				return config
			})

			echo.interceptors.request.use('same-key', firstInterceptor)
			echo.interceptors.request.use('same-key', secondInterceptor)

			await echo.get('/test')

			expect(firstInterceptor).not.toHaveBeenCalled()
			expect(secondInterceptor).toHaveBeenCalledTimes(1)
			fetchMockCheckRequest(undefined, {
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'X-Second': 'second'
				})
			})
		})

		test('Independence of interceptors', async () => {
			fetchMockResponseJsonSuccess()

			const requestInterceptor = jest.fn()
			const responseInterceptor = jest.fn()

			echo.interceptors.request.use('req', requestInterceptor)
			echo.interceptors.response.use('resp', responseInterceptor)

			echo.interceptors.request.clear()

			await echo.get('/test')
			expect(requestInterceptor).not.toHaveBeenCalled()
			expect(responseInterceptor).toHaveBeenCalled()
		})

		test('Interceptors persist between requests', async () => {
			fetchMockResponseJsonSuccess()

			const interceptor = jest.fn(config => {
				config.headers = { ...config.headers, 'X-Persistent': 'yes' }
				return config
			})

			echo.interceptors.request.use('persistent', interceptor)

			// Первый запрос
			await echo.get('/test1')
			expect(interceptor).toHaveBeenCalledTimes(1)

			// Второй запрос
			await echo.get('/test2')
			expect(interceptor).toHaveBeenCalledTimes(2)

			// Третий запрос
			echo.interceptors.request.clear()
			await echo.get('/test3')
			expect(interceptor).toHaveBeenCalledTimes(2)
		})
	})

	describe('Combined scenarios', () => {
		test('Authorization with token renewal', async () => {
			let token = 'expired-token'

			echo.interceptors.request.use('auth', config => {
				config.headers = {
					...config.headers,
					Authorization: `Bearer ${token}`
				}
				return config
			})

			echo.interceptors.response.use('auth', null, async error => {
				if (error instanceof EchoError && error.response?.status === 401) {
					token = 'new-token'
					return echo.request(error.config)
				}
				throw error
			})

			fetchMock.mockResponseOnce(JSON.stringify({ error: 'Token expired' }), {
				status: 401
			})
			fetchMock.mockResponseOnce(JSON.stringify({ ok: true }), {
				status: 200
			})

			const response = await echo.get('/protected')

			expect(response.status).toBe(200)
			expect(fetchMock).toHaveBeenCalledTimes(2)

			const firstCall = fetchMock.mock.calls[0][1] as any
			const secondCall = fetchMock.mock.calls[1][1] as any

			expect(firstCall.headers.Authorization).toBe('Bearer expired-token')
			expect(secondCall.headers.Authorization).toBe('Bearer new-token')
		})
	})

	describe('Edge cases', () => {
		test('The interceptor throws a non-Error', async () => {
			echo.interceptors.response.use('throw-non-error', () => {
				throw 'string error'
			})

			fetchMockResponseJsonSuccess()

			await expect(echo.get('/test')).rejects.toBe('string error')
		})

		test('The interceptor does not return an EchoResponse', async () => {
			echo.interceptors.response.use('weird', () => {
				return { custom: 'data' } as any
			})

			fetchMockResponseJsonSuccess()

			const response = await echo.get('/test')

			expect(response).toEqual({ custom: 'data' })
		})

		test('Interceptors give an error', async () => {
			const requestRejectInterceptor = jest.fn(() => {
				return new SyntaxError('Reject request')
			})
			const responseRejectInterceptor = jest.fn(() => {
				return new SyntaxError('Reject response')
			})

			echo.interceptors.request.use(
				'request-thrower',
				null,
				requestRejectInterceptor
			)
			echo.interceptors.response.use(
				'response-thrower',
				null,
				responseRejectInterceptor
			)

			fetchMockRequestNetworkError()

			await expect(echo.get('/test')).rejects.toThrow('Reject request')
			expect(requestRejectInterceptor).toHaveBeenCalledTimes(1)

			fetchMockResponseJsonFailed()

			await expect(echo.get('/test')).rejects.toThrow('Reject response')
			expect(responseRejectInterceptor).toHaveBeenCalledTimes(1)
		})
	})
})
