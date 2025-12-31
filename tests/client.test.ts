import { EchoClient, EchoError, isEchoError } from '../src'

import {
	fetchMock,
	fetchMockCheckRequest,
	fetchMockRequestNetworkError,
	fetchMockResponseJsonFailed,
	fetchMockResponseJsonSuccess
} from './fetch-mock'

fetchMock.enableMocks()

describe('EchoClient', () => {
	let client: EchoClient

	beforeEach(() => {
		fetchMock.resetMocks()
		client = new EchoClient({
			baseURL: 'https://api.example.com/api',
			headers: { 'Content-Type': 'application/json' }
		})
	})

	afterEach(() => {
		fetchMock.resetMocks()
	})

	test('Инициализация', () => {
		expect(client).toBeDefined()
	})

	describe('Стандартизация', () => {
		test('Отдача EchoResponse', async () => {
			fetchMockResponseJsonSuccess()

			const response = await client.get('/')
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
				await client.get('/error-response')
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
				await client.get('/error')
			} catch (err) {
				expect(err).toBeInstanceOf(EchoError)
				if (isEchoError(err)) {
					expect(err.message).toEqual('Network Error')
					expect(err.config).toEqual({
						baseURL: 'https://api.example.com/api',
						headers: { 'Content-Type': 'application/json' },
						method: 'GET',
						url: '/error'
					})
					expect(err.request).toEqual({
						headers: { 'Content-Type': 'application/json' },
						method: 'GET',
						url: 'https://api.example.com/api/error'
					})
					expect(err.response).toBeUndefined()
				}
			}
		})
	})

	describe('URL формирование', () => {
		test('Формирует с baseURL и относительным путем', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/test')

			fetchMockCheckRequest('https://api.example.com/api/test')
		})

		test('Формирует с абсолютным путем без baseURL', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('https://example.ru/origin')

			fetchMockCheckRequest('https://example.ru/origin')
		})
	})

	describe('Query параметры', () => {
		test('Добавляет query параметры в URL', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/search', { params: { q: 'test' } })

			fetchMockCheckRequest('https://api.example.com/api/search?q=test')
		})

		test('Кодирует специальные символы в query параметрах', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/search', {
				params: { q: 'hello world', sort: 'desc' }
			})

			fetchMockCheckRequest(
				'https://api.example.com/api/search?q=hello%20world&sort=desc'
			)
		})

		test('Обрабатывает массивы в query параметрах', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/search', { params: { q: [2, 3], sort: 'desc' } })

			fetchMockCheckRequest(
				'https://api.example.com/api/search?q=2&q=3&sort=desc'
			)
		})

		test('Игнорирует null и undefined значения в query параметрах', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/search', { params: { test: null, value: undefined } })

			fetchMockCheckRequest('https://api.example.com/api/search')
		})
	})

	describe('HTTP методы', () => {
		describe('GET', () => {
			test('Запрос', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.get('/test')

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ ok: true })
				fetchMockCheckRequest('https://api.example.com/api/test', {
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			})
		})

		describe('POST', () => {
			test('Запрос с JSON', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.post('/json', { name: 'Test' })

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ ok: true })
				fetchMockCheckRequest('https://api.example.com/api/json', {
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					}),
					body: JSON.stringify({ name: 'Test' })
				})
			})

			test('Запрос с FormData', async () => {
				fetchMockResponseJsonSuccess()

				const formData = new FormData()
				formData.append('file', new Blob(), 'test.txt')

				const response = await client.post('/formData', formData)

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ ok: true })
				expect(response.request?.headers?.['Content-Type']).toBeUndefined()
				fetchMockCheckRequest('https://api.example.com/api/formData', {
					method: 'POST',
					body: expect.any(FormData)
				})
			})

			test('Запрос с Blob', async () => {
				fetchMockResponseJsonSuccess()

				const blob = new Blob()

				const response = await client.post('/blob', blob)

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ ok: true })
				expect(response.request?.headers?.['Content-Type']).toBeUndefined()
				fetchMockCheckRequest('https://api.example.com/api/blob', {
					method: 'POST',
					body: expect.any(Blob)
				})
			})

			test('Запрос с кастомными заголовками', async () => {
				fetchMockResponseJsonSuccess()

				await client.post(
					'/custom-headers',
					{ test: 123 },
					{ headers: { 'X-Custom-Header': 'test-value' } }
				)

				fetchMockCheckRequest('https://api.example.com/api/custom-headers', {
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'X-Custom-Header': 'test-value'
					}),
					body: JSON.stringify({ test: 123 })
				})
			})
		})

		describe('PUT', () => {
			test('Запрос', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.put('/update', { name: 'Test' })

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ ok: true })
				fetchMockCheckRequest('https://api.example.com/api/update', {
					method: 'PUT',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					}),
					body: JSON.stringify({ name: 'Test' })
				})
			})
		})

		describe('PATCH', () => {
			test('Запрос', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.patch('/patch', { name: 'Test' })

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ ok: true })
				fetchMockCheckRequest('https://api.example.com/api/patch', {
					method: 'PATCH',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					}),
					body: JSON.stringify({ name: 'Test' })
				})
			})
		})

		describe('DELETE', () => {
			test('Запрос', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.delete('/delete')

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ ok: true })
				fetchMockCheckRequest('https://api.example.com/api/delete', {
					method: 'DELETE',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			})
		})
	})

	describe('Обработка Content-Type и Response Type', () => {
		describe('Определение (по Content-Type)', () => {
			test('JSON ответ c application/json', async () => {
				fetchMock.mockResponseOnce(JSON.stringify({ ok: true }), {
					headers: { 'Content-Type': 'application/json' }
				})

				const response = await client.get('/json')

				expect(response.data).toEqual({ ok: true })
			})

			test('JSON ответ с +json', async () => {
				fetchMock.mockResponseOnce(JSON.stringify({ ok: true }), {
					headers: { 'Content-Type': 'application/vnd.api+json' }
				})

				const response = await client.get('/json-vnd')

				expect(response.data).toEqual({ ok: true })
			})

			test('XML ответ c application/xml', async () => {
				const xmlString = '<?xml version="1.0"?><root>test</root>'
				fetchMock.mockResponseOnce(xmlString, {
					headers: { 'Content-Type': 'application/xml' }
				})

				const response = await client.get('/xml')

				expect(response.data).toBe(xmlString)
			})

			test('XML ответ с text/xml', async () => {
				const xmlString = '<?xml version="1.0"?><root>test</root>'
				fetchMock.mockResponseOnce(xmlString, {
					headers: { 'Content-Type': 'text/xml' }
				})

				const response = await client.get('/text-xml')

				expect(response.data).toBe(xmlString)
			})

			test('XML ответ с application/xhtml+xml', async () => {
				const xmlString = '<?xml version="1.0"?><html><body>test</body></html>'
				fetchMock.mockResponseOnce(xmlString, {
					headers: { 'Content-Type': 'application/xhtml+xml' }
				})

				const response = await client.get('/xhtml')

				expect(response.data).toBe(xmlString)
			})

			test('XML ответ с +xml', async () => {
				const xmlString = '<?xml version="1.0"?><svg>test</svg>'
				fetchMock.mockResponseOnce(xmlString, {
					headers: { 'Content-Type': 'image/svg+xml' }
				})

				const response = await client.get('/svg-xml')

				expect(response.data).toBe(xmlString)
			})

			test('Text ответ с text/plain', async () => {
				fetchMock.mockResponseOnce('Success', {
					headers: { 'Content-Type': 'text/plain' }
				})

				const response = await client.get('/text')

				expect(response.data).toBe('Success')
			})

			test('FormData ответ с multipart/form-data', async () => {
				const mockFormData = new FormData()
				mockFormData.append('key', 'value')

				fetchMock.mockResolvedValueOnce({
					ok: true,
					status: 200,
					headers: new Headers({ 'Content-Type': 'multipart/form-data' }),
					formData: () => Promise.resolve(mockFormData)
				} as Response)

				const response = await client.get('/multipart')

				expect(response.data).toBeInstanceOf(FormData)
				expect((response.data as FormData).get('key')).toBe('value')
			})

			test('FormData ответ с application/x-www-form-urlencoded', async () => {
				const mockFormData = new FormData()
				mockFormData.append('key', 'value')

				fetchMock.mockResolvedValueOnce({
					ok: true,
					status: 200,
					headers: new Headers({
						'Content-Type': 'application/x-www-form-urlencoded'
					}),
					formData: () => Promise.resolve(mockFormData)
				} as Response)

				const response = await client.get('/form-urlencoded')

				expect(response.data).toBeInstanceOf(FormData)
				expect((response.data as FormData).get('key')).toBe('value')
			})

			test('Blob ответ для неизвестного content-type', async () => {
				const blob = new Blob(['binary data'])

				fetchMock.mockImplementationOnce(() =>
					Promise.resolve(new Response(blob))
				)

				const response = await client.get<Blob>('/blob-response')

				expect(response.data?.constructor.name).toBe('Blob')
			})

			test('Пустой ответ (204)', async () => {
				fetchMock.mockResponseOnce('', {
					status: 204,
					headers: { 'Content-Type': 'application/json' }
				})

				const response = await client.get('/null-content')

				expect(response.status).toBe(204)
				expect(response.data).toBeNull()
			})

			test('Возвращает null при ошибке обработки', async () => {
				const mockResponse = new Response('invalid json', {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
				mockResponse.json = () => {
					throw new SyntaxError('Invalid JSON')
				}
				fetchMock.mockImplementationOnce(() => Promise.resolve(mockResponse))

				const response = await client.get('/invalid-json')

				expect(response.data).toBeNull()
			})
		})

		describe('Указание responseType', () => {
			test('Json', async () => {
				fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }))

				const response = await client.get('/json', { responseType: 'json' })

				expect(response.data).toEqual({ message: 'Success' })
			})

			test('Text', async () => {
				fetchMock.mockResponseOnce('Success')

				const response = await client.get('/text', { responseType: 'text' })

				expect(response.data).toBe('Success')
			})

			test('ArrayBuffer', async () => {
				const buffer = new Uint8Array([1, 2, 3, 4]).buffer
				fetchMock.mockImplementationOnce(() =>
					Promise.resolve(new Response(buffer))
				)

				const response = await client.get('/arrayBuffer', {
					responseType: 'arrayBuffer'
				})

				expect(response.data).toBeInstanceOf(ArrayBuffer)
			})

			test('Blob', async () => {
				const mockBlob = new Blob(['hello'], { type: 'text/plain' })
				fetchMock.mockResolvedValueOnce({
					ok: true,
					status: 200,
					headers: new Headers(),
					blob: () => Promise.resolve(mockBlob)
				} as Response)

				const response = await client.get<Blob>('/blob', {
					responseType: 'blob'
				})

				expect(response.data).toBeInstanceOf(Blob)
				expect(await response.data.text()).toBe('hello')
			})

			test('FormData', async () => {
				const mockFormData = new FormData()
				mockFormData.append('foo', 'bar')
				fetchMock.mockResolvedValueOnce({
					ok: true,
					status: 200,
					headers: new Headers(),
					formData: () => Promise.resolve(mockFormData)
				} as Response)

				const response = await client.get<FormData>('/formData', {
					responseType: 'formData'
				})

				expect(response.data).toBeInstanceOf(FormData)
				expect(response.data.get('foo')).toBe('bar')
			})

			test('Stream', async () => {
				const buffer = Buffer.from('Hello, world!')

				fetchMock.mockImplementationOnce(() =>
					Promise.resolve(new Response(buffer))
				)

				const response = await client.get<Buffer>('/stream', {
					responseType: 'stream'
				})

				expect(response.data).toBeInstanceOf(Buffer)
			})

			test('Stream', async () => {
				const buffer = Buffer.from('Hello, world!')
				const responseBody = new ReadableStream({
					start(controller) {
						controller.enqueue(buffer)
						controller.close()
					}
				})

				fetchMock.mockImplementationOnce(() =>
					Promise.resolve(
						new Response(responseBody, {
							status: 200,
							headers: { 'Content-Type': 'application/octet-stream' }
						})
					)
				)

				const response = await client.get('/stream', { responseType: 'stream' })

				expect(response.data).toBeInstanceOf(Buffer)
			})

			test('Original', async () => {
				const originalResponse = new Response('Some content')
				fetchMock.mockImplementationOnce(() =>
					Promise.resolve(originalResponse)
				)

				const response = await client.get('/original', {
					responseType: 'original'
				})

				expect(response.data).toBeInstanceOf(Response)
			})

			test('Fallback на автоматическую обработку при ошибке', async () => {
				const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
				const mockResponse = new Response('not a json', {
					headers: { 'Content-Type': 'text/plain' }
				})
				mockResponse.json = () => {
					throw new Error('Error during parsing')
				}
				fetchMock.mockImplementationOnce(() => Promise.resolve(mockResponse))

				const response = await client.get('/fallback-json', {
					responseType: 'json'
				})

				expect(consoleWarnSpy).toHaveBeenCalled()
				expect(response.data).toBe('not a json')
				consoleWarnSpy.mockRestore()
			})

			test('Выбрасывает ошибку при неправильном responseType', async () => {
				fetchMock.mockResponseOnce('', { status: 200 })

				await expect(
					client.get('/unknown', { responseType: 'unknown' as any })
				).rejects.toThrow('Unsupported responseType: unknown')
			})
		})
	})

	describe('Обработка ошибок', () => {
		test('Ошибки запроса', async () => {
			fetchMock.mockRejectOnce(() => Promise.reject(new Error('Network Error')))

			try {
				await client.get('/error')
			} catch (err: any) {
				expect(err).toBeInstanceOf(EchoError)
				if (isEchoError(err)) {
					expect(err.message).toBe('Network Error')
					expect(err.request).toBeDefined()
					expect(err.response).toBeUndefined()
				}
			}

			fetchMockCheckRequest()
		})

		test('Ошибки ответа', async () => {
			fetchMock.mockResponseOnce('Not Found', {
				status: 404,
				statusText: 'Not Found'
			})

			try {
				await client.get('/error')
			} catch (err: any) {
				expect(err).toBeInstanceOf(EchoError)
				if (isEchoError(err)) {
					expect(err.message).toBe('Not Found')
					expect(err.request).toBeDefined()
					expect(err.response?.status).toBe(404)
					expect(err.response?.data).toBe('Not Found')
				}
			}

			fetchMockCheckRequest()
		})

		test('Ошибка без massage но с statusText', async () => {
			fetchMock.mockResponseOnce('', {
				status: 404,
				statusText: 'Not Found'
			})

			try {
				await client.get('/error')
			} catch (err: any) {
				expect(err).toBeInstanceOf(EchoError)
				if (isEchoError(err)) {
					expect(err.message).toBe('Not Found')
					expect(err.request).toBeDefined()
					expect(err.response?.status).toBe(404)
					expect(err.response?.statusText).toBe('Not Found')
				}
			}

			fetchMockCheckRequest()
		})

		test('Ошибка без massage, status и statusText', async () => {
			fetchMock.mockResponseOnce('', {
				status: undefined,
				statusText: undefined
			})

			try {
				await client.get('/error')
			} catch (err: any) {
				expect(err).toBeInstanceOf(EchoError)
				if (isEchoError(err)) {
					expect(err.message).toBe('Unexpected error')
					expect(err.request).toBeDefined()
					expect(err.response?.status).toBe(404)
					expect(err.response?.statusText).toBe('Not Found')
				}
			}

			fetchMockCheckRequest()
		})
	})
})
