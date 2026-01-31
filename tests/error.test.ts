import {
	type EchoConfig,
	EchoError,
	type EchoRequest,
	type EchoResponse,
	isEchoError
} from '../src'

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
	it('Must create an instance of EchoError with the correct properties', () => {
		const error = new EchoError(
			'Test error',
			mockConfig,
			mockRequest,
			mockResponse
		)

		expect(error).toBeInstanceOf(EchoError)

		expect(error.name).toBe('EchoError')
		expect(error.message).toBe('Test error')
		expect(error.config).toEqual(mockConfig)
		expect(error.request).toEqual(mockRequest)
		expect(error.response).toEqual(mockResponse)
	})
})

describe('isEchoError', () => {
	it('Return true for an instance of EchoError', () => {
		const error = new EchoError(
			'Test error',
			mockConfig,
			mockRequest,
			mockResponse
		)

		expect(isEchoError(error)).toBe(true)
	})

	it('Return true for an object named EchoError', () => {
		const error = { name: 'EchoError', message: 'Test error' }

		expect(isEchoError(error)).toBe(true)
	})

	it('Return false for an object with a different name', () => {
		const error = { name: 'SomeOtherError', message: 'Test error' }

		expect(isEchoError(error)).toBe(false)
	})

	it('Return false for an error that is not an object', () => {
		const error = 'Test error'

		expect(isEchoError(error)).toBe(false)
	})
})
