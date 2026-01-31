import { formattedBody } from '../../src/utils/formattedBody'

describe('formattedBody', () => {
	test('Process FormData', () => {
		const body = new FormData()
		body.append('file', 'data')

		const result = formattedBody(body)

		expect(result).toBeInstanceOf(FormData)
	})

	test('Process string', () => {
		const body = 'test body'

		const result = formattedBody(body)

		expect(result).toBe('test body')
	})

	test('Process the number', () => {
		const body = 123

		const result = formattedBody(body)

		expect(result).toBe('123')
	})

	test('Serialize objects in JSON', () => {
		const body = { key: 'value' }

		const result = formattedBody(body)

		expect(result).toBe('{"key":"value"}')
	})

	test('Return undefined if the body is not specified', () => {
		const result = formattedBody(undefined)

		expect(result).toBeUndefined()
	})
})
