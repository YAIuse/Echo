import fetchMock from 'jest-fetch-mock'
import { EchoClient } from 'src/client'
import { EchoError } from 'src/error'
import { EchoResponse } from 'src/types'

fetchMock.enableMocks()

describe('EchoClient', () => {
	let client: EchoClient

	beforeEach(() => {
		client = new EchoClient({
			baseURL: 'https://api.example.com/api',
			headers: { 'Content-Type': 'application/json' }
		})
	})

	afterEach(() => {
		fetchMock.resetMocks()
	})

	test('Инициализация клиента', () => {
		expect(client).toBeDefined()
	})

	test('GET запрос', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response: EchoResponse<{ message: string }> =
			await client.get('/test')

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

	test('GET запрос с query params', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/search', {
			params: { q: 'test' }
		})

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/search?q=test',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос с query params -> спецсимволами', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/search', {
			params: { q: 'hello world', sort: 'desc' }
		})

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/search?q=hello%20world&sort=desc',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос с query params -> массивами', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/search', {
			params: { q: [2, 3], sort: 'desc' }
		})

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/search?q=2&q=3&sort=desc',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос с query params -> null и undefined', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/search', {
			params: { test: null, value: undefined }
		})

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/search',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос без данных', async () => {
		fetchMock.mockResponseOnce('', {
			status: 204,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/no-content')

		expect(response.status).toBe(204)
		expect(response.data).toBeNull()
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/no-content',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос c responseType -> json', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/json', {
			responseType: 'json'
		})

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/json',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос c responseType -> text', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'text/plain' }
		})

		const response = await client.get('/text', {
			responseType: 'text'
		})

		expect(response.status).toBe(200)
		expect(response.data).toBe(JSON.stringify({ message: 'Success' }))
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/text',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос c responseType -> arrayBuffer', async () => {
		const buffer = new Uint8Array([1, 2, 3, 4]).buffer

		fetchMock.mockImplementationOnce(() =>
			Promise.resolve(
				new Response(buffer, {
					status: 200,
					headers: { 'Content-Type': 'application/octet-stream' }
				})
			)
		)

		const response = await client.get('/binary', {
			responseType: 'arrayBuffer'
		})

		expect(response.status).toBe(200)
		expect(response.data).toBeInstanceOf(ArrayBuffer)
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/binary',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос c responseType -> blob', async () => {
		const blob = new Blob(['hello'], { type: 'text/plain' })

		fetchMock.mockImplementationOnce(() =>
			Promise.resolve(
				new Response(blob, {
					status: 200,
					headers: { 'Content-Type': 'text/plain' }
				})
			)
		)

		const response = await client.get('/blob', { responseType: 'blob' })

		expect(response.status).toBe(200)
		expect(response.data?.constructor.name).toBe('Blob')
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/blob',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос с responseType -> stream', async () => {
		const buffer = Buffer.from('Hello, world!')

		fetchMock.mockImplementationOnce(() =>
			Promise.resolve(
				new Response(buffer, {
					status: 200,
					headers: { 'Content-Type': 'application/octet-stream' }
				})
			)
		)

		const response = await client.get('/stream', { responseType: 'stream' })

		expect(response.status).toBe(200)
		expect(response.data).toBeInstanceOf(Buffer)
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/stream',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос с responseType -> original', async () => {
		const originalResponse = new Response('Some content', {
			status: 200,
			headers: { 'Content-Type': 'text/plain' }
		})

		fetchMock.mockImplementationOnce(() => Promise.resolve(originalResponse))

		const response = await client.get('/original', {
			responseType: 'original'
		})

		expect(response.status).toBe(200)
		expect(response.data).toBeInstanceOf(Response)
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/original',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос с responseType -> unknown', async () => {
		fetchMock.mockResponseOnce('', {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		try {
			await client.get('/unknown', { responseType: 'unknown' as any })
		} catch (error: any) {
			expect(error).toBeInstanceOf(Error)
			expect(error.message).toBe('Unsupported responseType: unknown')
		}
	})

	test('GET запрос без responseType -> json', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/json')

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/json',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос без responseType -> text', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'text/plain' }
		})

		const response = await client.get('/text')

		expect(response.status).toBe(200)
		expect(response.data).toBe(JSON.stringify({ message: 'Success' }))
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/text',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('GET запрос без responseType -> unknown', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'unknown' }
		})

		const response = await client.get('/unknown')

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/unknown',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		)
	})

	test('POST запрос', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ id: 1 }), {
			status: 201,
			headers: { 'Content-Type': 'application/json' }
		})

		const response: EchoResponse<{ id: number }> = await client.post(
			'/create',
			{ name: 'Test' }
		)

		expect(response.status).toBe(201)
		expect(response.data).toEqual({ id: 1 })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/create',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				}),
				body: JSON.stringify({ name: 'Test' })
			})
		)
	})

	test('POST запрос c FormData', async () => {
		const formData = new FormData()
		formData.append('file', new Blob(['test content']), 'test.txt')

		fetchMock.mockResponseOnce('Success', {
			status: 200,
			headers: { 'Content-Type': 'text/plain' }
		})

		const response: EchoResponse<string> = await client.post(
			'/upload',
			formData
		)

		expect(response.status).toBe(200)
		expect(response.data).toBe('Success')
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/upload',
			expect.objectContaining({
				method: 'POST',
				body: expect.any(FormData),
				headers: expect.objectContaining({})
			})
		)
	})

	test('POST запрос с нестандартными заголовками', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.post(
			'/custom-headers',
			{ test: 123 },
			{
				headers: { 'X-Custom-Header': 'test-value' }
			}
		)

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ success: true })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/custom-headers',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'X-Custom-Header': 'test-value',
					'Content-Type': 'application/json'
				}),
				body: expect.any(String)
			})
		)
	})

	test('PUT запрос', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ updated: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response: EchoResponse<{ updated: boolean }> = await client.put(
			'/update',
			{ name: 'Test' }
		)

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ updated: true })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/update',
			expect.objectContaining({
				method: 'PUT',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				}),
				body: expect.any(String)
			})
		)
	})

	test('PATCH запрос', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ patched: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response: EchoResponse<{ patched: boolean }> = await client.patch(
			'/patch',
			{ name: 'Test' }
		)

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ patched: true })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/patch',
			expect.objectContaining({
				method: 'PATCH',
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				}),
				body: expect.any(String)
			})
		)
	})

	test('DELETE запрос', async () => {
		fetchMock.mockResponseOnce('', { status: 204 })

		const response = await client.delete('/delete')

		expect(response.status).toBe(204)
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

	test('Обработка ответа с ошибкой', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not Found' }), {
			status: 404,
			statusText: 'Not Found',
			headers: { 'Content-Type': 'application/json' }
		})

		await expect(
			client.get('/missing').catch(error => {
				expect(error).toBeInstanceOf(EchoError)
				expect(error.request.method).toBe('GET')
				expect(error.response.status).toBe(404)
				expect(error.response.data).toEqual({ error: 'Not Found' })

				throw error
			})
		).rejects.toThrow(EchoError)
	})

	test('Обработка ошибок запроса', async () => {
		fetchMock.mockRejectOnce(() => Promise.reject(new Error('Request Error')))

		await expect(client.get('/error')).rejects.toThrow(EchoError)
	})
})
