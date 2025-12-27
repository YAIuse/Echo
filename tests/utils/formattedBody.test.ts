import { formattedBody } from '../../src/utils/formattedBody'

describe('formattedBody', () => {
	test('Обрабатывать FormData', () => {
		const body = new FormData()
		body.append('file', 'data')

		const result = formattedBody(body)

		expect(result).toBeInstanceOf(FormData)
	})

	test('Обрабатывать string', () => {
		const body = 'test body'

		const result = formattedBody(body)

		expect(result).toBe('test body')
	})

	test('Обрабатывать number', () => {
		const body = 123

		const result = formattedBody(body)

		expect(result).toBe('123')
	})

	test('Сериализовать объекты в JSON', () => {
		const body = { key: 'value' }

		const result = formattedBody(body)

		expect(result).toBe('{"key":"value"}')
	})

	test('Возвращать undefined, если тело не задано', () => {
		const result = formattedBody(undefined)

		expect(result).toBeUndefined()
	})
})
