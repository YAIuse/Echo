import fetchMock from 'jest-fetch-mock'

import { Echo, EchoError, type EchoInstance } from '../src'

fetchMock.enableMocks()

describe('Echo', () => {
	let echo: EchoInstance

	const baseConfig = {
		baseURL: 'https://api.example.com/api',
		headers: { 'Content-Type': 'application/json' }
	}

	const mockReqJson = (status: number) => ({
		status,
		headers: { 'Content-Type': 'application/json' }
	})

	const fetchMockResponseJsonSuccess = () =>
		fetchMock.mockResponseOnce(
			JSON.stringify({ success: true }),
			mockReqJson(200)
		)

	const fetchMockResponseJsonFailed = () =>
		fetchMock.mockResponseOnce(
			JSON.stringify({ error: true }),
			mockReqJson(404)
		)

	beforeEach(() => {
		echo = new Echo().create(baseConfig)
		fetchMock.resetMocks()
	})

	afterEach(() => {
		fetchMock.resetMocks()
	})

	describe('Инициализация', () => {
		test('Создает экземпляр', () => {
			expect(echo).toBeDefined()
			expect(typeof echo.request).toBe('function')
			expect(typeof echo.get).toBe('function')
			expect(echo.interceptors).toBeDefined()
		})

		test('Создает новый независимый экземпляр', () => {
			const echoFull = new Echo()
			const instance1 = echoFull.create()
			const instance2 = echoFull.create()

			expect(instance1).not.toBe(instance2)
			expect(instance1.interceptors).not.toBe(instance2.interceptors)
		})
	})

	describe('Request Interceptors', () => {
		test('Модифицирует конфигурацию запроса', async () => {
			const requestHandler = jest.fn(config => {
				config.headers = { ...config.headers, 'X-Custom': 'value' }
				return config
			})

			echo.interceptors.request.use('test', requestHandler)
			fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
				status: 200
			})

			await echo.get('/test')

			expect(requestHandler).toHaveBeenCalled()
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/test',
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'X-Custom': 'value'
					})
				})
			)
		})

		test('Цепочка перехватчиков выполняется последовательно', async () => {
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

			fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
				status: 200
			})
			await echo.get('/test')

			expect(calls).toEqual(['first', 'second'])
			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'X-First': '1',
						'X-Second': '2'
					})
				})
			)
		})

		test('Обрабатывает ошибки в цепочке fulfilled', async () => {
			const errorHandler = jest.fn(error => {
				expect(error).toBeInstanceOf(Error)
				return { data: 'handled', status: 200 }
			})

			echo.interceptors.request.use(
				'error-thrower',
				() => {
					throw new Error('Test error')
				},
				errorHandler
			)

			const response = await echo.get('/test')

			expect(errorHandler).toHaveBeenCalled()
			expect(response.data).toBe('handled')
			expect(response.status).toBe(200)
		})

		test('Перехватывает сетевые ошибки в reject цепочке', async () => {
			const errorHandler = jest.fn(error => {
				expect(error.message).toBe('Network error')
				return { data: 'recovered', status: 200 }
			})

			echo.interceptors.request.use('network-handler', null, errorHandler)
			fetchMock.mockRejectOnce(new Error('Network error'))

			const response = await echo.get('/test')

			expect(errorHandler).toHaveBeenCalled()
			expect(response.data).toBe('recovered')
		})

		test('Не перехватывает EchoError в request interceptors (они идут в response)', async () => {
			const requestHandler = jest.fn()
			const responseHandler = jest.fn(error => {
				expect(error).toBeInstanceOf(EchoError)
				return { data: 'handled-in-response', status: 200 }
			})

			echo.interceptors.request.use('req', null, requestHandler)
			echo.interceptors.response.use('resp', null, responseHandler)

			fetchMockResponseJsonFailed()

			const response = await echo.get('/test')

			expect(requestHandler).not.toHaveBeenCalled()
			expect(responseHandler).toHaveBeenCalled()
			expect(response.data).toBe('handled-in-response')
		})

		test('Добавляет, удаляет и очищает перехватчики', async () => {
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
			const responseHandler = jest.fn(response => {
				response.data = { ...response.data, modified: true }
				return response
			})

			echo.interceptors.response.use('modifier', responseHandler)
			fetchMockResponseJsonSuccess()

			const response = await echo.get('/test')

			expect(responseHandler).toHaveBeenCalledTimes(1)
			expect(response.data).toEqual({ success: true, modified: true })
		})

		test('Цепочка response перехватчиков', async () => {
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

			fetchMockResponseJsonSuccess()

			const response = await echo.get('/test')

			expect(calls).toEqual(['first', 'second'])
			expect(response.data).toEqual({
				success: true,
				first: true,
				second: true
			})
		})

		test('Обрабатывает HTTP ошибки (EchoError)', async () => {
			const errorHandler = jest.fn(error => {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.response?.status).toBe(404)
				return { data: 'not-found-handled', status: 200 }
			})

			echo.interceptors.response.use('404-handler', null, errorHandler)

			fetchMockResponseJsonFailed()

			const response = await echo.get('/test')

			expect(errorHandler).toHaveBeenCalledTimes(1)
			expect(response.data).toBe('not-found-handled')
		})

		test('Повторно выбрасывает необработанные ошибки', async () => {
			const errorHandler = jest.fn(error => error)

			echo.interceptors.response.use('pass-through', null, errorHandler)

			fetchMockResponseJsonFailed()

			await expect(echo.get('/test')).rejects.toThrow(EchoError)
			expect(errorHandler).toHaveBeenCalled()
		})

		test('Добавляет, удаляет и очищает перехватчики', async () => {
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

			fetchMockResponseJsonSuccess()

			await echo.get('/test')

			expect(firstInterceptor).not.toHaveBeenCalled()
			expect(secondInterceptor).toHaveBeenCalledTimes(1)
			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'X-Second': 'second'
					})
				})
			)
		})

		test('Независимость перехватчиков', async () => {
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
			const interceptor = jest.fn(config => {
				config.headers = { ...config.headers, 'X-Persistent': 'yes' }
				return config
			})

			echo.interceptors.request.use('persistent', interceptor)

			// Первый запрос
			fetchMockResponseJsonSuccess()
			await echo.get('/test1')
			expect(interceptor).toHaveBeenCalledTimes(1)

			// Второй запрос
			fetchMockResponseJsonSuccess()
			await echo.get('/test2')
			expect(interceptor).toHaveBeenCalledTimes(2)

			// Третий запрос
			echo.interceptors.request.clear()
			fetchMockResponseJsonSuccess()
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
			fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
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

		test('Перехватчик отдает ошибку', async () => {
			const requestRejectInterceptor = jest.fn(() => {
				return new SyntaxError('Reject request')
			})
			const responseRejectInterceptor = jest.fn(() => {
				return new EchoError('Reject response', {} as any, {} as any)
			})

			echo.interceptors.request.use(
				'reject-thrower',
				null,
				requestRejectInterceptor
			)
			echo.interceptors.response.use(
				'response-thrower',
				null,
				responseRejectInterceptor
			)

			fetchMock.mockRejectOnce(new Error('Request error'))

			await expect(echo.get('/test')).rejects.toThrow('Reject request')
			expect(requestRejectInterceptor).toHaveBeenCalledTimes(1)

			fetchMockResponseJsonFailed()

			await expect(echo.get('/test')).rejects.toThrow('Reject response')
			expect(responseRejectInterceptor).toHaveBeenCalledTimes(1)
		})
	})
})
