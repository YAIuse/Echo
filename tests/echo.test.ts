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

	describe('Инициализация', () => {
		test('Создает экземпляр', () => {
			expect(echo).toBeDefined()
		})

		test('Создает новый независимый экземпляр', () => {
			const echoFull = new Echo()
			const instance1 = echoFull.create()
			const instance2 = echoFull.create()

			expect(instance1.interceptors).not.toBe(instance2.interceptors)
		})
	})

	describe('Стандартизация', () => {
		test('Отдача EchoResponse', async () => {
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

		test('Отдача EchoError', async () => {
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

		test('Не перехватывает EchoError в request interceptors (они идут в response)', async () => {
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

		test('Выполнение цепочки перехватчиков', async () => {
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

		test('Перехватывает ошибки', async () => {
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

		test('Перехватывает несколько ошибок', async () => {
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

		test('Обрабатывает ошибки в цепочке fulfilled', async () => {
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

		test('Повторно выбрасывает необработанные ошибки', async () => {
			fetchMockRequestNetworkError()

			const errorHandler = jest.fn(error => error)

			echo.interceptors.request.use('pass-through', null, errorHandler)

			await expect(echo.get('/test')).rejects.toThrow(EchoError)
			expect(errorHandler).toHaveBeenCalled()
		})

		test('Добавляет, удаляет и очищает перехватчики', async () => {
			fetchMockResponseJsonSuccess()

			const interceptor1 = jest.fn(config => {
				config.headers = { ...config.headers, 'X-Interceptor1': 'value1' }
				return config
			})

			const interceptor2 = jest.fn(config => {
				config.headers = { ...config.headers, 'X-Interceptor2': 'value2' }
				return config
			})

			// 1. Проверяем добавление
			echo.interceptors.request.use('id1', interceptor1)
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)

			// 2. Проверяем удаление
			echo.interceptors.request.eject('id1')
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)

			// 3. Проверяем добавление второго
			echo.interceptors.request.use('id2', interceptor2)
			await echo.get('/test')
			expect(interceptor2).toHaveBeenCalledTimes(1)

			// 4. Проверяем очистку
			echo.interceptors.request.clear()
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)
			expect(interceptor2).toHaveBeenCalledTimes(1)
		})
	})

	describe('Response Interceptors', () => {
		test('Модифицирует ответ', async () => {
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

		test('Выполнение цепочки перехватчиков', async () => {
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

		test('Перехватывает ошибки', async () => {
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

		test('Перехватывает несколько ошибок', async () => {
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

		test('Обрабатывает ошибки в цепочке fulfilled', async () => {
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

		test('Повторно выбрасывает необработанные ошибки', async () => {
			fetchMockResponseJsonFailed()

			const errorHandler = jest.fn(error => error)

			echo.interceptors.response.use('pass-through', null, errorHandler)

			await expect(echo.get('/test')).rejects.toThrow(EchoError)
			expect(errorHandler).toHaveBeenCalled()
		})

		test('Добавляет, удаляет и очищает перехватчики', async () => {
			fetchMockResponseJsonSuccess()

			const interceptor1 = jest.fn(response => {
				response.data = { ...response.data, modifiedBy: 'interceptor1' }
				return response
			})

			const interceptor2 = jest.fn(response => {
				response.data = { ...response.data, modifiedBy: 'interceptor2' }
				return response
			})

			// 1. Проверяем добавление
			echo.interceptors.response.use('id1', interceptor1)
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)

			// 2. Проверяем удаление
			echo.interceptors.response.eject('id1')
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)

			// 3. Проверяем добавление второго
			echo.interceptors.response.use('id2', interceptor2)
			await echo.get('/test')
			expect(interceptor2).toHaveBeenCalledTimes(1)

			// 4. Проверяем очистку
			echo.interceptors.response.clear()
			await echo.get('/test')
			expect(interceptor1).toHaveBeenCalledTimes(1)
			expect(interceptor2).toHaveBeenCalledTimes(1)
		})
	})

	describe('Управление перехватчиками', () => {
		test('Удаление несуществующих перехватчиков не вызывает ошибки', () => {
			expect(() => {
				echo.interceptors.request.eject('non-existent-id')
			}).not.toThrow()

			expect(() => {
				echo.interceptors.request.clear()
			}).not.toThrow()
		})

		test('Повторное добавление перехватчика с тем же ключом заменяет старый', async () => {
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

		test('Независимость перехватчиков', async () => {
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

		test('Перехватчики сохраняются между запросами', async () => {
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

	describe('Комбинированные сценарии', () => {
		test('Авторизация с обновлением токена', async () => {
			let token = 'expired-token'

			// Request: добавляем токен
			echo.interceptors.request.use('auth', config => {
				config.headers = {
					...config.headers,
					Authorization: `Bearer ${token}`
				}
				return config
			})

			// Response: обрабатываем 401 и обновляем токен
			echo.interceptors.response.use('auth', null, async error => {
				if (error instanceof EchoError && error.response?.status === 401) {
					token = 'new-token'
					return echo.request(error.config)
				}
				throw error
			})

			// Первый вызов: 401
			fetchMock.mockResponseOnce(JSON.stringify({ error: 'Token expired' }), {
				status: 401
			})
			// Второй вызов: успех
			fetchMock.mockResponseOnce(JSON.stringify({ ok: true }), {
				status: 200
			})

			const response = await echo.get('/protected')

			expect(response.status).toBe(200)
			expect(fetchMock).toHaveBeenCalledTimes(2)

			// Проверяем заголовки
			const firstCall = fetchMock.mock.calls[0][1] as any
			const secondCall = fetchMock.mock.calls[1][1] as any

			expect(firstCall.headers.Authorization).toBe('Bearer expired-token')
			expect(secondCall.headers.Authorization).toBe('Bearer new-token')
		})
	})

	describe('Edge cases', () => {
		test('Перехватчик выбрасывает не Error', async () => {
			echo.interceptors.response.use('throw-non-error', () => {
				throw 'string error'
			})

			fetchMockResponseJsonSuccess()

			await expect(echo.get('/test')).rejects.toBe('string error')
		})

		test('Перехватчик возвращает не EchoResponse', async () => {
			echo.interceptors.response.use('weird', () => {
				return { custom: 'data' } as any
			})

			fetchMockResponseJsonSuccess()

			const response = await echo.get('/test')

			expect(response).toEqual({ custom: 'data' })
		})

		test('Перехватчики отдают ошибку', async () => {
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
