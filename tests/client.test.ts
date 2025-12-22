import fetchMock from 'jest-fetch-mock'
import { EchoClient } from 'src/client'
import { EchoError } from 'src/error'

fetchMock.enableMocks()

describe('EchoClient', () => {
	let client: EchoClient

	const mockReqJson200 = {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	}

	const fetchMockResponseJsonSuccess = () =>
		fetchMock.mockResponseOnce(
			JSON.stringify({ message: 'Success' }),
			mockReqJson200
		)

	beforeEach(() => {
		client = new EchoClient({
			baseURL: 'https://api.example.com/api',
			headers: { 'Content-Type': 'application/json' }
		})
		fetchMock.resetMocks()
	})

	afterEach(() => {
		fetchMock.resetMocks()
	})

	test('Инициализация', () => {
		expect(client).toBeDefined()
	})

	describe('URL формирование', () => {
		test('Формирует с baseURL и относительным путем', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/test')

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/test',
				expect.any(Object)
			)
		})

		test('Формирует с абсолютным путем без baseURL', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('https://example.ru/origin')

			expect(fetchMock).toHaveBeenCalledWith(
				'https://example.ru/origin',
				expect.any(Object)
			)
		})
	})

	describe('Query параметры', () => {
		test('Добавляет query параметры в URL', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/search', { params: { q: 'test' } })

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/search?q=test',
				expect.any(Object)
			)
		})

		test('Кодирует специальные символы в query параметрах', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/search', {
				params: { q: 'hello world', sort: 'desc' }
			})

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/search?q=hello%20world&sort=desc',
				expect.any(Object)
			)
		})

		test('Обрабатывает массивы в query параметрах', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/search', { params: { q: [2, 3], sort: 'desc' } })

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/search?q=2&q=3&sort=desc',
				expect.any(Object)
			)
		})

		test('Игнорирует null и undefined значения в query параметрах', async () => {
			fetchMockResponseJsonSuccess()

			await client.get('/search', { params: { test: null, value: undefined } })

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api.example.com/api/search',
				expect.any(Object)
			)
		})
	})

	describe('HTTP методы', () => {
		describe('GET', () => {
			test('Запрос', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.get('/test')

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ message: 'Success' })
				expect(fetchMock).toHaveBeenCalledWith(
					'https://api.example.com/api/test',
					expect.objectContaining({
						method: 'GET',
						headers: expect.objectContaining({
							'Content-Type': 'application/json'
						})
					})
				)
			})
		})

		describe('POST', () => {
			test('Запрос с JSON', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.post('/json', { name: 'Test' })

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ message: 'Success' })
				expect(fetchMock).toHaveBeenCalledWith(
					'https://api.example.com/api/json',
					expect.objectContaining({
						method: 'POST',
						headers: expect.objectContaining({
							'Content-Type': 'application/json'
						}),
						body: JSON.stringify({ name: 'Test' })
					})
				)
			})

			test('Запрос с FormData', async () => {
				fetchMockResponseJsonSuccess()

				const formData = new FormData()
				formData.append('file', new Blob(), 'test.txt')

				const response = await client.post('/formData', formData)

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ message: 'Success' })
				expect(response.request?.headers?.['Content-Type']).toBeUndefined()
				expect(fetchMock).toHaveBeenCalledWith(
					'https://api.example.com/api/formData',
					expect.objectContaining({
						method: 'POST',
						body: expect.any(FormData)
					})
				)
			})

			test('Запрос с Blob', async () => {
				fetchMockResponseJsonSuccess()

				const blob = new Blob()

				const response = await client.post('/blob', blob)

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ message: 'Success' })
				expect(response.request?.headers?.['Content-Type']).toBeUndefined()
				expect(fetchMock).toHaveBeenCalledWith(
					'https://api.example.com/api/blob',
					expect.objectContaining({
						method: 'POST',
						body: expect.any(Blob)
					})
				)
			})

			test('Запрос с кастомными заголовками', async () => {
				fetchMockResponseJsonSuccess()

				await client.post(
					'/custom-headers',
					{ test: 123 },
					{ headers: { 'X-Custom-Header': 'test-value' } }
				)

				expect(fetchMock).toHaveBeenCalledWith(
					'https://api.example.com/api/custom-headers',
					expect.objectContaining({
						method: 'POST',
						headers: expect.objectContaining({
							'Content-Type': 'application/json',
							'X-Custom-Header': 'test-value'
						}),
						body: JSON.stringify({ test: 123 })
					})
				)
			})
		})

		describe('PUT', () => {
			test('Запрос', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.put('/update', { name: 'Test' })

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ message: 'Success' })
				expect(fetchMock).toHaveBeenCalledWith(
					'https://api.example.com/api/update',
					expect.objectContaining({
						method: 'PUT',
						headers: expect.objectContaining({
							'Content-Type': 'application/json'
						}),
						body: JSON.stringify({ name: 'Test' })
					})
				)
			})
		})

		describe('PATCH', () => {
			test('Запрос', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.patch('/patch', { name: 'Test' })

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ message: 'Success' })
				expect(fetchMock).toHaveBeenCalledWith(
					'https://api.example.com/api/patch',
					expect.objectContaining({
						method: 'PATCH',
						headers: expect.objectContaining({
							'Content-Type': 'application/json'
						}),
						body: JSON.stringify({ name: 'Test' })
					})
				)
			})
		})

		describe('DELETE', () => {
			test('Запрос', async () => {
				fetchMockResponseJsonSuccess()

				const response = await client.delete('/delete')

				expect(response.status).toBe(200)
				expect(response.data).toEqual({ message: 'Success' })
				expect(fetchMock).toHaveBeenCalledWith(
					'https://api.example.com/api/delete',
					expect.objectContaining({
						method: 'DELETE',
						headers: expect.objectContaining({
							'Content-Type': 'application/json'
						})
					})
				)
			})
		})
	})

	describe('Обработка Content-Type и Response Type', () => {
		describe('Определение (по Content-Type)', () => {
			test('JSON ответ', async () => {
				fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
					headers: { 'Content-Type': 'application/json' }
				})

				const response = await client.get('/json')

				expect(response.data).toEqual({ message: 'Success' })
			})

			test('JSON ответ с content-type +json', async () => {
				fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
					headers: { 'Content-Type': 'application/vnd.api+json' }
				})

				const response = await client.get('/json-vnd')

				expect(response.data).toEqual({ message: 'Success' })
			})

			test('XML ответ', async () => {
				const xmlString = '<?xml version="1.0"?><root>test</root>'
				fetchMock.mockResponseOnce(xmlString, {
					headers: { 'Content-Type': 'application/xml' }
				})

				const response = await client.get('/xml')

				expect(response.data).toBe(xmlString)
			})

			test('XML ответ с content-type text/xml', async () => {
				const xmlString = '<?xml version="1.0"?><root>test</root>'
				fetchMock.mockResponseOnce(xmlString, {
					headers: { 'Content-Type': 'text/xml' }
				})

				const response = await client.get('/text-xml')

				expect(response.data).toBe(xmlString)
			})

			test('XML ответ с content-type application/xhtml+xml', async () => {
				const xmlString = '<?xml version="1.0"?><html><body>test</body></html>'
				fetchMock.mockResponseOnce(xmlString, {
					headers: { 'Content-Type': 'application/xhtml+xml' }
				})

				const response = await client.get('/xhtml')

				expect(response.data).toBe(xmlString)
			})

			test('XML ответ с content-type заканчивающимся на +xml', async () => {
				const xmlString = '<?xml version="1.0"?><svg>test</svg>'
				fetchMock.mockResponseOnce(xmlString, {
					headers: { 'Content-Type': 'image/svg+xml' }
				})

				const response = await client.get('/svg-xml')

				expect(response.data).toBe(xmlString)
			})

			test('Text ответ', async () => {
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
		test('HTTP ошибки (4xx, 5xx)', async () => {
			fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not Found' }), {
				status: 404,
				statusText: 'Not Found'
			})

			await expect(client.get('/missing')).rejects.toThrow(EchoError)

			try {
				await client.get('/missing')
			} catch (error: any) {
				expect(error.request.method).toBe('GET')
				expect(error.response?.status).toBe(404)
				expect(error.response?.data).toEqual({ error: 'Not Found' })
			}
		})

		test('Сетевые ошибки', async () => {
			fetchMock.mockRejectOnce(() => Promise.reject(new Error('Request Error')))

			await expect(client.get('/error')).rejects.toThrow(EchoError)
		})
	})
})
