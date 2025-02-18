import { EchoError, isEchoError } from 'src/error'
import type { EchoConfig, EchoRequest, EchoResponse } from 'src/types'

const mockConfig: EchoConfig = {
	method: 'GET',
	url: 'https://api.example.com/api'
}
const mockRequest: EchoRequest = {
	method: 'GET',
	url: 'https://api.example.com/api'
}
const mockResponse: EchoResponse = {
	status: 200,
	data: { success: true },
	statusText: 'OK',
	headers: { 'Content-Type': 'application/json' },
	config: mockConfig,
	request: mockRequest
}

describe('EchoError', () => {
	it('должен создавать экземпляр EchoError с правильными свойствами', () => {
		const error = new EchoError(
			'Тестовая ошибка',
			mockConfig,
			mockRequest,
			mockResponse
		)

		expect(error).toBeInstanceOf(EchoError)

		expect(error.name).toBe('EchoError')
		expect(error.message).toBe('Тестовая ошибка')
		expect(error.config).toEqual(mockConfig)
		expect(error.request).toEqual(mockRequest)
		expect(error.response).toEqual(mockResponse)
	})
})

describe('isEchoError', () => {
	it('возвращать true для экземпляра EchoError', () => {
		const error = new EchoError(
			'Тестовая ошибка',
			mockConfig,
			mockRequest,
			mockResponse
		)

		expect(isEchoError(error)).toBe(true)
	})

	it('возвращать true для объекта с именем "EchoError"', () => {
		const error = { name: 'EchoError', message: 'Тестовая ошибка' }

		expect(isEchoError(error)).toBe(true)
	})

	it('возвращать false для объекта с другим именем', () => {
		const error = { name: 'SomeOtherError', message: 'Тестовая ошибка' }

		expect(isEchoError(error)).toBe(false)
	})

	it('возвращать false для ошибки, не являющейся объектом', () => {
		const error = 'Тестовая ошибка'

		expect(isEchoError(error)).toBe(false)
	})
})
