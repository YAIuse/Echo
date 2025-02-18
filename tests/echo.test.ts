import fetchMock from 'jest-fetch-mock'
import { Echo, type EchoInstance } from 'src/echo'
import { EchoError } from 'src/error'
import type { EchoConfig } from 'src/types'

type EchoFullInstance = Omit<Echo, 'createConfig'>

fetchMock.enableMocks()

describe('Echo', () => {
	let echoFull: EchoFullInstance
	let echo: EchoInstance

	beforeEach(() => {
		;(echoFull = new Echo()),
			(echo = new Echo().create({
				baseURL: 'https://api.example.com/api',
				headers: { 'Content-Type': 'application/json' }
			}))
	})

	afterEach(() => {
		fetchMock.resetMocks()
	})

	test('Инициализация echo', () => {
		expect(echo).toBeDefined()
	})

	test('Создание экземпляра echo', () => {
		expect(echoFull).toBeDefined()
		const echoInstance = echoFull.create({
			baseURL: 'https://api.example.com/api',
			headers: { 'Content-Type': 'application/json' }
		})

		expect(echoInstance).toBeDefined()
		expect(echoInstance).not.toBe(echoFull)
	})

	describe('Request Interceptors', () => {
		test('Добавление перехватчика', async () => {
			const spy = jest.fn(config => {
				expect(config.method).toBe('GET')
				expect(config.url).toBe('/get')
				config.headers = { ...config.headers, Authorization: 'Bearer token' }
				return config
			})

			echo.interceptors.request.use('1', spy)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toEqual({ message: 'Success' })
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: 'Bearer token'
					})
				})
			)
			expect(spy).toHaveBeenCalled()
		})

		test('Добавление нескольких перехватчиков', async () => {
			const spy1 = jest.fn(config => {
				config.headers = { ...config.headers, First: 'first' }
				return config
			})
			const spy2 = jest.fn(config => {
				config.headers = { ...config.headers, Second: 'second' }
				return config
			})

			echo.interceptors.request.use('1', spy1)
			echo.interceptors.request.use('2', spy2)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toEqual({ message: 'Success' })
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						First: 'first',
						Second: 'second'
					})
				})
			)
			expect(spy1).toHaveBeenCalled()
			expect(spy2).toHaveBeenCalled()
		})

		test('Неправильное добавление перехватчиков', async () => {
			const spy1 = jest.fn(config => {
				config.headers = { ...config.headers, Authorization: 'Bearer token' }
				return config
			})
			const spy2 = jest.fn(config => {
				config.headers = { X: 'X' }
				return config
			})

			echo.interceptors.request.use('1', spy1)
			echo.interceptors.request.use('2', spy2)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toEqual({ message: 'Success' })
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.not.objectContaining({
						Authorization: 'Bearer token'
					})
				})
			)
			expect(spy1).toHaveBeenCalled()
			expect(spy2).toHaveBeenCalled()
		})

		test('Ошибка в перехватчике', async () => {
			const errorConfig: EchoConfig = { method: 'GET', url: '/error' }

			const spy1 = jest.fn(error => {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.message).toBe('Error request')
				return error
			})
			const spy2 = jest.fn(error => {
				return error
			})

			echo.interceptors.request.use(
				'1',
				() => {
					throw new EchoError('Error request', errorConfig, errorConfig)
				},
				spy1
			)
			echo.interceptors.request.use('rejectRequest', null, spy2)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			try {
				await echo.get('/get')
			} catch (error: any) {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.message).toBe('Error request')
			}

			expect(fetchMock).not.toHaveBeenCalled()
			expect(spy1).toHaveBeenCalled()
			expect(spy2).toHaveBeenCalled()
		})

		test('Ошибки в перехватчике без обработки', async () => {
			const errorConfig: EchoConfig = { method: 'GET', url: '/error' }

			const spy = jest.fn(() => {
				throw new EchoError('Error request', errorConfig, errorConfig)
			})

			echo.interceptors.request.use('1', spy)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			try {
				await echo.get('/get')
			} catch (error: any) {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.message).toBe('Error request')
			}

			expect(fetchMock).not.toHaveBeenCalled()
			expect(spy).toHaveBeenCalled()
		})

		test('Ошибка в перехватчике reject', async () => {
			const errorConfig: EchoConfig = { method: 'GET', url: '/error' }

			const spy1 = jest.fn(error => {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.message).toBe('Error request')

				throw new EchoError('Error request reject', errorConfig, errorConfig)
			})
			const spy2 = jest.fn(() => {
				return { url: '' }
			})

			echo.interceptors.request.use(
				'1',
				() => {
					throw new EchoError('Error request', errorConfig, errorConfig)
				},
				spy1
			)

			echo.interceptors.request.use('2', null, spy2)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			try {
				await echo.get('/get')
			} catch (error: any) {
				expect(error).toBeInstanceOf(Error)
				expect(error.message).toBe('Error request reject')
			}

			expect(fetchMock).not.toHaveBeenCalled()
			expect(spy1).toHaveBeenCalled()
			expect(spy2).not.toHaveBeenCalled()
		})

		test('Перехват ошибки запроса', async () => {
			echo.interceptors.request.use('1', null, async error => {
				expect(error).toBeInstanceOf(Error)
				expect(error.message).toBe('Network Error')
				return { data: 'Recovered from error', status: 200 }
			})

			fetchMock.mockRejectOnce(() => Promise.reject(new Error('Network Error')))

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toBe('Recovered from error')
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET'
				})
			)
		})

		test('Неудачный перехват ошибки запроса', async () => {
			const spy = jest.fn(error => {
				return error
			})

			echo.interceptors.request.use('1', null, spy)

			fetchMock.mockRejectOnce(() =>
				Promise.reject(new Error('Unhandled Error'))
			)

			try {
				await echo.get('/get')
			} catch (error: any) {
				expect(error).toBeInstanceOf(Error)
				expect(error.message).toBe('Unhandled Error')
			}

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET'
				})
			)
			expect(spy).toHaveBeenCalled()
		})

		test('Несколько перехватчиков reject -> прекращение цепочки после первого восстановления', async () => {
			const spy1 = jest.fn(error => {
				return error
			})
			const spy2 = jest.fn(() => {
				return { data: 'Recovered from second interceptor', status: 200 }
			})
			const spy3 = jest.fn(() => {
				return { data: 'Should not reach here', status: 200 }
			})

			echo.interceptors.request.use('1', null, spy1)
			echo.interceptors.request.use('2', null, spy2)
			echo.interceptors.request.use('3', null, spy3)

			fetchMock.mockRejectOnce(() => Promise.reject(new Error('Network Error')))

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toBe('Recovered from second interceptor')
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET'
				})
			)
			expect(spy1).toHaveBeenCalled()
			expect(spy2).toHaveBeenCalled()
			expect(spy3).not.toHaveBeenCalled()
		})

		test('Удаление перехватчика', async () => {
			const spy = jest.fn(config => {
				config.headers = { ...config.headers, Authorization: 'Bearer token' }
				return config
			})

			echo.interceptors.request.use('1', spy)
			echo.interceptors.request.eject('1')

			fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.post('/post', { name: 'Test' })

			expect(response.status).toBe(200)
			expect(response.data).toEqual({ success: true })
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/post',
				expect.objectContaining({
					method: 'POST',
					headers: expect.not.objectContaining({
						Authorization: 'Bearer token'
					}),
					body: JSON.stringify({ name: 'Test' })
				})
			)
			expect(spy).not.toHaveBeenCalled()
		})

		test('Очистка перехватчиков', async () => {
			const spy1 = jest.fn(config => {
				config.headers = { ...config.headers, Authorization: 'Bearer token222' }
				return config
			})
			const spy2 = jest.fn(config => {
				config.headers = { ...config.headers, Authorization: 'Bearer token' }
				return config
			})

			echo.interceptors.request.use('1', spy1)
			echo.interceptors.request.use('2', spy2)
			echo.interceptors.request.clear()

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.put('/post', { data: 'data' })

			expect(response.status).toBe(200)
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/post',
				expect.objectContaining({
					method: 'PUT',
					headers: expect.not.objectContaining({
						Authorization: 'Bearer token'
					}),
					body: JSON.stringify({ data: 'data' })
				})
			)
			expect(spy1).not.toHaveBeenCalled()
			expect(spy2).not.toHaveBeenCalled()
		})
	})

	describe('Response Interceptors', () => {
		test('Добавление перехватчика', async () => {
			const spy = jest.fn(response => {
				expect(response.data).toEqual({ message: 'Success' })

				return { ...response, data: { modified: true } }
			})

			echo.interceptors.response.use('addResponse', spy)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toEqual({ modified: true })
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			)
			expect(spy).toHaveBeenCalled()
		})

		test('Добавление нескольких перехватчиков', async () => {
			const spy1 = jest.fn(response => {
				expect(response.data).toEqual({ message: 'Success' })

				response.data.first = true
				return response
			})
			const spy2 = jest.fn(response => {
				expect(response.data).toEqual({ first: true, message: 'Success' })

				response.data.second = true
				return response
			})

			echo.interceptors.response.use('first', spy1)
			echo.interceptors.response.use('second', spy2)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toEqual(
				expect.objectContaining({
					first: true,
					second: true,
					message: 'Success'
				})
			)
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			)
			expect(spy1).toHaveBeenCalled()
			expect(spy2).toHaveBeenCalled()
		})

		test('Неправильное добавление перехватчиков', async () => {
			const spy1 = jest.fn(response => {
				response.data = true
				return response
			})
			const spy2 = jest.fn(response => {
				response.data = false
				return response
			})

			echo.interceptors.response.use('first', spy1)
			echo.interceptors.response.use('second', spy2)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toBe(false)
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			)
			expect(spy1).toHaveBeenCalled()
			expect(spy2).toHaveBeenCalled()
		})

		test('Ошибка в перехватчике', async () => {
			const spy1 = jest.fn(error => {
				expect(error).toBeInstanceOf(Error)
				expect(error.message).toBe('Error response')
				return error
			})
			const spy2 = jest.fn(error => {
				return error
			})

			echo.interceptors.response.use(
				'addResponse',
				() => {
					throw new Error('Error response')
				},
				spy1
			)
			echo.interceptors.response.use('rejectResponse', null, spy2)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			try {
				await echo.get('/get')
			} catch (error: any) {
				expect(error).toBeInstanceOf(Error)
				expect(error.message).toBe('Error response')
			}

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			)
			expect(spy1).toHaveBeenCalled()
			expect(spy2).toHaveBeenCalled()
		})

		test('Ошибки в перехватчике без обработки', async () => {
			const spy = jest.fn(() => {
				throw new Error('Error response')
			})

			echo.interceptors.response.use('1', spy)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			try {
				await echo.get('/get')
			} catch (error: any) {
				expect(error).toBeInstanceOf(Error)
				expect(error.message).toBe('Error response')
			}

			expect(fetchMock).toHaveBeenCalled()
			expect(spy).toHaveBeenCalled()
		})

		test('Ошибка в перехватчике reject', async () => {
			const spy1 = jest.fn(error => {
				expect(error).toBeInstanceOf(Error)
				expect(error.message).toBe('Error response')

				throw new Error('Error response reject')
			})
			const spy2 = jest.fn(() => {
				return { url: '' }
			})

			echo.interceptors.response.use(
				'addResponse',
				() => {
					throw new Error('Error response')
				},
				spy1
			)
			echo.interceptors.response.use('rejectRequest', null, spy2)

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			try {
				await echo.get('/get')
			} catch (error: any) {
				expect(error).toBeInstanceOf(Error)
				expect(error.message).toBe('Error response reject')
			}

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			)
			expect(spy1).toHaveBeenCalled()
			expect(spy2).not.toHaveBeenCalled()
		})

		test('Перехват ошибки запроса', async () => {
			const errorConfig: EchoConfig = { method: 'GET', url: '/error' }

			const spy = jest.fn(error => {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.message).toBe('Network Error')
				return { data: 'Recovered from error', status: 200 }
			})

			echo.interceptors.response.use('errorResponse', null, spy)

			fetchMock.mockRejectOnce(() =>
				Promise.reject(new EchoError('Network Error', errorConfig, errorConfig))
			)

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toBe('Recovered from error')
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			)
			expect(spy).toHaveBeenCalled()
		})

		test('Неудачный перехват ошибки запроса', async () => {
			const errorConfig: EchoConfig = { method: 'GET', url: '/error' }

			const spy = jest.fn(error => error)

			echo.interceptors.response.use('errorHandler', null, spy)

			fetchMock.mockRejectOnce(() =>
				Promise.reject(
					new EchoError('Unhandled Error', errorConfig, errorConfig)
				)
			)

			try {
				await echo.get('/get')
			} catch (error: any) {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.message).toBe('Unhandled Error')
			}

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			)
			expect(spy).toHaveBeenCalled()
		})

		test('Несколько перехватчиков reject -> прекращение цепочки после первого восстановления', async () => {
			const errorConfig: EchoConfig = { method: 'GET', url: '/error' }

			const spy1 = jest.fn(error => error)
			const spy2 = jest.fn(() => {
				return { data: 'Recovered from second interceptor', status: 200 }
			})
			const spy3 = jest.fn(() => {
				return { data: 'Should not reach here', status: 200 }
			})

			echo.interceptors.response.use('1', null, spy1)
			echo.interceptors.response.use('2', null, spy2)
			echo.interceptors.response.use('3', null, spy3)

			fetchMock.mockRejectOnce(() =>
				Promise.reject(new EchoError('Network Error', errorConfig, errorConfig))
			)

			const response = await echo.get('/get')

			expect(response.status).toBe(200)
			expect(response.data).toBe('Recovered from second interceptor')
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/get',
				expect.objectContaining({
					method: 'GET'
				})
			)
			expect(spy1).toHaveBeenCalled()
			expect(spy2).toHaveBeenCalled()
			expect(spy3).not.toHaveBeenCalled()
		})

		test('Удаление перехватчика', async () => {
			const spy = jest.fn(response => {
				response.data = { modified: true }
				return response
			})

			echo.interceptors.response.use('1', spy)
			echo.interceptors.response.eject('1')

			fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.post('/post', { name: 'Test' })

			expect(response.status).toBe(200)
			expect(response.data).toEqual({ success: true })
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/post',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ name: 'Test' })
				})
			)
			expect(spy).not.toHaveBeenCalled()
		})

		test('Очистка перехватчиков', async () => {
			const spy1 = jest.fn(response => {
				response.data = 'Recovered from second interceptor'
				return response
			})
			const spy2 = jest.fn(() => {
				response.data = 'Should not reach here'
				return response
			})

			echo.interceptors.response.use('1', spy1)
			echo.interceptors.response.use('2', spy2)
			echo.interceptors.response.clear()

			fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})

			const response = await echo.put('/post', { data: 'data' })

			expect(response.status).toBe(200)
			expect(response.data).toEqual({ message: 'Success' })
			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/post',
				expect.objectContaining({
					method: 'PUT',
					headers: expect.not.objectContaining({
						Authorization: 'Bearer token'
					}),
					body: JSON.stringify({ data: 'data' })
				})
			)
			expect(spy1).not.toHaveBeenCalled()
			expect(spy2).not.toHaveBeenCalled()
		})
	})
})
